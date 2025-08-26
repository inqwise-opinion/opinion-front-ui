/**
 * Dashboard Page Controller
 * TypeScript migration of dashboard functionality
 */

import { MockApiService, ChartData, AuthenticationInfo } from '../services/MockApiService';
import { Opinion, User } from '../types';

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

  constructor(apiService: MockApiService) {
    this.apiService = apiService;
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
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial chart data
      await this.loadActivityChart();
      
      // Show welcome message if needed
      this.checkWelcomeMessage();

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
   * Setup event listeners
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
    
    // User menu dropdown
    this.setupUserMenu();
    
    // Sidebar toggle
    this.setupSidebar();
  }
  
  /**
   * Setup user menu dropdown functionality
   */
  private setupUserMenu(): void {
    const userMenuTrigger = document.getElementById('user_menu_trigger');
    const userMenuDropdown = document.getElementById('user_menu_dropdown');
    
    if (!userMenuTrigger || !userMenuDropdown) return;
    
    // Toggle dropdown on trigger click
    userMenuTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = userMenuDropdown.style.display === 'block';
      
      if (isOpen) {
        this.closeUserMenu();
      } else {
        this.openUserMenu();
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!userMenuTrigger.contains(target) && !userMenuDropdown.contains(target)) {
        this.closeUserMenu();
      }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeUserMenu();
      }
    });
  }
  
  /**
   * Open user menu dropdown
   */
  private openUserMenu(): void {
    const userMenuTrigger = document.getElementById('user_menu_trigger');
    const userMenuDropdown = document.getElementById('user_menu_dropdown');
    
    if (userMenuTrigger && userMenuDropdown) {
      userMenuTrigger.classList.add('active');
      userMenuDropdown.style.display = 'block';
      userMenuDropdown.classList.remove('hide');
      userMenuDropdown.classList.add('show');
    }
  }
  
  /**
   * Close user menu dropdown
   */
  private closeUserMenu(): void {
    const userMenuTrigger = document.getElementById('user_menu_trigger');
    const userMenuDropdown = document.getElementById('user_menu_dropdown');
    
    if (userMenuTrigger && userMenuDropdown) {
      userMenuTrigger.classList.remove('active');
      userMenuDropdown.classList.remove('show');
      userMenuDropdown.classList.add('hide');
      
      // Hide after animation completes
      setTimeout(() => {
        userMenuDropdown.style.display = 'none';
        userMenuDropdown.classList.remove('hide');
      }, 200);
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

    // Update username in trigger
    const usernameElement = document.getElementById('label_username');
    if (usernameElement) {
      usernameElement.textContent = this.state.user.username;
    }
    
    // Update username in dropdown header
    const userMenuName = document.getElementById('user_menu_name');
    if (userMenuName) {
      userMenuName.textContent = this.state.user.username;
    }
    
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
   * Setup sidebar toggle functionality
   */
  private setupSidebar(): void {
    const sidebarToggle = document.getElementById('sidebar_toggle');
    const sidebar = document.getElementById('app_sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    
    if (!sidebarToggle || !sidebar || !overlay) return;
    
    // Setup toggle button
    sidebarToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isClosed = sidebar.classList.contains('sidebar-collapsed');
      
      if (isClosed) {
        this.openSidebar();
      } else {
        this.closeSidebar();
      }
    });
    
    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
      this.closeSidebar();
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
    
    // Handle window resize - reset sidebar state for desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        // Desktop: sidebar should be open by default
        this.resetSidebarForDesktop();
      } else if (window.innerWidth <= 768) {
        // Mobile: ensure sidebar is closed
        this.closeSidebar();
      }
    });
    
    // Set initial state based on screen size
    this.initializeSidebarState();
  }
  
  /**
   * Initialize sidebar state based on screen size
   */
  private initializeSidebarState(): void {
    if (window.innerWidth > 1024) {
      // Desktop: sidebar open by default
      this.resetSidebarForDesktop();
    } else {
      // Mobile/Tablet: sidebar closed by default
      this.closeSidebar();
    }
  }
  
  /**
   * Reset sidebar for desktop view
   */
  private resetSidebarForDesktop(): void {
    const sidebar = document.getElementById('app_sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    const sidebarToggle = document.getElementById('sidebar_toggle');
    
    if (sidebar) {
      sidebar.classList.remove('sidebar-collapsed');
    }
    
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    if (sidebarToggle) {
      sidebarToggle.classList.remove('active');
    }
    
    document.body.classList.remove('sidebar-open', 'sidebar-closed');
  }
  
  /**
   * Open sidebar (remove closed class)
   */
  private openSidebar(): void {
    const sidebar = document.getElementById('app_sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    const sidebarToggle = document.getElementById('sidebar_toggle');
    
    if (sidebar) {
      sidebar.classList.remove('sidebar-collapsed');
    }
    
    // Show overlay for mobile/tablet
    if (window.innerWidth <= 1024 && overlay) {
      overlay.classList.add('active');
      document.body.classList.add('sidebar-open');
    }
    
    // Update button state
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', 'true');
    }
    
    // Remove closed state from body
    document.body.classList.remove('sidebar-closed');
  }
  
  /**
   * Close sidebar (add closed class)
   */
  private closeSidebar(): void {
    const sidebar = document.getElementById('app_sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    const sidebarToggle = document.getElementById('sidebar_toggle');
    
    if (sidebar) {
      sidebar.classList.add('sidebar-collapsed');
    }
    
    // Hide overlay
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    document.body.classList.remove('sidebar-open');
    document.body.classList.add('sidebar-closed');
    
    // Update button state
    if (sidebarToggle) {
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
  }
  
  /**
   * Update sidebar counts
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
   * Update recent surveys in sidebar
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
}

// Global function for feedback (matching original)
declare global {
  function feedback(): void;
}

window.feedback = function(): void {
  console.log('Feedback function called - implement modal');
};

export default Dashboard;
