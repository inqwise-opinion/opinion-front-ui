/**
 * Identifiable Service Pattern
 * 
 * Base classes that enforce centralized service identity management.
 * All services must declare their identity through the ServiceIdentityRegistry.
 */

import { BaseService } from '../services/BaseService';
import { SERVICE_IDS, ServiceIdentityRegistry, type ServiceId } from './ServiceIdentity';
import type { LayoutContext } from '../contexts/LayoutContext';
import type { Service, ServiceConfig } from '../interfaces/Service';

/**
 * Abstract base for all identifiable services
 */
export abstract class IdentifiableService extends BaseService {
  protected readonly serviceId: ServiceId;
  
  constructor(serviceId: ServiceId, context: LayoutContext, config: ServiceConfig = {}) {
    super(context, config);
    
    // Validate service ID is registered
    if (!ServiceIdentityRegistry.has(serviceId)) {
      throw new Error(
        `Service ID '${serviceId}' is not registered in ServiceIdentityRegistry. ` +
        `Please register it before using. Available services: ${Array.from(ServiceIdentityRegistry.getAll().keys()).join(', ')}`
      );
    }
    
    this.serviceId = serviceId;
    const identity = ServiceIdentityRegistry.get(serviceId)!;
    
    this.log('🆔', `Service created`, { 
      serviceId,
      description: identity.SERVICE_DESCRIPTION || 'No description'
    });
  }
  
  /**
   * Get service identifier - implementation of abstract method
   */
  getServiceId(): string {
    return this.serviceId;
  }
  
  /**
   * Get service identity metadata
   */
  getServiceIdentity() {
    return ServiceIdentityRegistry.get(this.serviceId)!;
  }
  
  /**
   * Validate all dependencies are available in context
   */
  protected validateDependencies(): string[] {
    const missing = ServiceIdentityRegistry.validateDependencies(this.serviceId);
    const available = this.getContext().getServiceNames();
    
    return missing.filter(depId => !available.includes(depId));
  }
  
  /**
   * Get dependency services in correct initialization order
   */
  protected getDependencyGraph(): string[] {
    return ServiceIdentityRegistry.getDependencyGraph(this.serviceId);
  }
  
  /**
   * Type-safe service resolution with identity validation
   */
  protected getIdentifiedService<T>(serviceId: ServiceId): T | null {
    if (!ServiceIdentityRegistry.has(serviceId)) {
      this.log('❌', `Service ID '${serviceId}' not registered in identity registry`);
      return null;
    }
    
    const service = this.getService(serviceId) as T;
    if (!service) {
      this.log('⚠️', `Service '${serviceId}' not found in LayoutContext`, {
        available: this.getContext().getServiceNames()
      });
    }
    
    return service;
  }
}

/**
 * Service registration helpers with identity validation
 */
export class ServiceRegistrar {
  /**
   * Register service with identity validation
   */
  static register<T extends Service>(context: LayoutContext, serviceId: ServiceId, service: T): void {
    if (!ServiceIdentityRegistry.has(serviceId)) {
      throw new Error(`Cannot register service '${serviceId}' - not found in ServiceIdentityRegistry`);
    }
    
    const identity = ServiceIdentityRegistry.get(serviceId)!;
    console.log(`📝 Registering service: ${serviceId}`);
    
    context.registerService(serviceId, service);
  }
  
  /**
   * Batch register services with dependency validation
   */
  static registerBatch(context: LayoutContext, services: Array<{ id: ServiceId, instance: any }>): void {
    // Validate all services are registered in identity registry
    for (const { id } of services) {
      if (!ServiceIdentityRegistry.has(id)) {
        throw new Error(`Service ID '${id}' not found in ServiceIdentityRegistry`);
      }
    }
    
    // Sort by dependency order
    const sortedServices = services.sort((a, b) => {
      const aDeps = ServiceIdentityRegistry.getDependencyGraph(a.id);
      const bDeps = ServiceIdentityRegistry.getDependencyGraph(b.id);
      return aDeps.length - bDeps.length;
    });
    
    // Register in correct order
    for (const { id, instance } of sortedServices) {
      this.register(context, id, instance);
    }
    
    console.log(`✅ Batch registered ${services.length} services in dependency order`);
  }
  
  /**
   * Type-safe service resolution
   */
  static resolve<T>(context: LayoutContext, serviceId: ServiceId): T | null {
    if (!ServiceIdentityRegistry.has(serviceId)) {
      console.warn(`Service ID '${serviceId}' not found in ServiceIdentityRegistry`);
      return null;
    }
    
    return context.getService(serviceId) as T;
  }
}