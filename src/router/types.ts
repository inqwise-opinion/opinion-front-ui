import { Context } from 'universal-router';
import { PageComponent } from '../components/PageComponent';

export interface RouteContext extends Context {
  params: Record<string, string>;
  pathname: string;
  accountId?: string;
  services?: Map<string, any>; // Map of service ID to service instance
}

export interface RouteResult {
  component: typeof PageComponent;
  params?: Record<string, string>;
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