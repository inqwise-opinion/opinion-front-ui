/**
 * Components Index
 * Exports all application components
 */

// Core layout components
export { default as AppHeaderImpl } from './AppHeaderImpl';
export { default as AppFooterImpl } from './AppFooterImpl';
export { default as Layout } from './Layout';
export { default as MessagesComponent } from './MessagesComponent';

// Navigation components
export type { Sidebar } from './Sidebar';
export { default as UserMenu } from './UserMenu';

// Base components
export { default as PageComponent } from './PageComponent';

// Note: Import TypeScript interfaces directly from source files:
// - HeaderUser from './AppHeaderImpl'
// - FooterConfig, FooterLink from './AppFooterImpl'
// - LayoutConfig, UserMenuItem from './Layout'
// - ErrorMessage, ErrorAction from './ErrorMessages'
// - PageComponentConfig from './PageComponent'
// - NavigationItem from './Sidebar'
// - User from './UserMenu'
