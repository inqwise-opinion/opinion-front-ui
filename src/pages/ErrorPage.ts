import { PageComponent } from '../components/PageComponent';
import MainContentImpl from '../components/MainContentImpl';
import { PageContext } from '../interfaces/PageContext';
import { getFullPath } from '../config/app';

interface ErrorPageParams {
  code?: string;
  message?: string;
  details?: string;
}

export default class ErrorPage extends PageComponent {
  private error: ErrorPageParams = {
    code: '404',
    message: 'Page Not Found',
    details: 'The page you are looking for does not exist.'
  };

  constructor(mainContent: MainContentImpl, pageContext: PageContext) {
    super(mainContent, pageContext, {
      pageTitle: 'Error',
      pageId: 'error-page'
    });
    
    // Read error information from RouteContext if route failed
    const routeContext = pageContext.getRouteContext();
    if (routeContext.failed()) {
      const failure = routeContext.failure();
      if (failure) {
        this.error = {
          code: failure.code || '404',
          message: failure.message || 'Page Not Found',
          details: failure.details || 'The page you are looking for does not exist.'
        };
      }
    }
  }

  setParams(params: ErrorPageParams): void {
    this.error = {
      ...this.error,
      ...params
    };
  }

  protected async onInit(): Promise<void> {
    try {
      // Wait for DOM to be ready if needed
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Set browser tab title
      document.title = `${this.error.code} - ${this.error.message} - Opinion`;

      // Load main content
      await this.loadMainContent();

      // Wait a moment for page context to be available
      await new Promise(resolve => setTimeout(resolve, 0));

      // Breadcrumbs are now managed automatically by RouterService
    } catch (error) {
      this.logger.error('❌ ErrorPage - Initialization failed:', error);
      throw error;
    }
  }

  private async loadMainContent(): Promise<void> {
    const mainElement = this.mainContent.getElement();
    if (!mainElement) return;

    mainElement.innerHTML = `
      <div class="error-page">
        <div class="error-container">
          <h1 class="error-code">${this.error.code}</h1>
          <h2 class="error-message">${this.error.message}</h2>
          <p class="error-details">${this.error.details}</p>
          <div class="error-actions">
            <a href="${getFullPath('/')}" class="button-primary">Go to Homepage</a>
            <button onclick="window.history.back()" class="button-secondary">Go Back</button>
          </div>
        </div>
      </div>
    `;
  }


  protected setupEventListeners(): void {
    // Set up basic event delegation
    this.setupEventDelegation();

    // Add handler for 'Go Back' button
    const mainElement = this.mainContent.getElement();
    if (mainElement) {
      this.addEventListener(mainElement, 'click', (event) => {
        const target = event.target as HTMLElement;
        if (target.matches('.button-secondary')) {
          event.preventDefault();
          window.history.back();
        }
      });
    }
  }

  protected onDestroy(): void {
    // Clean up handled by PageComponent
  }
}