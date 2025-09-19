/**
 * Opinion Service
 * Modern TypeScript service for Opinion survey management
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, User, Opinion } from '../types';

export interface OpinionServiceConfig {
  baseUrl: string;
  locale?: string;
  timeout?: number;
}

export interface AuthenticationInfo {
  userInfo: User;
  accounts?: Array<{ id: number; name: string }>;
  accountId?: number;
}

export interface ValidationUserRequest {
  validateUser: {};
}

export interface GetOpinionsListRequest {
  opinions: {
    getList: {
      accountId: number;
      folderId?: number;
      top?: number;
      from?: string;
      to?: string;
      opinionTypeId?: number;
      orderByRecent?: boolean;
    };
  };
}

export interface GetActivityChartRequest {
  opinions: {
    getActivityChart: {
      accountId: number;
      opinionId?: number;
      fromDate?: string;
      toDate?: string;
      tpRangeId?: number;
    };
  };
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

export class OpinionService {
  private client: AxiosInstance;
  private config: OpinionServiceConfig;

  constructor(config?: Partial<OpinionServiceConfig>) {
    this.config = {
      baseUrl: '/api/opinion', // Modern API endpoint
      locale: 'en_US',
      timeout: 10000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication and timestamps
    this.client.interceptors.request.use((config) => {
      const timestamp = Date.now();
      if (config.method === 'get') {
        config.params = { ...config.params, timestamp };
      } else if (config.data) {
        config.data.timestamp = timestamp;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Opinion Service error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current timestamp for requests
   */
  private getTimestamp(): number {
    return Date.now();
  }

  /**
   * Validate current user session
   */
  async validateUser(): Promise<AuthenticationInfo> {
    try {
      const request: ValidationUserRequest = {
        validateUser: {}
      };

      const response: AxiosResponse<{ validateUser: AuthenticationInfo }> = await this.client.get('', {
        params: {
          rq: JSON.stringify(request),
          timestamp: this.getTimestamp()
        }
      });

      if (response.data.validateUser) {
        return response.data.validateUser;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('User validation failed:', error);
      throw error;
    }
  }

  /**
   * Get list of surveys/opinions
   */
  async getOpinionsList(params: {
    accountId: number;
    top?: number;
    orderByRecent?: boolean;
  }): Promise<{ list: Opinion[] }> {
    try {
      const request: GetOpinionsListRequest = {
        opinions: {
          getList: {
            accountId: params.accountId,
            folderId: undefined,
            top: params.top || 100,
            opinionTypeId: 1,
            orderByRecent: params.orderByRecent || false
          }
        }
      };

      const response = await this.client.post('', {
        rq: JSON.stringify(request),
        timestamp: this.getTimestamp()
      });

      if (response.data.opinions?.getList) {
        if (response.data.opinions.getList.error) {
          throw new Error(response.data.opinions.getList.error);
        }
        return response.data.opinions.getList;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to get opinions list:', error);
      throw error;
    }
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
    try {
      const request: GetActivityChartRequest = {
        opinions: {
          getActivityChart: {
            accountId: params.accountId,
            opinionId: params.opinionId,
            fromDate: params.fromDate,
            toDate: params.toDate,
            tpRangeId: params.graphBy || 3
          }
        }
      };

      const response = await this.client.post('', {
        rq: JSON.stringify(request),
        timestamp: this.getTimestamp()
      });

      if (response.data.opinions?.getActivityChart) {
        if (response.data.opinions.getActivityChart.error) {
          throw new Error(response.data.opinions.getActivityChart.error);
        }
        return response.data.opinions.getActivityChart;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to get activity chart:', error);
      throw error;
    }
  }

  /**
   * Send feedback
   */
  async sendFeedback(params: {
    title: string;
    email?: string;
    description: string;
  }): Promise<void> {
    try {
      const request = {
        giveUsYourFeedback: {
          title: params.title,
          email: params.email,
          description: params.description
        }
      };

      const response = await this.client.post('', {
        rq: JSON.stringify(request),
        timestamp: this.getTimestamp()
      });

      if (response.data.giveUsYourFeedback?.error) {
        throw new Error(response.data.giveUsYourFeedback.errorDescription);
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
      throw error;
    }
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(params: {
    accountId: number;
    showWelcomeMessage?: boolean;
  }): Promise<void> {
    try {
      const request = {
        accounts: {
          updateAccountSettings: {
            accountId: params.accountId,
            showWelcomeMessage: params.showWelcomeMessage
          }
        }
      };

      const response = await this.client.post('', {
        rq: JSON.stringify(request),
        timestamp: this.getTimestamp()
      });

      if (response.data.accounts?.updateAccountSettings?.error) {
        throw new Error(response.data.accounts.updateAccountSettings.error);
      }
    } catch (error) {
      console.error('Failed to update account settings:', error);
      throw error;
    }
  }
}

export default OpinionService;
