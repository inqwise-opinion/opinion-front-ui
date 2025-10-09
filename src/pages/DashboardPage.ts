/**
 * Dashboard Page - All-in-one Dashboard Implementation
 * Gets services from LayoutContext and handles all dashboard functionality
 */

import { PageComponent } from '../components/PageComponent';
import MainContentImpl from '../components/MainContentImpl';
import type { PageContext } from '../interfaces/PageContext';
import { MockApiService, ChartData, AuthenticationInfo } from '../services/MockApiService';
import { Survey, User } from '../types';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';
import '../assets/styles/dashboard.scss';

export interface DashboardState {
  user?: User;
  accountId?: number;
  surveys: Survey[];
  selectedSurveyId: number;
  fromDate?: string;
  toDate?: string;
  statusFilter: number;
  comparisonFilter: number;
}

export interface ChartConfig {
  started: Array<[number, number]>;
  completed: Array<[number, number]>;
  partial: Array<[number, number]>;
  disqualified: Array<[number, number]>;
}

export class DashboardPage extends PageComponent {
  private state: DashboardState;
  private chartInstance: any; // Will be Highcharts instance
  private apiService: MockApiService | null = null;
  protected logger: Logger;

  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageTitle: 'Dashboard - Opinion',
      pageId: 'dashboard'
    });

    this.state = {
      surveys: [],
      selectedSurveyId: 0,
      statusFilter: 1, // Started
      comparisonFilter: 0 // None
    };

    this.logger = LoggerFactory.getInstance().getLogger('DashboardPage');
  }

  /**
   * Initialize the dashboard page
   */
  protected async onInit(): Promise<void> {
    try {
      this.logger.info('Initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
      }

      // Get MockApiService from LayoutContext
      const layoutContext = this.layoutContext;
      this.apiService = layoutContext.getService(MockApiService.SERVICE_ID) as MockApiService;
      
      if (!this.apiService) {
        throw new Error('MockApiService not available in LayoutContext');
      }

      // Create dashboard content programmatically
      this.createDashboardContent();

      // Authenticate user
      const auth = await this.authenticateUser();
      this.state.user = auth.userInfo;
      
      // Set account ID from cookie or user info
      this.state.accountId = this.getAccountId(auth);
      
      // Update UI with user info
      this.updateUserInterface();
      
      // Load surveys
      await this.loadSurveys();
      
      // Initialize date range (default to today)
      this.initializeDateRange();
      
      // Load initial chart data
      await this.loadActivityChart();
      
      // Show welcome message if needed
      this.checkWelcomeMessage();

      // Set browser tab title
      document.title = "Dashboard - Opinion";
      
      this.logger.info('Ready');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError('Dashboard initialization failed', errorObj);
      this.handleError(error);
    }
  }

  /**
   * Create dashboard content programmatically
   */
  private createDashboardContent(): void {
    try {
      // Create main content structure with header outside page border
      const mainContentHtml = `
        <div class="page-content">
          <!-- Dashboard Header (outside page border) -->
          <div class="dashboard-header" style="background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h1 style="margin: 0 0 10px 0; color: #333;">📊 Dashboard</h1>
            <p style="margin: 0; color: #666;">Welcome to your Opinion Dashboard. Manage your surveys and view analytics from here.</p>
          </div>

          <!-- Dashboard Content (inside page border) -->
          <div class="main-content-card">
            <!-- Quick Actions Section -->
            <div class="content-container" style="margin-bottom: 24px;">
              <h3 style="margin-bottom: 16px; color: #333;">Quick Actions</h3>
              <div class="main-content-flex-row">
                <button id="button_create_survey" class="button-green">Create Survey</button>
              </div>
            </div>

          <!-- Chart Section -->
          <div class="content-container" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 12px;">Survey Analytics</h3>
            
            <!-- Survey Selection -->
            <div class="main-content-flex-row" style="margin-bottom: 16px; align-items: center;">
              <label for="select_surveys" style="margin-right: 12px;">Survey:</label>
              <select id="select_surveys" style="margin-right: 16px;">
                <option value="0">All surveys</option>
              </select>
              
              <div id="datepicker_date_range_value" style="margin-left: auto; color: #666;">Today</div>
            </div>
            
            <!-- Statistics Row -->
            <div class="main-content-flex-row" style="margin-bottom: 16px; gap: 24px;">
              <div style="text-align: center;">
                <div class="label-started" style="font-size: 24px; font-weight: bold; color: #007bff;">0</div>
                <div style="font-size: 14px; color: #666;">Started</div>
              </div>
              <div style="text-align: center;">
                <div class="label-completed" style="font-size: 24px; font-weight: bold; color: #28a745;">0</div>
                <div style="font-size: 14px; color: #666;">Completed</div>
              </div>
              <div style="text-align: center;">
                <div class="label-partial" style="font-size: 24px; font-weight: bold; color: #ffc107;">0</div>
                <div style="font-size: 14px; color: #666;">Partial</div>
              </div>
              <div style="text-align: center;">
                <div class="label-completion-rate" style="font-size: 24px; font-weight: bold; color: #17a2b8;">0.00%</div>
                <div style="font-size: 14px; color: #666;">Completion Rate</div>
              </div>
            </div>
            
            <!-- Chart Container -->
            <div id="chart" style="height: 400px; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;">
              Chart will be displayed here
            </div>
          </div>

          <!-- Recent Surveys Section -->
          <div class="content-container">
            <h3 style="margin-bottom: 12px;">Recent Surveys</h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">ID</th>
                    <th style="padding: 12px 8px; text-align: center; font-weight: 600;">Status</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Title</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Started</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Completed</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Rate</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Partial</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">DQ</th>
                    <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Avg Time</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Status</th>
                    <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Modified</th>
                  </tr>
                </thead>
                <tbody id="survey_table_body">
                  <tr>
                    <td colspan="11" style="padding: 20px; text-align: center; color: #666;">Loading surveys...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Welcome container (for new users with no surveys) -->
          <div id="container_welcome" style="display: none; text-align: center; padding: 40px; background-color: #f8f9fa; border-radius: 8px; margin-top: 24px;">
            <h3 style="color: #333; margin-bottom: 16px;">Welcome to Opinion!</h3>
            <p style="color: #666; margin-bottom: 24px;">You haven't created any surveys yet. Get started by creating your first survey.</p>
            <button class="button-green">Create Your First Survey</button>
          </div>
          </div>
        </div>
      `;

      // Set content in MainContent component
      this.mainContent.setContent(mainContentHtml);
      this.logger.debug('Dashboard content created programmatically');
      
      // Set up event listeners after content is added to DOM
      this.setupEventListeners();
      
      this.logger.info('Dashboard content ready');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError('Failed to create dashboard content', errorObj);
      throw error;
    }
  }

  /**
   * Set up dashboard-specific event listeners
   * Layout events (sidebar, header, etc.) are handled by Layout system
   */
  protected setupEventListeners(): void {
    // Set up dashboard-specific event listeners
    this.setupDashboardEventListeners();
    this.logger.debug('Dashboard-specific event listeners setup');
  }

  /**
   * Setup dashboard-specific event listeners (data-driven)
   */
  private setupDashboardEventListeners(): void {
    // Survey selection dropdown
    const surveySelect = document.getElementById('select_surveys');
    if (surveySelect) {
      surveySelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.state.selectedSurveyId = parseInt(target.value);
        this.loadActivityChart();
      });
    }

    // Status filter buttons
    const statusButton = document.getElementById('button_status');
    if (statusButton) {
      statusButton.addEventListener('click', () => {
        // Handle status filter toggle
        const currentValue = parseInt(statusButton.dataset.value || '1');
        this.state.statusFilter = currentValue;
        this.loadActivityChart();
      });
    }

    // Create survey button
    const createSurveyButton = document.getElementById('button_create_survey');
    if (createSurveyButton) {
      createSurveyButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.createSurvey();
      });
    }
  }

  /**
   * Cleanup dashboard-specific resources
   */
  protected onDestroy(): void {
    // Cleanup dashboard-specific resources
    if (this.chartInstance) {
      // Destroy Highcharts instance if exists
      try {
        this.chartInstance.destroy();
      } catch (error) {
        this.logger.warn('Error destroying chart:', error instanceof Error ? error : new Error(String(error)));
      }
    }
    this.logger.info('Dashboard page destroyed');
  }

  /**
   * Authenticate user and get account info
   */
  private async authenticateUser(): Promise<AuthenticationInfo> {
    if (!this.apiService) throw new Error('API service not available');
    
    try {
      const auth = await this.apiService.validateUser();
      return auth;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('NotSignedIn')) {
        this.redirectToLogin();
      }
      throw error;
    }
  }

  /**
   * Get account ID from cookie or user info
   */
  private getAccountId(auth: AuthenticationInfo): number {
    // Try to get from cookie first
    const cookieAccountId = this.getCookie('aid');
    
    if (cookieAccountId && auth.accounts) {
      const account = auth.accounts.find(a => a.id.toString() === cookieAccountId);
      if (account) {
        return account.id;
      }
    }
    
    // Fallback to user's default account
    return auth.accountId || auth.userInfo.id;
  }

  /**
   * Load surveys from API
   */
  private async loadSurveys(): Promise<void> {
    if (!this.state.accountId || !this.apiService) return;

    try {
      const response = await this.apiService.getOpinionsList({
        accountId: this.state.accountId,
        top: 100,
        orderByRecent: false
      });

      this.state.surveys = response.list;
      this.updateSurveysList();
      this.updateRecentSurveysTable();
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError('Failed to load surveys', errorObj);
      this.state.surveys = [];
    }
  }

  /**
   * Load activity chart data
   */
  private async loadActivityChart(): Promise<void> {
    if (!this.state.accountId || !this.apiService) return;

    try {
      const chartData = await this.apiService.getActivityChart({
        accountId: this.state.accountId,
        opinionId: this.state.selectedSurveyId || undefined,
        fromDate: this.state.fromDate,
        toDate: this.state.toDate,
        graphBy: 3 // Daily
      });

      this.updateStatistics(chartData);
      this.renderChart(chartData);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logError('Failed to load chart data', errorObj);
    }
  }

  /**
   * Update surveys dropdown and recent surveys table
   */
  private updateSurveysList(): void {
    const surveysSelect = document.getElementById('select_surveys') as HTMLSelectElement;
    if (surveysSelect) {
      // Clear existing options except "All surveys"
      surveysSelect.innerHTML = '<option value="0">All surveys</option>';
      
      // Add survey options
      this.state.surveys.forEach(survey => {
        const option = document.createElement('option');
        option.value = survey.id.toString();
        option.textContent = survey.title;
        surveysSelect.appendChild(option);
      });
    }
  }

  /**
   * Update recent surveys table
   */
  private updateRecentSurveysTable(): void {
    const tableBody = document.getElementById('survey_table_body');
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Get recent surveys (sorted by modify date)
    const recentSurveys = [...this.state.surveys]
      .sort((a, b) => new Date(b.updated || b.created).getTime() - new Date(a.updated || a.created).getTime())
      .slice(0, 5);

    // Add survey rows
    recentSurveys.forEach((survey) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="text-align: right;">${survey.id}</td>
        <td><span class="survey-status ${survey.status || 'draft'}">&nbsp;</span></td>
        <td><a href="/surveys/${survey.id}/edit" title="Edit Survey">${survey.title}</a></td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0.00%</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">0</td>
        <td style="text-align: right;">--</td>
        <td>--</td>
        <td>${this.formatDate(new Date(survey.updated || survey.created))}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  /**
   * Initialize date range (default to today)
   */
  private initializeDateRange(): void {
    const today = new Date();
    this.state.fromDate = this.formatDate(today);
    this.state.toDate = this.formatDate(today);

    // Update date range display
    const dateRangeValue = document.getElementById('datepicker_date_range_value');
    if (dateRangeValue) {
      dateRangeValue.textContent = today.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  /**
   * Check if welcome message should be shown
   */
  private checkWelcomeMessage(): void {
    if (this.state.surveys.length === 0) {
      const welcomeContainer = document.getElementById('container_welcome');
      
      if (welcomeContainer) {
        welcomeContainer.style.display = 'block';
      }
    }
  }

  /**
   * Update user interface with user info
   */
  private updateUserInterface(): void {
    if (!this.state.user) return;

    // Update user info in page elements (layout components handle themselves)
    const usernameElements = document.querySelectorAll('.username, #label_username, #user_menu_name');
    usernameElements.forEach(el => {
      el.textContent = this.state.user?.username || 'User';
    });
    
    // Update sidebar survey counts
    this.updateSidebarCounts();
  }

  /**
   * Update statistics display
   */
  private updateStatistics(data: ChartData): void {
    const total = data.charts.totals.completed + data.charts.totals.partial;
    const completionRate = total > 0 ? (data.charts.totals.completed / total * 100).toFixed(2) : '0.00';

    this.updateElement('.label-started', this.addCommas(total));
    this.updateElement('.label-completed', this.addCommas(data.charts.totals.completed));
    this.updateElement('.label-partial', this.addCommas(data.charts.totals.partial));
    this.updateElement('.label-completion-rate', `${completionRate}%`);
  }

  /**
   * Render chart using chart data
   */
  private renderChart(data: ChartData): void {
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) return;

    // Simple chart rendering (placeholder - would use Highcharts in production)
    chartContainer.innerHTML = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 4px; text-align: center;">
        <p>Chart data loaded successfully</p>
        <p>Started: ${data.charts.totals.completed + data.charts.totals.partial}</p>
        <p>Completed: ${data.charts.totals.completed}</p>
        <p>Partial: ${data.charts.totals.partial}</p>
      </div>
    `;
  }

  /**
   * Update UI counts (since sidebar is removed, this is now a placeholder)
   */
  private updateSidebarCounts(): void {
    // Sidebar removed from dashboard - this method kept for compatibility
    // but no longer updates sidebar counts
  }

  /**
   * Utility methods
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addCommas(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!d))/g, ',');
  }

  private updateElement(selector: string, content: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = content;
    }
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private redirectToLogin(): void {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?ret=${returnUrl}`;
  }

  private handleError(error: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Log with full error details for debugging
    this.logError('Dashboard error', errorObj);
    
    // Show error message to user
    alert(`An error occurred while loading the dashboard: ${errorObj.message}`);
  }

  /**
   * Handle create survey button click
   */
  private createSurvey(): void {
    // Navigate to survey creation page
    window.location.href = '/surveys/create';
  }


  /**
   * Enhanced error logging that shows full error details
   */
  private logError(message: string, error: Error): void {
    // Log to our logger
    this.logger.error(`${message}: ${error.message}`);
    
    // Always log full details to console for debugging
    console.group(`🔥 ${message}`);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', error);
    console.groupEnd();
  }
}

// Global function for feedback (matching original)
declare global {
  function feedback(): void;
}

window.feedback = function(): void {
  console.log('Feedback function called - implement modal');
};

export default DashboardPage;