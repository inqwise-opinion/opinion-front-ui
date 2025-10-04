/**
 * Mock Session Authentication Provider - Development Implementation
 * 
 * Concrete implementation of SessionAuthProvider interface for development and testing.
 * Uses MockApiService for authentication operations and provides realistic multi-account
 * simulation for testing session-based authentication scenarios.
 * 
 * Features:
 * - Works with MockApiService for user validation
 * - Simulates multi-tenant account management
 * - Provides realistic authentication delays
 * - Supports account switching simulation
 * - Implements Service interface for LayoutContext registration
 * 
 * Usage:
 * ```typescript
 * const authProvider = new MockSessionAuthProvider(mockApiService);
 * await authProvider.init(); // Initialize the service
 * 
 * const user = await authProvider.getCurrentUser();
 * const accounts = await authProvider.getAccounts();
 * await authProvider.switchAccount(accounts[1].id);
 * ```
 */

import { SessionAuthProvider, Account } from './SessionAuthProvider';
import { AuthenticationError } from './exceptions/AuthenticationExceptions';
import { MockApiService } from '../services/MockApiService';
import { User } from '../types';
import type { ServiceConfig } from '../interfaces/Service';
import { SelfIdentifyingService, validateServiceIdentity } from '../core/ServiceIdentity';

/**
 * Configuration for MockSessionAuthProvider
 */
export interface MockSessionAuthProviderConfig extends ServiceConfig {
  /** Simulate authentication delay in milliseconds (default: 500) */
  authDelay?: number;
  /** Enable account switching simulation (default: true) */
  enableAccountSwitching?: boolean;
  /** Number of mock accounts to generate (default: 3) */
  mockAccountCount?: number;
}

/**
 * Mock session authentication provider implementation
 * 
 * Provides a concrete implementation of SessionAuthProvider for development.
 * Uses MockApiService for user validation and simulates account management.
 */
export class MockSessionAuthProvider implements SessionAuthProvider, SelfIdentifyingService {
  // 🎯 SELF-DECLARED IDENTITY CONSTANTS
  static readonly SERVICE_ID = 'mock.session-auth-provider' as const;
  static readonly SERVICE_DESCRIPTION = 'Mock session-based authentication provider for development';
  static readonly SERVICE_DEPENDENCIES = [] as const; // No dependencies
  private readonly mockConfig: Required<MockSessionAuthProviderConfig>;
  private readonly mockApiService: MockApiService;
  private currentUser: User | null = null;
  private currentAccountId: number | null = null;
  private mockAccounts: Account[] = [];
  private initialized = false;
  private destroyed = false;
  
  constructor(
    mockApiService: MockApiService, 
    config: MockSessionAuthProviderConfig = {}
  ) {
    this.mockConfig = {
      autoInit: true,
      allowReplace: false,
      initTimeout: 5000,
      authDelay: 500,
      enableAccountSwitching: true,
      mockAccountCount: 3,
      ...config,
    };
    
    this.mockApiService = mockApiService;
    
    // Validate this service implements required identity interface
    validateServiceIdentity(MockSessionAuthProvider, this);
    
    this.log('🔐', 'MockSessionAuthProvider created', {
      serviceId: MockSessionAuthProvider.SERVICE_ID,
      authDelay: this.mockConfig.authDelay,
      accountSwitching: this.mockConfig.enableAccountSwitching,
      accountCount: this.mockConfig.mockAccountCount
    });
  }
  
