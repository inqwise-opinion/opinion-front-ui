/**
 * Components Index
 * Exports all application components
 */

// Core layout components
export { default as AppHeader } from './AppHeader';
export { default as AppFooter } from './AppFooter';
export { default as Layout } from './Layout';

// Navigation components
export { Sidebar } from './Sidebar';
export { default as UserMenu } from './UserMenu';

// Base components
export { default as PageComponent } from './PageComponent';
export { default as ComponentLoader } from './ComponentLoader';

// Note: Import TypeScript interfaces directly from source files:
// - HeaderUser from './AppHeader'
// - FooterConfig, FooterLink from './AppFooter'
// - LayoutConfig from './Layout'
// - PageComponentConfig from './PageComponent'
// - ComponentLoaderConfig, LoadingCallbacks from './ComponentLoader'
// - NavigationItem from './Sidebar'
// - User from './UserMenu'
