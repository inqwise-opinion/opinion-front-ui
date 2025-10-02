import { PageComponent } from '../components/PageComponent';
import { PageContext } from '../interfaces/PageContext';
import MainContentImpl from '../components/MainContentImpl';
import { RouteContext } from './RouteContext';

// Re-export RouteContext for backward compatibility
export type { RouteContext } from './RouteContext';

/**
 * Page provider function - creates a page instance with pre-created PageContext
 */
export type PageProvider = (mainContent: MainContentImpl, pageContext: PageContext) => PageComponent;

/**
 * Route information for creating PageContext
 * This will be used to create a RouteContext instance
 */
export interface RouteInfo {
  path: string;
  params: Record<string, string>;
}

export interface RouteResult {
  pageProvider: PageProvider;
  routeInfo: RouteInfo;
}

export interface RouterEventMap {
  'router:navigationStart': { from: string; to: string; };
  'router:navigationEnd': { path: string; };
  'router:error': { error: Error; };
}

export interface RouteDefinition {
  path: string;
  action: (context: RouteContext) => Promise<RouteResult> | RouteResult;
  children?: RouteDefinition[];
}
