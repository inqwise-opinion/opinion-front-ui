/**
 * EventBusTestService - Test service for validating EventBus functionality
 * 
 * This service demonstrates EventBus usage patterns and provides testing utilities
 * for cross-component communication through LayoutContext
 */

import type { Service } from '../interfaces/Service';
import type { Consumer } from '../lib/EventBus';
import type { LayoutContext } from '../contexts/LayoutContext';

export interface EventBusTestData {
  message: string;
  timestamp: number;
  source: string;
}

export interface EventBusRequestData {
  operation: string;
  params?: any;
}

export interface EventBusResponseData {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Test service for EventBus functionality
 * Demonstrates all EventBus communication patterns: PUBLISH, SEND, REQUEST, and CONSUME
 */
export class EventBusTestService implements Service {
  private serviceId: string;
  private layoutContext: LayoutContext | null = null;
  private consumers: Consumer[] = [];
  private receivedEvents: Array<{ event: string; data: any; timestamp: number }> = [];
  private sentResponses: Array<{ event: string; response: any; timestamp: number }> = [];

  constructor(serviceId: string = 'EventBusTestService') {
    this.serviceId = `${serviceId}-${Date.now()}`;
    console.log(`🧪 EventBusTestService - Creating service: ${this.serviceId}`);
  }

  public getServiceId(): string {
    return this.serviceId;
  }

  /**
   * Initialize the service and set up EventBus consumers
   */
  public async init(layoutContext?: LayoutContext): Promise<void> {
    console.log(`🧪 EventBusTestService - Initializing service: ${this.serviceId}`);
    
    if (layoutContext) {
      this.layoutContext = layoutContext;
      this.setupEventBusConsumers();
    }

    console.log(`✅ EventBusTestService - Initialized successfully: ${this.serviceId}`);
  }

  /**
   * Destroy the service and cleanup EventBus consumers
   */
  public async destroy(): Promise<void> {
    console.log(`🧪 EventBusTestService - Destroying service: ${this.serviceId}`);
    
    // Unregister all consumers
    this.consumers.forEach(consumer => {
      if (consumer.isActive()) {
        consumer.unregister();
      }
    });
    this.consumers = [];

    // Clear data
    this.receivedEvents = [];
    this.sentResponses = [];
    this.layoutContext = null;

    console.log(`✅ EventBusTestService - Destroyed successfully: ${this.serviceId}`);
  }

  /**
   * Setup EventBus consumers for testing various event types
   */
  private setupEventBusConsumers(): void {
    if (!this.layoutContext) {
      console.warn(`EventBusTestService - No LayoutContext available for ${this.serviceId}`);
      return;
    }

    // Consumer for broadcast events (PUBLISH pattern)
    const broadcastConsumer = this.layoutContext.consume(
      'test:broadcast',
      (data: EventBusTestData) => {
        console.log(`📢 EventBusTestService ${this.serviceId} - Received broadcast:`, data);
        this.recordReceivedEvent('test:broadcast', data);
      },
      this.serviceId
    );
    this.consumers.push(broadcastConsumer);

    // Consumer for direct messages (SEND pattern)
    const directConsumer = this.layoutContext.consume(
      'test:direct-message',
      (data: EventBusTestData) => {
        console.log(`📤 EventBusTestService ${this.serviceId} - Received direct message:`, data);
        this.recordReceivedEvent('test:direct-message', data);
      },
      this.serviceId
    );
    this.consumers.push(directConsumer);

    // Consumer for request-response pattern (REQUEST pattern)
    const requestConsumer = this.layoutContext.consume(
      'test:request',
      (data: EventBusRequestData): EventBusResponseData => {
        console.log(`📬 EventBusTestService ${this.serviceId} - Processing request:`, data);
        this.recordReceivedEvent('test:request', data);

        const response: EventBusResponseData = {
          success: true,
          data: {
            operation: data.operation,
            result: `Processed by ${this.serviceId}`,
            timestamp: Date.now(),
            echo: data.params
          }
        };

        this.recordSentResponse('test:request', response);
        console.log(`📬 EventBusTestService ${this.serviceId} - Sending response:`, response);
        
        return response;
      },
      this.serviceId
    );
    this.consumers.push(requestConsumer);

    // Consumer for async request-response pattern
    const asyncRequestConsumer = this.layoutContext.consume(
      'test:async-request',
      async (data: EventBusRequestData): Promise<EventBusResponseData> => {
        console.log(`📬 EventBusTestService ${this.serviceId} - Processing async request:`, data);
        this.recordReceivedEvent('test:async-request', data);

        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 100));

        const response: EventBusResponseData = {
          success: true,
          data: {
            operation: data.operation,
            result: `Async processed by ${this.serviceId}`,
            timestamp: Date.now(),
            echo: data.params,
            processingDelay: 100
          }
        };

        this.recordSentResponse('test:async-request', response);
        console.log(`📬 EventBusTestService ${this.serviceId} - Sending async response:`, response);
        
        return response;
      },
      this.serviceId
    );
    this.consumers.push(asyncRequestConsumer);

