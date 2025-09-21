/**
 * Minimal test service for EventBus integration tests
 */
import type { LayoutContext } from '../../src/contexts/LayoutContext';
import type { BaseService } from '../../src/services/BaseService';
import type { Consumer } from '../../src/lib/EventBus';

interface TestResult {
  success: boolean;
  data: {
    operation: string;
    result: string;
    echo?: any;
    processingDelay?: number;
  };
}

export class EventBusTestService implements BaseService {
  private serviceId: string;
  private layout: LayoutContext | null = null;
  private consumers: Consumer[] = [];
  private testEvents: Array<{ event: string; data: any }> = [];
  private receivedEvents = 0;

  constructor(serviceId: string) {
    this.serviceId = serviceId;
  }

  async init(layout: LayoutContext): Promise<void> {
    this.layout = layout;
    
    // Register base event consumers
    this.consumers.push(
      layout.consume('test:broadcast', this.handleBroadcast.bind(this), this.serviceId),
      layout.consume('test:direct-message', this.handleDirectMessage.bind(this), this.serviceId),
      layout.consume('test:request', this.handleRequest.bind(this), this.serviceId),
      layout.consume('test:async-request', this.handleAsyncRequest.bind(this), this.serviceId)
    );
  }

  async destroy(): Promise<void> {
    this.consumers.forEach(consumer => consumer.unregister());
    this.consumers = [];
    this.layout = null;
  }

  getServiceId(): string {
    return this.serviceId;
  }

  // Test event publishers
  testPublish(message: string): void {
    if (!this.layout) throw new Error('Service not initialized');
    this.layout.publish('test:broadcast', { message });
  }

  testSend(message: string): void {
    if (!this.layout) throw new Error('Service not initialized');
    this.layout.send('test:direct-message', { message });
  }

  async testRequest(operation: string, params: any): Promise<TestResult> {
    if (!this.layout) throw new Error('Service not initialized');
    return await this.layout.request('test:request', { operation, params });
  }

  async testAsyncRequest(operation: string, params: any): Promise<TestResult> {
    if (!this.layout) throw new Error('Service not initialized');
    return await this.layout.request('test:async-request', { operation, params });
  }

  // Event handlers
  private handleBroadcast(data: any): void {
    this.receivedEvents++;
    this.testEvents.push({ event: 'test:broadcast', data });
  }

  private handleDirectMessage(data: any): void {
    this.receivedEvents++;
    this.testEvents.push({ event: 'test:direct-message', data });
  }

  private handleRequest(data: any): TestResult {
    return {
      success: true,
      data: {
        operation: data.operation,
        result: `Processed by ${this.serviceId}`,
        echo: data.params
      }
    };
  }

  private async handleAsyncRequest(data: any): Promise<TestResult> {
    const delay = data.params?.delay || 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      success: true,
      data: {
        operation: data.operation,
        result: `Async processed by ${this.serviceId}`,
        echo: data.params,
        processingDelay: delay
      }
    };
  }

  // Test result methods
  getTestResults() {
    return {
      activeConsumers: this.consumers.filter(c => c.isActive()).length,
      receivedEvents: this.receivedEvents,
      events: [...this.testEvents]
    };
  }

  clearTestResults(): void {
    this.testEvents = [];
    this.receivedEvents = 0;
  }
}