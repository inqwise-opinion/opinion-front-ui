/**
 * Authentication Service - Core Authentication Orchestrator
 *
 * Base authentication service that orchestrates authentication operations using
 * AuthProvider and publishes events via EventBus for decoupled communication.
 *
 * Design Principles:
 * - Extends BaseService for LayoutContext integration and lifecycle management
 * - No direct UI dependencies - pure service layer
 * - Event-driven communication via EventBus (using publish directly)
 * - AuthProvider dependency resolved through LayoutContext service registry
 * - Minimal configuration, extensible design
 *
 * Service Registration:
 * - Registered with key 'auth' in LayoutContext
 * - Depends on AuthProvider service ('authProvider')
 * - Publishes user.authenticated events on successful operations
 */

import { BaseService } from "../services/BaseService";
import { AuthProvider } from "./AuthProvider";
import { AuthenticatedUser } from "./AuthenticatedUser";
import { AUTH_EVENTS, AuthEventFactory } from "./AuthEvents";
import { AuthenticationError } from "./exceptions/AuthenticationExceptions";
import {
  ServiceReference,
  ServiceReferenceConfig,
} from "../services/ServiceReference";
import { User } from "../types";
import type { LayoutContext } from "../contexts/LayoutContext";
import type { ServiceConfig } from "../interfaces/Service";
import {
  SelfIdentifyingService,
  ServiceIdentity,
  validateServiceIdentity,
} from "../core/ServiceIdentity";
// Import dependencies for type-safe references
import { MockSessionAuthProvider } from "./MockSessionAuthProvider";

/**
 * Authentication service configuration
 */
export interface AuthServiceConfig extends ServiceConfig {
  /** AuthProvider service ID to resolve from LayoutContext */
  authProviderServiceId?: string;
  /** Whether to validate authentication on service initialization (default: false) */
  autoValidate?: boolean;
}

/**
 * Base authentication service implementation
 *
 * Provides core authentication operations and event publication
 * without session-specific features like account management.
 */
export class AuthService extends BaseService implements SelfIdentifyingService {
  // 🎯 SELF-DECLARED IDENTITY CONSTANTS
  static readonly SERVICE_ID = "auth.service" as const;
  static readonly SERVICE_DESCRIPTION =
    "Core authentication service - handles login/logout/validation";
  static readonly SERVICE_DEPENDENCIES = [
    MockSessionAuthProvider.SERVICE_ID,
  ] as const;
  protected readonly authServiceConfig: Required<AuthServiceConfig>;
  protected authProvider: AuthProvider | null = null;
  protected currentUser: AuthenticatedUser | null = null;

  constructor(context: LayoutContext, config: AuthServiceConfig = {}) {
    super(context, config);

    this.authServiceConfig = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authProviderServiceId: MockSessionAuthProvider.SERVICE_ID, // Type-safe reference!
      autoValidate: false,
      ...config,
    };

    // Validate this service implements required identity interface
    validateServiceIdentity(AuthService, this);

