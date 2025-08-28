/**
 * Dashboard Page Controller
 * TypeScript migration of dashboard functionality
 */

import { MockApiService, ChartData, AuthenticationInfo } from '../services/MockApiService';
import { Opinion, User } from '../types';
import Layout from '../components/Layout';
import { DashboardPageComponent } from './DashboardPageComponent';

export interface DashboardState {
  user?: User;
  accountId?: number;
  surveys: Opinion[];
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

export class Dashboard {
  private state: DashboardState;
  private chartInstance: any; // Will be Highcharts instance
  private loader: any;
  private apiService: MockApiService;
  private layout: Layout;
  private pageComponent: DashboardPageComponent;

  constructor(apiService: MockApiService) {
    this.apiService = apiService;
    this.layout = new Layout({
      header: {
        enabled: true,
        brandTitle: 'Opinion',
        brandHref: '/dashboard'
      },
      sidebar: {
        enabled: true
      },
      footer: {
        enabled: true,
        showCopyright: true,
        copyrightText: '© 2024 Inqwise Ltd',
        showNavigation: true,
        navigationLinks: [
          { href: '/create-bug-report', title: 'Report a Bug', text: 'Report a Bug' }
        ]
      }
    });
    this.state = {
      surveys: [],
      selectedSurveyId: 0,
      statusFilter: 1, // Started
      comparisonFilter: 0 // None
    };

    this.initializeLoader();
  }

  /**
   * Initialize dashboard
   */
  async init(): Promise<void> {
    console.log('Dashboard - Initializing...');
    
    try {
      // Show loader
      this.showLoader();

      // Initialize layout (which includes header, sidebar, and footer)
      await this.layout.init();
      console.log('Dashboard - Layout initialized, footer should be visible');
      
      // Initialize page component with layout
      this.pageComponent = new DashboardPageComponent({ layout: this.layout });
      await this.pageComponent.init();
      console.log('Dashboard - Page component initialized');

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
      
      // Set up dashboard-specific event listeners (data-driven)
      this.setupEventListeners();
      
      // Load initial chart data
      await this.loadActivityChart();
      
      // Show welcome message if needed
      this.checkWelcomeMessage();
      
      // Final check: Ensure footer still exists after all data loading
      this.ensureFooterExists();

      console.log('Dashboard - Ready');
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.handleError(error);
    } finally {
      this.hideLoader();
    }
  }

