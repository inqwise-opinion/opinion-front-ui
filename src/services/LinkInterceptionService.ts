import { Service } from '../interfaces/Service';
import { LayoutContext } from '../contexts/LayoutContext';
import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

/**
 * LinkInterceptionService
 * 
 * Handles intercepting navigation link clicks and delegating to RouterService
 * for SPA navigation. This service sits at the layout layer and provides
 * a clean separation between link interception and routing logic.
 */
export class LinkInterceptionService implements Service {
  public static readonly SERVICE_ID = 'linkInterception';
  
  private serviceId: string;
  private layoutContext: LayoutContext;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(layoutContext: LayoutContext) {
    this.serviceId = LinkInterceptionService.SERVICE_ID;
    this.layoutContext = layoutContext;
    this.logger = LoggerFactory.getInstance().getLogger('LinkInterceptionService');
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Set up global click listener for link interception
    document.addEventListener('click', this.handleClick, true);
    this.isInitialized = true;
    
    this.logger.info('LinkInterceptionService - Initialized');
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    document.removeEventListener('click', this.handleClick, true);
    this.isInitialized = false;
    
    this.logger.info('LinkInterceptionService - Destroyed');
  }

  getServiceId(): string {
    return this.serviceId;
  }

  /**
   * Global click handler for link interception
   */
  private handleClick = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;

    // Only process navigation links
    if (!link) {
      return;
    }

    // Skip if modifier keys are pressed (user wants new tab/window)
    if (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.shiftKey || mouseEvent.altKey) {
      return;
    }

    // Skip if not left click
    if (mouseEvent.button !== 0) {
      return;
    }

    // Skip if link has attributes that indicate external handling
    if (this.shouldSkipLink(link)) {
      return;
    }

    // Get router service and check if this is an internal link
    const router = this.layoutContext.getService('router');
    if (!router || !('navigateToUrl' in router) || !('isInternalUrl' in router)) {
      return; // Router not available or doesn't support SPA navigation
    }

    const routerService = router as any;
    
    // Check if it's an internal URL that should be handled by SPA routing
    if (!routerService.isInternalUrl(link.href)) {
      return; // Let browser handle external links
    }

    // Prevent default browser navigation
    event.preventDefault();
    event.stopPropagation();

    this.logger.info('LinkInterceptionService - Intercepted navigation to:', link.href);

    // Delegate to RouterService for SPA navigation
    routerService.navigateToUrl(link.href).catch((error: Error) => {
      this.logger.error('LinkInterceptionService - Navigation failed:', error);
      // Fallback to regular navigation
      window.location.href = link.href;
    });
  };

  /**
   * Check if a link should be skipped (not handled by SPA routing)
   */
  private shouldSkipLink(link: HTMLAnchorElement): boolean {
    // Skip if link has download attribute
    if (link.hasAttribute('download')) {
      return true;
    }

    // Skip if link has target attribute (opens in new window/tab)
    if (link.target && link.target !== '_self') {
      return true;
    }

    // Skip if link has rel="external"
    if (link.rel && link.rel.includes('external')) {
      return true;
    }

    // Skip if link has data-no-spa attribute
    if (link.hasAttribute('data-no-spa')) {
      return true;
    }

    return false;
  }
}

export default LinkInterceptionService;