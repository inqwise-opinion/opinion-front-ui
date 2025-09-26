import { PageComponent } from '../components/PageComponent';

export interface RouteContext {
  params: Record<string, string>;
  pathname: string;
  accountId?: string;
  services?: Map<string, any>;
}

export interface RouteResult {
  component: any;
  params?: Record<string, string>;
}

export interface RouterEventMap {
  'router:navigationStart': { from: string; to: string; };
  'router:navigationEnd': { path: string; };
  'router:error': { error: Error; };
}

export interface RouteDefinition {
  path: string;
  action: (context: any) => Promise<RouteResult> | RouteResult;
  children?: RouteDefinition[];
}
