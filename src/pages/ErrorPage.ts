import { PageComponent } from '../components/PageComponent';
import MainContentImpl from '../components/MainContentImpl';

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

  constructor(mainContent: MainContentImpl) {
    super(mainContent, {
      pageTitle: 'Error',
      pageId: 'error-page',
      autoInit: false
    });
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

      // Set breadcrumbs if page context is available
      if (this.hasPageContext()) {
        await this.setInitialBreadcrumb();
      }
    } catch (error) {
      console.error('❌ ErrorPage - Initialization failed:', error);
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
            <a href="/" class="button-primary">Go to Homepage</a>
            <button onclick="window.history.back()" class="button-secondary">Go Back</button>
          </div>
        </div>
      </div>
    `;
  }

  private async setInitialBreadcrumb(): Promise<void> {
    await this.setBreadcrumbs([
      { text: 'Home', href: '/' },
      { text: this.error.message || 'Error' }
    ]);
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