    console.log(`EventBusTestService ${this.serviceId} - Setup ${this.consumers.length} EventBus consumers`);
  }

  /**
   * Test PUBLISH pattern - broadcast to all consumers
   */
  public testPublish(message: string): void {
    if (!this.layoutContext) {
      throw new Error(`EventBusTestService ${this.serviceId} - No LayoutContext available`);
    }

    const data: EventBusTestData = {
      message,
      timestamp: Date.now(),
      source: this.serviceId
    };

    console.log(`📢 EventBusTestService ${this.serviceId} - Publishing broadcast:`, data);
    this.layoutContext.publish('test:broadcast', data);
  }

  /**
   * Test SEND pattern - send to first consumer only
   */
  public testSend(message: string): void {
    if (!this.layoutContext) {
      throw new Error(`EventBusTestService ${this.serviceId} - No LayoutContext available`);
    }

    const data: EventBusTestData = {
      message,
      timestamp: Date.now(),
      source: this.serviceId
    };

    console.log(`📤 EventBusTestService ${this.serviceId} - Sending direct message:`, data);
    this.layoutContext.send('test:direct-message', data);
  }

  /**
   * Test REQUEST pattern - send and await response
   */
  public async testRequest(operation: string, params?: any): Promise<EventBusResponseData> {
    if (!this.layoutContext) {
      throw new Error(`EventBusTestService ${this.serviceId} - No LayoutContext available`);
    }

    const data: EventBusRequestData = {
      operation,
      params
    };

    console.log(`📬 EventBusTestService ${this.serviceId} - Sending request:`, data);
    try {
      const response = await this.layoutContext.request('test:request', data);
      console.log(`📬 EventBusTestService ${this.serviceId} - Received response:`, response);
      return response;
    } catch (error) {
      console.error(`📬 EventBusTestService ${this.serviceId} - Request failed:`, error);
      throw error;
    }
  }

  /**
   * Test async REQUEST pattern - send and await async response
   */
  public async testAsyncRequest(operation: string, params?: any): Promise<EventBusResponseData> {
    if (!this.layoutContext) {
      throw new Error(`EventBusTestService ${this.serviceId} - No LayoutContext available`);
    }

    const data: EventBusRequestData = {
      operation,
      params
    };

    console.log(`📬 EventBusTestService ${this.serviceId} - Sending async request:`, data);
    try {
      const response = await this.layoutContext.request('test:async-request', data);
      console.log(`📬 EventBusTestService ${this.serviceId} - Received async response:`, response);
      return response;
    } catch (error) {
      console.error(`📬 EventBusTestService ${this.serviceId} - Async request failed:`, error);
      throw error;
    }
  }

  /**
   * Get test results and statistics
   */
  public getTestResults() {
    return {
      serviceId: this.serviceId,
      activeConsumers: this.consumers.filter(c => c.isActive()).length,
      totalConsumers: this.consumers.length,
      receivedEvents: this.receivedEvents.length,
      sentResponses: this.sentResponses.length,
      events: [...this.receivedEvents],
      responses: [...this.sentResponses]
    };
  }

  /**
   * Clear test results
   */
  public clearTestResults(): void {
    this.receivedEvents = [];
    this.sentResponses = [];
    console.log(`EventBusTestService ${this.serviceId} - Test results cleared`);
  }

  /**
   * Record received event
   */
  private recordReceivedEvent(event: string, data: any): void {
    this.receivedEvents.push({
      event,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Record sent response
   */
  private recordSentResponse(event: string, response: any): void {
    this.sentResponses.push({
      event,
      response,
      timestamp: Date.now()
    });
  }
}

export default EventBusTestService;