  /**
   * Get service identifier for registration
   */
  getServiceId(): string {
    return MockSessionAuthProvider.SERVICE_ID;
  }
  
  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    await this.simulateDelay();
    return this.currentUser !== null;
  }
  
  /**
   * Get current authenticated user
   * 
   * @returns Promise<User> - current user data
   * @throws AuthenticationError if not authenticated
   */
  async getCurrentUser(): Promise<User> {
    await this.simulateDelay();
    
    this.log('🔍', 'Getting current user...');
    
    try {
      // Use MockApiService to validate user (simulates server call)
      const authInfo = await this.mockApiService.validateUser();
      const user = authInfo.userInfo;
      
      // Cache the user and account context
      this.currentUser = user;
      if (authInfo.accountId) {
        this.currentAccountId = authInfo.accountId;
      }
      
      this.log('✅', 'Current user retrieved successfully', {
        userId: user.id,
        username: user.username,
        email: user.email,
        accountId: authInfo.accountId
      });
      
      return user;
      
    } catch (error) {
      // Clear cached state on failure
      this.currentUser = null;
      this.currentAccountId = null;
      
      const authError = error instanceof AuthenticationError
        ? error
        : new AuthenticationError('User validation failed', error as Error);
      
      this.log('❌', 'Failed to get current user', { error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Initiate login process
   * 
   * For mock implementation, this simulates a successful login
   * by calling validateUser and caching the result.
   */
  async login(): Promise<void> {
    await this.simulateDelay();
    
    this.log('🚪', 'Initiating mock login...');
    
    try {
      // For mock purposes, just validate current user
      await this.getCurrentUser();
      
      this.log('✅', 'Mock login completed successfully');
      
    } catch (error) {
      const authError = error instanceof AuthenticationError
        ? error
        : new AuthenticationError('Mock login failed', error as Error);
      
      this.log('❌', 'Mock login failed', { error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Perform logout
   * 
   * Clears all cached authentication state.
   */
  async logout(): Promise<void> {
    await this.simulateDelay();
    
    const wasAuthenticated = this.currentUser !== null;
    const previousUser = this.currentUser?.username;
    
    this.log('🚪', 'Performing mock logout...', { wasAuthenticated, previousUser });
    
    try {
      // Clear all cached state
      this.currentUser = null;
      this.currentAccountId = null;
      
      this.log('✅', 'Mock logout completed successfully', { previousUser });
      
    } catch (error) {
      const authError = new AuthenticationError('Mock logout failed', error as Error);
      
      this.log('❌', 'Mock logout failed', { error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Get available accounts for current authenticated user
   * 
   * @returns Promise<Account[]> - array of available accounts
   * @throws AuthenticationError if not authenticated
   */
  async getAccounts(): Promise<Account[]> {
    await this.simulateDelay();
    
    if (!await this.isAuthenticated()) {
      throw new AuthenticationError('User not authenticated - cannot retrieve accounts');
    }
    
    this.log('📋', 'Getting user accounts...');
    
    try {
      // Return cached mock accounts
      this.log('✅', 'Accounts retrieved successfully', {
        accountCount: this.mockAccounts.length
      });
      
      return [...this.mockAccounts]; // Return copy
      
    } catch (error) {
      const authError = new AuthenticationError('Failed to retrieve accounts', error as Error);
      
      this.log('❌', 'Account retrieval failed', { error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Switch to a different account context
   * 
   * @param accountId - ID of the account to switch to
   * @throws AuthenticationError if not authenticated or switch fails
   */
  async switchAccount(accountId: number): Promise<void> {
    await this.simulateDelay();
    
    if (!await this.isAuthenticated()) {
      throw new AuthenticationError('User not authenticated - cannot switch accounts');
    }
    
    if (!this.mockConfig.enableAccountSwitching) {
      throw new AuthenticationError('Account switching is disabled in mock configuration');
    }
    
    this.log('🔄', 'Switching account...', { accountId });
    
    try {
      // Validate account exists
      const targetAccount = this.mockAccounts.find(acc => acc.id === accountId);
      if (!targetAccount) {
        throw new AuthenticationError(`Account with ID ${accountId} not found or access denied`);
      }
      
      // Update current account context
      this.currentAccountId = accountId;
      
      this.log('✅', 'Account switch successful', {
        accountId,
        accountName: targetAccount.name
      });
      
    } catch (error) {
      const authError = error instanceof AuthenticationError
        ? error
        : new AuthenticationError(`Account switch to ${accountId} failed`, error as Error);
      
      this.log('❌', 'Account switch failed', { accountId, error: authError.message });
      throw authError;
    }
  }
  
  /**
   * Get current active account ID
   * 
   * @returns Promise<number | null> - current account ID or null
   */
  async getCurrentAccountId(): Promise<number | null> {
    await this.simulateDelay(100); // Shorter delay for account ID check
    
    try {
      return this.currentAccountId;
    } catch (error) {
      this.log('⚠️', 'Failed to get current account ID', { error });
      return null;
    }
  }
  
  // Service interface implementations
  
  /**
   * Initialize MockSessionAuthProvider
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.log('⚠️', 'MockSessionAuthProvider already initialized');
      return;
    }
    
    this.log('🚀', 'Initializing MockSessionAuthProvider...');
    
    // Generate mock accounts
    this.generateMockAccounts();
    
    // Set default account context
    if (this.mockAccounts.length > 0) {
      this.currentAccountId = this.mockAccounts[0].id;
    }
    
    this.initialized = true;
    
    this.log('✅', 'MockSessionAuthProvider initialized successfully', {
      accountCount: this.mockAccounts.length,
      defaultAccountId: this.currentAccountId
    });
  }
  
  /**
   * Cleanup MockSessionAuthProvider resources
   */
  async destroy(): Promise<void> {
    if (this.destroyed) {
      this.log('⚠️', 'MockSessionAuthProvider already destroyed');
      return;
    }
    
    this.log('🧹', 'Destroying MockSessionAuthProvider...');
    
    // Clear all state
    this.currentUser = null;
    this.currentAccountId = null;
    this.mockAccounts = [];
    this.destroyed = true;
    this.initialized = false;
    
    this.log('✅', 'MockSessionAuthProvider destroyed successfully');
  }
  
  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && !this.destroyed;
  }
  
  /**
   * Simple logging method
   */
  private log(prefix: string, message: string, data?: unknown): void {
    const serviceId = this.getServiceId();
    if (data) {
      console.log(`${prefix} [${serviceId}] ${message}`, data);
    } else {
      console.log(`${prefix} [${serviceId}] ${message}`);
    }
  }
  
  // Private helper methods
  
  /**
   * Generate mock accounts for testing
   */
  private generateMockAccounts(): void {
    this.mockAccounts = [];
    
    for (let i = 1; i <= this.mockConfig.mockAccountCount; i++) {
      this.mockAccounts.push({
        id: i,
        name: this.getMockAccountName(i)
      });
    }
    
    this.log('🏢', 'Generated mock accounts', {
      accounts: this.mockAccounts.map(acc => `${acc.id}: ${acc.name}`)
    });
  }
  
  /**
   * Get mock account name based on ID
   */
  private getMockAccountName(accountId: number): string {
    const accountNames = [
      'Acme Corporation',
      'Tech Innovations Ltd',
      'Global Solutions Inc',
      'Digital Ventures LLC',
      'Enterprise Systems Co',
      'Innovation Hub Ltd'
    ];
    
    return accountNames[accountId - 1] || `Test Account ${accountId}`;
  }
  
  /**
   * Simulate authentication delay for realistic testing
   */
  private async simulateDelay(customDelay?: number): Promise<void> {
    const delay = customDelay ?? this.mockConfig.authDelay;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  /**
   * Get a ServiceReference for safely accessing registered MockSessionAuthProvider
   * 
   * @param context - The LayoutContext to resolve from
   * @param config - Optional configuration for the ServiceReference
   * @returns Promise<ServiceReference<MockSessionAuthProvider>> for lazy resolution
   */
  static async getRegisteredReference(
    context: unknown, // LayoutContext - avoiding import cycle
    config?: unknown // ServiceReferenceConfig - avoiding import cycle
  ): Promise<unknown> { // ServiceReference<MockSessionAuthProvider> - avoiding import cycle
    const { ServiceReference } = await import('../services/ServiceReference');
    return new ServiceReference(
      context as any,
      'mock-session-auth-provider', // Standard service key
      config as any
    );
  }
}