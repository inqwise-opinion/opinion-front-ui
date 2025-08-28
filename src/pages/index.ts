/**
 * Pages Index
 * Exports all page components and controllers
 */

// Page Controllers (Business Logic)
export { Dashboard } from './Dashboard';
export { DashboardPage } from './DashboardPage';

// Page Components (UI Logic)
export { DashboardPageComponent } from './DashboardPageComponent';

// Types and Interfaces
export type { DashboardState, ChartConfig } from './Dashboard';
export type { DashboardPageConfig } from './DashboardPageComponent';

// Default exports
export { default as DashboardController } from './Dashboard';
export { default as DashboardPageController } from './DashboardPage';
export { default as DashboardPageUI } from './DashboardPageComponent';