    this.log("🔐", "AuthService created", {
      serviceId: AuthService.SERVICE_ID,
      authProviderServiceId: this.authServiceConfig.authProviderServiceId,
      autoValidate: this.authServiceConfig.autoValidate,
      dependencies: AuthService.SERVICE_DEPENDENCIES,
    });
  }

  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return AuthService.SERVICE_ID;
  }

  /**
   * Get current authenticated user (cached)
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is currently authenticated (uses cached state)
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Validate authentication with AuthProvider and update state
   *
   * This method contacts the AuthProvider to validate current authentication,
   * updates internal state, and publishes user.authenticated event on success.
   *
   * @param operation - Operation context for event emission
   * @returns Promise<AuthenticatedUser> - authenticated user data
   * @throws AuthenticationError if not authenticated or validation fails
   */
  async validateAuthentication(
    operation: string = "validation",
  ): Promise<AuthenticatedUser> {
    this.log("🔍", "Validating authentication...", { operation });

    try {
      if (!this.authProvider) {
        throw new AuthenticationError(
          "AuthProvider not available - service may not be initialized",
        );
      }

      // Get current user from AuthProvider (this validates with server)
      const user: User = await this.authProvider.getCurrentUser();

      // Create AuthenticatedUser (base class uses no account context)
      const authenticatedUser = this.createAuthenticatedUser(user);

      // Update internal state
      this.currentUser = authenticatedUser;

      this.log("✅", "Authentication validation successful", {
        userId: user.id,
        username: user.username,
        operation,
      });

      // Publish user authenticated event BEFORE returning (as specified)
      this.publishUserAuthenticatedEvent(authenticatedUser, operation);

      return authenticatedUser;
    } catch (error) {
      // Clear cached state on authentication failure
      this.currentUser = null;

      if (error instanceof AuthenticationError) {
        this.log("❌", "Authentication validation failed", {
          operation,
          error: error.message,
        });
        throw error;
      } else {
        const authError = new AuthenticationError(
          "Authentication validation failed",
          error as Error,
        );
        this.log(
          "❌",
          "Authentication validation failed with unexpected error",
          { operation, error },
        );
        throw authError;
      }
    }
  }

  /**
   * Initiate login process via AuthProvider
   *
   * @throws AuthenticationError if login initiation fails
   */
  async login(): Promise<void> {
    this.log("🚪", "Initiating login...");

    try {
      if (!this.authProvider) {
        throw new AuthenticationError(
          "AuthProvider not available - service may not be initialized",
        );
      }

      await this.authProvider.login();
      this.log("✅", "Login initiated successfully");

      // Note: user.authenticated event will be published later when
      // validateAuthentication is called after login completes
    } catch (error) {
      const authError =
        error instanceof AuthenticationError
          ? error
          : new AuthenticationError("Login initiation failed", error as Error);

      this.log("❌", "Login initiation failed", { error: authError.message });
      throw authError;
    }
  }

  /**
   * Perform logout via AuthProvider and clear state
   *
   * @throws AuthenticationError if logout fails
   */
  async logout(): Promise<void> {
    const wasAuthenticated = this.isAuthenticated();
    const previousUser = this.currentUser;

    this.log("🚪", "Performing logout...", { wasAuthenticated });

    try {
      if (!this.authProvider) {
        throw new AuthenticationError(
          "AuthProvider not available - service may not be initialized",
        );
      }

      await this.authProvider.logout();

      // Clear internal state after successful logout
      this.currentUser = null;

      this.log("✅", "Logout completed successfully", {
        previousUser: previousUser?.username,
      });

      // Note: Future logout event would be published here when approved
    } catch (error) {
      const authError =
        error instanceof AuthenticationError
          ? error
          : new AuthenticationError("Logout failed", error as Error);

      this.log("❌", "Logout failed", { error: authError.message });
      throw authError;
    }
  }

  // Protected methods for extension by subclasses

  /**
   * Create AuthenticatedUser instance - override in subclasses for additional context
   *
   * @param user - Base user information
   * @returns AuthenticatedUser instance
   */
  protected createAuthenticatedUser(user: User): AuthenticatedUser {
    return new AuthenticatedUser(user);
  }

  /**
   * Publish user authenticated event via EventBus
   * Uses EventBus.publish() directly for broadcasting to all consumers
   */
  protected publishUserAuthenticatedEvent(
    user: AuthenticatedUser,
    operation: string,
  ): void {
    try {
      const event = AuthEventFactory.userAuthenticated(user, operation);
      const eventBus = this.getEventBus();

      if (typeof eventBus.publish === "function") {
        eventBus.publish(AUTH_EVENTS.USER_AUTHENTICATED, event.payload);

        this.log("📡", "Published user authenticated event", {
          userId: user.id,
          operation,
        });
      } else {
        this.log("❌", "EventBus.publish method not available");
      }
    } catch (error) {
      this.log("❌", "Failed to publish user authenticated event", { error });
      // Don't throw - event publication failure shouldn't break authentication
    }
  }

  // BaseService template method implementations

  /**
   * Initialize AuthService - resolve AuthProvider dependency
   */
  protected async onInit(): Promise<void> {
    this.log("🚀", "Initializing AuthService...");

    // Resolve AuthProvider using type-safe service ID
    const authProviderServiceId = this.authServiceConfig.authProviderServiceId;
    this.authProvider = this.getService(
      authProviderServiceId,
    ) as unknown as AuthProvider;

    if (!this.authProvider) {
      throw new AuthenticationError(
        `AuthProvider service '${authProviderServiceId}' not found in LayoutContext. ` +
          `Available services: [${this.getContext().getServiceNames().join(", ")}]`,
      );
    }

    this.log("✅", "AuthProvider resolved", { authProviderServiceId });

    // Auto-validate if configured (but don't fail initialization if validation fails)
    if (this.authServiceConfig.autoValidate) {
      try {
        await this.validateAuthentication("initialization");
        this.log("✅", "Auto-validation successful during initialization");
      } catch (error) {
        this.log(
          "⚠️",
          "Auto-validation failed during initialization (continuing)",
          { error },
        );
        // Don't throw - initialization should continue even if user isn't authenticated
      }
    }

    this.log("✅", "AuthService initialized successfully");
  }

  /**
   * Cleanup AuthService resources
   */
  protected async onDestroy(): Promise<void> {
    this.log("🧹", "Destroying AuthService...");

    // Clear cached state
    this.currentUser = null;
    this.authProvider = null;

    this.log("✅", "AuthService destroyed successfully");
  }

  /**
   * Get a ServiceReference for safely accessing registered AuthService
   *
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ServiceReference
   * @returns ServiceReference<AuthService> for lazy resolution
   *
   * @example
   * ```typescript
   * const authRef = AuthService.getRegisteredReference(layoutContext);
   * const authService = await authRef.get(); // Returns AuthService | null
   * if (authService) {
   *   const user = await authService.validateAuthentication();
   * }
   * ```
   */
  static getRegisteredReference(
    context: LayoutContext,
    config?: ServiceReferenceConfig,
  ): ServiceReference<AuthService> {
    return new ServiceReference<AuthService>(
      context,
      AuthService.SERVICE_ID, // Uses own static constant
      config,
    );
  }
}
