/**
 * Mock API Service
 * Provides realistic test data for development until real API is ready
 */

import { Survey, User, UserRole, OpinionStatus } from '../types';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';
import type { Service } from '../interfaces/Service';

export interface AuthenticationInfo {
  userInfo: User;
  accounts?: Array<{ id: number; name: string }>;
  accountId?: number;
}

export interface ChartData {
  charts: {
    completed: Array<[string, number]>;
    partial: Array<[string, number]>;
    totals: {
      completed: number;
      partial: number;
    };
  };
}

export class MockApiService implements Service {
  // Static service identity
  static readonly SERVICE_ID = 'MockApiService';
  static readonly SERVICE_DESCRIPTION = 'Mock API service for development and testing';
  
  private delay = 500; // Simulate network delay
  private readonly logger: Logger;
  private initialized = false;

  constructor() {
    this.logger = LoggerFactory.getInstance().getLogger('MockApiService');
    this.logger.info('Using mock data for development');
  }

  /**
   * Get service ID (Service interface implementation)
   */
  getServiceId(): string {
    return MockApiService.SERVICE_ID;
  }

  /**
   * Initialize the service (Service interface implementation)
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.logger.info('Initializing MockApiService...');
    this.initialized = true;
  }

  /**
   * Check if service is ready (Service interface implementation)
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Destroy the service (Service interface implementation)
   */
  async destroy(): Promise<void> {
    this.logger.info('Destroying MockApiService...');
    this.initialized = false;
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Generate mock user data
   */
  private createMockUser(): User {
    return {
      id: 1001,
      username: 'john.developer',
      email: 'john@example.com',
      role: UserRole.ADMIN,
      created: new Date('2023-01-15'),
      lastLogin: new Date()
    };
  }

  /**
   * Generate mock survey data
   */
  private createMockSurveys(): Survey[] {
    const surveys: Survey[] = [
      {
        id: 101,
        title: 'Customer Satisfaction Survey 2024',
        description: 'Annual customer satisfaction survey to measure service quality',
        status: OpinionStatus.ACTIVE,
        created: new Date('2024-01-15'),
        updated: new Date('2024-02-01'),
        responses: 245,
        completionRate: 78.5
      },
      {
        id: 102,
        title: 'Product Feature Feedback',
        description: 'Gather feedback on new product features and improvements',
        status: OpinionStatus.ACTIVE,
        created: new Date('2024-02-10'),
        updated: new Date('2024-02-15'),
        responses: 156,
        completionRate: 65.2
      },
      {
        id: 103,
        title: 'Employee Engagement Survey',
        description: 'Internal survey to measure employee satisfaction and engagement',
        status: OpinionStatus.DRAFT,
        created: new Date('2024-03-01'),
        updated: new Date('2024-03-05'),
        responses: 89,
        completionRate: 45.8
      },
      {
        id: 104,
        title: 'Market Research - Tech Trends',
        description: 'Research on emerging technology trends and market preferences',
        status: OpinionStatus.ACTIVE,
        created: new Date('2024-03-15'),
        updated: new Date('2024-03-20'),
        responses: 312,
        completionRate: 82.1
      },
      {
        id: 105,
        title: 'Website Usability Study',
        description: 'User experience survey for website navigation and functionality',
        status: OpinionStatus.COMPLETED,
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-30'),
        responses: 189,
        completionRate: 91.3
      }
    ];

    return surveys;
  }

  /**
   * Generate mock chart data
   */
  private createMockChartData(): ChartData {
    const now = new Date();
    const days = 30;
    const completed: Array<[string, number]> = [];
    const partial: Array<[string, number]> = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate realistic random data
      const completedCount = Math.floor(Math.random() * 25) + 5;
      const partialCount = Math.floor(Math.random() * 15) + 2;
      
      completed.push([dateStr, completedCount]);
      partial.push([dateStr, partialCount]);
    }

    const totalCompleted = completed.reduce((sum, [, count]) => sum + count, 0);
    const totalPartial = partial.reduce((sum, [, count]) => sum + count, 0);

    return {
      charts: {
        completed,
        partial,
        totals: {
          completed: totalCompleted,
          partial: totalPartial
        }
      }
    };
  }

  /**
   * Validate current user session
   */
  async validateUser(): Promise<AuthenticationInfo> {
    await this.simulateDelay();
    
    this.logger.debug('Validating user...');
    
    const user = this.createMockUser();
    
    return {
      userInfo: user,
      accounts: [
        { id: 1, name: 'Development Account' },
        { id: 2, name: 'Testing Account' }
      ],
      accountId: 1
    };
  }

  /**
   * Get list of surveys/opinions
   */
  async getOpinionsList(params: {
    accountId: number;
    top?: number;
    orderByRecent?: boolean;
  }): Promise<{ list: Survey[] }> {
    await this.simulateDelay();
    
    this.logger.debug('Fetching opinions list...', params);
    
    let surveys = this.createMockSurveys();
    
    // Apply ordering
    if (params.orderByRecent) {
      surveys = surveys.sort((a, b) => 
        (b.updated?.getTime() ?? 0) - (a.updated?.getTime() ?? 0)
      );
    }
    
    // Apply limit
    if (params.top && params.top > 0) {
      surveys = surveys.slice(0, params.top);
    }
    
    return { list: surveys };
  }

  /**
   * Get activity chart data
   */
  async getActivityChart(params: {
    accountId: number;
    opinionId?: number;
    fromDate?: string;
    toDate?: string;
    graphBy?: number;
  }): Promise<ChartData> {
    await this.simulateDelay();
    
    this.logger.debug('Fetching activity chart...', params);
    
    return this.createMockChartData();
  }

  /**
   * Send feedback
   */
  async sendFeedback(params: {
    title: string;
    email?: string;
    description: string;
  }): Promise<void> {
    await this.simulateDelay();
    
    this.logger.debug('Sending feedback...', params);
    
    // Simulate successful feedback submission
    this.logger.info('Feedback sent successfully');
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(params: {
    accountId: number;
    showWelcomeMessage?: boolean;
  }): Promise<void> {
    await this.simulateDelay();
    
    this.logger.debug('Updating account settings...', params);
    
    // Simulate successful settings update
    this.logger.info('Account settings updated successfully');
  }
}

export default MockApiService;
