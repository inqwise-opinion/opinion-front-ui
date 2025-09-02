/**
 * Components Index
 * Exports all application components
 */

// Core layout components
export { default as AppHeader } from './AppHeader';
export { default as AppFooter } from './AppFooter';
export { default as Layout } from './Layout';

// Navigation components
export type { Sidebar } from './Sidebar';
export { default as UserMenu } from './UserMenu';

// Base components
export { default as PageComponent } from './PageComponent';

// Note: Import TypeScript interfaces directly from source files:
// - HeaderUser from './AppHeader'
// - FooterConfig, FooterLink from './AppFooter'
// - LayoutConfig from './Layout'
// - PageComponentConfig from './PageComponent'
// - NavigationItem from './Sidebar'
// - User from './UserMenu'
