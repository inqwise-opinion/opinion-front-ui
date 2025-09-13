import { Service } from '@/interfaces/Service';

/**
 * Test service to validate the service registry implementation
 */
export class TestService implements Service {
  private initialized = false;
  private testData: string[] = [];

  constructor(private name: string = 'TestService') {}

  getServiceId(): string {
    return `${this.name}-${Date.now()}`;
  }

  async init(): Promise<void> {
    console.log(`🧪 ${this.name} - Initializing...`);
    
    // Simulate async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.initialized = true;
    this.testData = ['item1', 'item2', 'item3'];
    
    console.log(`✅ ${this.name} - Initialized successfully`);
  }

  async destroy(): Promise<void> {
    console.log(`🧪 ${this.name} - Destroying...`);
    
    this.initialized = false;
    this.testData = [];
    
    console.log(`✅ ${this.name} - Destroyed successfully`);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getData(): string[] {
    if (!this.initialized) {
      throw new Error(`${this.name} is not initialized`);
    }
    return [...this.testData];
  }

  addData(item: string): void {
    if (!this.initialized) {
      throw new Error(`${this.name} is not initialized`);
    }
    this.testData.push(item);
    console.log(`📝 ${this.name} - Added data: ${item}`);
  }

  getName(): string {
    return this.name;
  }
}