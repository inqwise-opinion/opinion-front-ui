import { PageComponent } from '../../../components/PageComponent';
import MainContentImpl from '../../../components/MainContentImpl';
import type { PageContext } from '../../../interfaces/PageContext';

export default class CollectorListPage extends PageComponent {
  private surveyId: string;

  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageTitle: 'Collectors',
      autoInit: false
    });
    
    // Get surveyId from route parameters
    const routeContext = pageContext.getRouteContext();
    this.surveyId = routeContext.getParam('surveyId') || 'unknown';
  }

  protected async onInit(): Promise<void> {
    try {
      // Wait for DOM to be ready if needed
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Load main content
      await this.loadMainContent();

      // Set browser tab title
      document.title = 'Collectors - Opinion';

      // Breadcrumbs are now managed automatically by RouterService
    } catch (error) {
      console.error('❌ CollectorListPage - Initialization failed:', error);
      throw error;
    }
  }

  protected onDestroy(): void {
    // Clean up any resources, event listeners, etc.
  }

  protected setupEventListeners(): void {
    // Set up event delegation for actions
    this.setupEventDelegation();
  }

  private async loadMainContent(): Promise<void> {
    const mainElement = this.mainContent.getElement();
    if (!mainElement) return;

    mainElement.innerHTML = `
      <div class="collector-list-page">
        <div class="page-header">
          <h1>Collectors</h1>
          <button class="create-collector-btn" data-action="createCollector">
            Create Collector
          </button>
        </div>
        <div class="collector-list">
          <!-- Collector list will be loaded here -->
          <div class="loading-placeholder">Loading collectors...</div>
        </div>
      </div>
    `;

    // Initialize components and load data
    await this.loadCollectorList();
  }

  private async loadCollectorList(): Promise<void> {
    // TODO: Implement collector list loading logic
    const listContainer = this.mainContent.getElement()?.querySelector('.collector-list');
    if (!listContainer) return;

    // For now, show a placeholder message
    listContainer.innerHTML = `<p>Collectors for survey ${this.surveyId} implementation coming soon</p>`;
  }


  // Action Handlers
  private handleCreateCollector(): void {
    // TODO: Implement collector creation logic
    console.log(`Create collector for survey ${this.surveyId} clicked`);
  }
}
