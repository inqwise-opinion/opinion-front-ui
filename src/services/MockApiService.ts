/**
 * Mock API Service
 * Provides realistic test data for development until real API is ready
 */

import { Opinion, User } from '../types';

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

export class MockApiService {
  private delay = 500; // Simulate network delay

  constructor() {
    console.log('MockApiService: Using mock data for development');
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
      firstName: 'John',
      lastName: 'Developer',
      role: 'admin',
      created: new Date('2023-01-15').toISOString(),
      updated: new Date().toISOString()
    };
  }

  /**
   * Generate mock survey data
   */
  private createMockSurveys(): Opinion[] {
    const surveys: Opinion[] = [
      {
        id: 101,
        title: 'Customer Satisfaction Survey 2024',
        description: 'Annual customer satisfaction survey to measure service quality',
        status: 'active',
        created: new Date('2024-01-15').toISOString(),
        updated: new Date('2024-02-01').toISOString(),
        responses: 245,
        completionRate: 78.5
      },
      {
        id: 102,
        title: 'Product Feature Feedback',
        description: 'Gather feedback on new product features and improvements',
        status: 'active',
        created: new Date('2024-02-10').toISOString(),
        updated: new Date('2024-02-15').toISOString(),
        responses: 156,
        completionRate: 65.2
      },
      {
        id: 103,
        title: 'Employee Engagement Survey',
        description: 'Internal survey to measure employee satisfaction and engagement',
        status: 'draft',
        created: new Date('2024-03-01').toISOString(),
        updated: new Date('2024-03-05').toISOString(),
        responses: 89,
        completionRate: 45.8
      },
      {
        id: 104,
        title: 'Market Research - Tech Trends',
        description: 'Research on emerging technology trends and market preferences',
        status: 'active',
        created: new Date('2024-03-15').toISOString(),
        updated: new Date('2024-03-20').toISOString(),
        responses: 312,
        completionRate: 82.1
      },
      {
        id: 105,
        title: 'Website Usability Study',
        description: 'User experience survey for website navigation and functionality',
        status: 'completed',
        created: new Date('2024-01-01').toISOString(),
        updated: new Date('2024-01-30').toISOString(),
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
    
    console.log('MockApiService: Validating user...');
    
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
  }): Promise<{ list: Opinion[] }> {
    await this.simulateDelay();
    
    console.log('MockApiService: Fetching opinions list...', params);
    
    let surveys = this.createMockSurveys();
    
    // Apply ordering
    if (params.orderByRecent) {
      surveys = surveys.sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
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
    
    console.log('MockApiService: Fetching activity chart...', params);
    
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
    
    console.log('MockApiService: Sending feedback...', params);
    
    // Simulate successful feedback submission
    console.log('MockApiService: Feedback sent successfully');
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(params: {
    accountId: number;
    showWelcomeMessage?: boolean;
  }): Promise<void> {
    await this.simulateDelay();
    
    console.log('MockApiService: Updating account settings...', params);
    
    // Simulate successful settings update
    console.log('MockApiService: Account settings updated successfully');
  }
}

export default MockApiService;
