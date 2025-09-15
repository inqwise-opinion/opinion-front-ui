/**
 * Self-Identifying Service Pattern
 * 
 * Each service/component declares its own identity as static constants.
 * This eliminates hardcoded strings while keeping service identity 
 * ownership with the service itself.
 * 
 * Design Principles:
 * - Each service owns its identity declaration
 * - No central registry required
 * - Import-based dependency resolution
 * - Type-safe service identifiers
 * - Compile-time validation through imports
 */

/**
 * Base interface for services that declare their own identity
 */
export interface SelfIdentifyingService {
  /**
   * Get the service identifier
   */
  getServiceId(): string;
}

/**
 * Static service identity interface
 * Each service class should implement this as static members
 */
export interface ServiceIdentity {
  /**
   * Static service ID constant
   */
  readonly SERVICE_ID: string;
  
  /**
   * Optional: Service description for debugging
   */
  readonly SERVICE_DESCRIPTION?: string;
  
  /**
   * Optional: Service dependencies (other service IDs)
   */
  readonly SERVICE_DEPENDENCIES?: readonly string[];
}

/**
 * Helper type for extracting service ID from service class
 */
export type ExtractServiceId<T> = T extends { SERVICE_ID: infer U } ? U : never;

/**
 * Helper for type-safe service registration
 */
export function registerService<T extends ServiceIdentity>(
  context: any,
  ServiceClass: T,
  instance: any
): void {
  const serviceId = ServiceClass.SERVICE_ID;
  context.registerService(serviceId, instance);
  console.log(`📝 Registered service: ${serviceId}`);
}

/**
 * Helper for type-safe service resolution
 */
export function resolveService<T extends ServiceIdentity, R>(
  context: any,
  ServiceClass: T
): R | null {
  const serviceId = ServiceClass.SERVICE_ID;
  return context.getService(serviceId) as R;
}

/**
 * Validation helper to ensure service implements required identity
 */
export function validateServiceIdentity<T>(
  ServiceClass: any,
  instance: T
): asserts ServiceClass is ServiceIdentity {
  if (!ServiceClass.SERVICE_ID || typeof ServiceClass.SERVICE_ID !== 'string') {
    throw new Error(
      `Service class must declare static SERVICE_ID constant. ` +
      `Found: ${ServiceClass.name || 'Unknown'}`
    );
  }
  
  if (instance && typeof (instance as any).getServiceId !== 'function') {
    throw new Error(
      `Service instance must implement getServiceId() method. ` +
      `Service: ${ServiceClass.SERVICE_ID}`
    );
  }
}

/**
 * Development helper to list service dependencies
 */
export function listServiceDependencies<T extends ServiceIdentity>(ServiceClass: T): void {
  console.group(`🔍 ${ServiceClass.SERVICE_ID} Dependencies`);
  console.log(`Description: ${ServiceClass.SERVICE_DESCRIPTION || 'No description'}`);
  if (ServiceClass.SERVICE_DEPENDENCIES && ServiceClass.SERVICE_DEPENDENCIES.length > 0) {
    console.log(`Dependencies: [${ServiceClass.SERVICE_DEPENDENCIES.join(', ')}]`);
  } else {
    console.log('Dependencies: None');
  }
  console.groupEnd();
}

// Legacy compatibility exports
export type ServiceId = string;

// Legacy SERVICE_IDS object for backward compatibility
export const SERVICE_IDS = {
  // Add service IDs as needed for backward compatibility
} as const;

// Legacy ServiceIdentityRegistry class for backward compatibility  
export class ServiceIdentityRegistry {
  private static services = new Map<string, ServiceIdentity>();
  
  static register<T extends ServiceIdentity>(ServiceClass: T): void {
    this.services.set(ServiceClass.SERVICE_ID, ServiceClass);
  }
  
  static get(serviceId: string): ServiceIdentity | undefined {
    return this.services.get(serviceId);
  }
  
  static has(serviceId: string): boolean {
    return this.services.has(serviceId);
  }
  
  static list(): ServiceIdentity[] {
    return Array.from(this.services.values());
  }
  
  static getAll(): Map<string, ServiceIdentity> {
    return new Map(this.services);
  }
  
  static validateDependencies(serviceId: string): string[] {
    const service = this.services.get(serviceId);
    return service?.SERVICE_DEPENDENCIES ? [...service.SERVICE_DEPENDENCIES] : [];
  }
  
  static getDependencyGraph(serviceId: string): string[] {
    const dependencies = this.validateDependencies(serviceId);
    const graph: string[] = [];
    
    for (const dep of dependencies) {
      graph.push(dep);
      const subDeps = this.getDependencyGraph(dep);
      graph.push(...subDeps);
    }
    
    return [...new Set(graph)]; // Remove duplicates
  }
}