  /**
   * Authenticate user and get account info
   */
  private async authenticateUser(): Promise<AuthenticationInfo> {
    try {
      const auth = await this.apiService.validateUser();
      return auth;
    } catch (error) {
      if (error.message?.includes('NotSignedIn')) {
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
    if (!this.state.accountId) return;

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
      console.error('Failed to load surveys:', error);
      this.state.surveys = [];
    }
  }

  /**
   * Load activity chart data
   */
  private async loadActivityChart(): Promise<void> {
    if (!this.state.accountId) return;

    try {
      const chartData = await this.apiService.getActivityChart({
        accountId: this.state.accountId,
        opinionId: this.state.selectedSurveyId || undefined,
        fromDate: this.state.fromDate,
        toDate: this.state.toDate,
        graphBy: 3
      });

      this.buildChart(chartData);
      this.updateStatistics(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  }

  /**
   * Build chart from data
   */
  private buildChart(data: ChartData): void {
    const chartConfig = this.prepareChartData(data);
    
    // Update statistics
    const totalStarted = data.charts.totals.completed + data.charts.totals.partial;
    const completionRate = totalStarted > 0 
      ? ((data.charts.totals.completed / totalStarted) * 100).toFixed(2) 
      : '0.00';

    this.updateElement('.label-started', totalStarted.toString());
    this.updateElement('.label-completed', data.charts.totals.completed.toString());
    this.updateElement('.label-partial', data.charts.totals.partial.toString());
    this.updateElement('.label-completion-rate', `${completionRate}%`);
    this.updateElement('.label-disqualified', '0');

    // Create or update chart
    this.createChart(chartConfig);
  }

  /**
   * Prepare chart data for rendering
   */
  private prepareChartData(data: ChartData): ChartConfig {
    const started: Array<[number, number]> = [];
    const completed: Array<[number, number]> = [];
    const partial: Array<[number, number]> = [];
    const disqualified: Array<[number, number]> = [];

    for (let i = 0; i < data.charts.completed.length; i++) {
      const timestamp = Date.parse(data.charts.completed[i][0]);
      const completedCount = data.charts.completed[i][1];
      const partialCount = data.charts.partial[i][1];

      started.push([timestamp, completedCount + partialCount]);
      completed.push([timestamp, completedCount]);
      partial.push([timestamp, partialCount]);
      disqualified.push([timestamp, 0]); // No disqualified data in original
    }

    return { started, completed, partial, disqualified };
  }

  /**
   * Create chart using Highcharts (placeholder for actual implementation)
   */
  private createChart(config: ChartConfig): void {
    // This would use Highcharts or another charting library
    // For now, just log the config
    console.log('Creating chart with config:', config);
    
    // Placeholder for actual Highcharts implementation
    const chartElement = document.getElementById('chart');
    if (chartElement) {
      chartElement.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Chart will be rendered here</div>';
    }
  }

  /**
   * Update surveys dropdown
   */
  private updateSurveysList(): void {
    const select = document.getElementById('select_surveys') as HTMLSelectElement;
    if (!select) return;

    // Clear existing options except "All surveys"
    select.innerHTML = '<option value="0">All surveys</option>';

    // Add survey options
    this.state.surveys.forEach(survey => {
      const option = document.createElement('option');
      option.value = survey.id.toString();
      option.textContent = survey.title;
      select.appendChild(option);
    });
  }

  /**
   * Update recent surveys table
   */
  private updateRecentSurveysTable(): void {
    const tbody = document.getElementById('survey_table_body');
    if (!tbody) return;

    // Sort surveys by modify date and take top 5
    const recentSurveys = this.state.surveys
      .sort((a, b) => new Date(b.updated || b.created).getTime() - new Date(a.updated || a.created).getTime())
      .slice(0, 5);

    tbody.innerHTML = '';

    recentSurveys.forEach((survey, index) => {
      const row = this.createSurveyTableRow(survey, index);
      tbody.appendChild(row);
    });
  }

  /**
   * Create table row for survey
   */
  private createSurveyTableRow(survey: Opinion, index: number): HTMLTableRowElement {
    const row = document.createElement('tr');
    row.className = index % 2 === 0 ? 'even' : 'odd';

    const formatDate = (date: Date) => {
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const time = date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      return `${formatted}<b class="hours"> ${time}</b>`;
    };

    row.innerHTML = `
      <td class="first-item" style="text-align: right;">${survey.id}</td>
      <td><a href="/surveys/${survey.id}/preview" class="row-button" title="Preview"><i class="row-icon-preview">&nbsp;</i></a></td>
      <td><a href="/surveys/${survey.id}/edit" title="${survey.title}">${survey.title}</a></td>
      <td style="text-align: right;">0</td>
      <td style="text-align: right;">0</td>
      <td style="text-align: right;">0.00%</td>
      <td style="text-align: right;">0</td>
      <td style="text-align: right;">0</td>
      <td style="text-align: right;">Less than sec</td>
      <td></td>
      <td class="last-item">${formatDate(new Date(survey.updated || survey.created))}</td>
    `;

    return row;
  }

  /**
   * Setup dashboard-specific event listeners (not UI-related)
   */
  private setupEventListeners(): void {
    // Survey selection change
    const surveysSelect = document.getElementById('select_surveys');
    if (surveysSelect) {
      surveysSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.state.selectedSurveyId = parseInt(target.value);
        this.loadActivityChart();
      });
    }

    // Create survey button
    const createButton = document.getElementById('button_create_survey');
    if (createButton) {
      createButton.addEventListener('click', () => {
        window.location.href = '/surveys/create';
      });
    }
  }

  /**
   * Initialize date range to today
   */
  private initializeDateRange(): void {
    const today = new Date();
    this.state.fromDate = this.formatDate(today) + ' 00:00';
    this.state.toDate = this.formatDate(today) + ' 23:59';
    
    // Update UI
    const dateElement = document.getElementById('datepicker_date_range_value');
    if (dateElement) {
      dateElement.textContent = today.toLocaleDateString('en-US', {
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
      const activityContainer = document.getElementById('container_activity');
      
      if (welcomeContainer && activityContainer) {
        welcomeContainer.style.display = 'block';
        activityContainer.style.display = 'none';
      }
    }
  }

  /**
   * Update user interface with user info
   */
  private updateUserInterface(): void {
    if (!this.state.user) return;

    // Update user info across all layout components
    this.layout.updateUser({
      username: this.state.user.username,
      email: this.state.user.email || 'demo@example.com'
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
   * Utility methods
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addCommas(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    console.error('Dashboard error:', error);
    // Show error message to user
    alert('An error occurred while loading the dashboard. Please try again.');
  }

  private initializeLoader(): void {
    // Initialize loader component - simpler implementation since template loading handles initial loader
    this.loader = {
      show: () => {
        console.log('Showing dashboard loader...');
        // Could show a dashboard-specific loader here if needed
      },
      hide: () => {
        console.log('Hiding dashboard loader...');
        // Dashboard is ready, all data loaded
      }
    };
  }

  private showLoader(): void {
    this.loader.show();
  }

  private hideLoader(): void {
    this.loader.hide();
  }
  
  /**
   * Update sidebar counts (data-only, not UI)
   */
  private updateSidebarCounts(): void {
    // Update total surveys count
    const totalSurveysCount = document.getElementById('total_surveys_count');
    if (totalSurveysCount) {
      totalSurveysCount.textContent = this.state.surveys.length.toString();
    }
    
    // Show recent surveys section if we have surveys
    if (this.state.surveys.length > 0) {
      this.updateRecentSurveysSidebar();
    }
  }
  
  /**
   * Update recent surveys in sidebar (data-only, not UI)
   */
  private updateRecentSurveysSidebar(): void {
    const recentSurveysSection = document.getElementById('recent_surveys_sidebar');
    const recentSurveysList = document.getElementById('recent_surveys_list');
    
    if (!recentSurveysSection || !recentSurveysList) return;
    
    // Show the section
    recentSurveysSection.style.display = 'block';
    
    // Get recent surveys (top 3 for sidebar)
    const recentSurveys = this.state.surveys
      .sort((a, b) => new Date(b.updated || b.created).getTime() - new Date(a.updated || a.created).getTime())
      .slice(0, 3);
    
    // Clear existing items
    recentSurveysList.innerHTML = '';
    
    // Add survey items
    recentSurveys.forEach(survey => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="/surveys/${survey.id}/edit" class="menu-item" title="${survey.title}">
          <i class="menu-icon">📝</i>
          <span class="menu-text">${survey.title}</span>
        </a>
      `;
      recentSurveysList.appendChild(li);
    });
  }
  
  /**
   * Ensure footer still exists after data loading - recreate if missing
   */
  private ensureFooterExists(): void {
    const existingFooter = document.querySelector('.app-footer');
    if (!existingFooter) {
      console.log('Dashboard - Footer missing after data load, recreating...');
      const footer = this.layout.getFooter();
      if (footer) {
        footer.init(); // Reinitialize the footer
        console.log('Dashboard - Footer recreated successfully');
      }
    } else {
      console.log('Dashboard - Footer exists and is visible');
    }
  }
}

// Global function for feedback (matching original)
declare global {
  function feedback(): void;
}

window.feedback = function(): void {
  console.log('Feedback function called - implement modal');
};

export default Dashboard;
