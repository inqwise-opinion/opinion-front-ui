/**
 * Components Index
 * Exports all application components
 */

// Export default classes with clear names
export { default as AppHeader } from './AppHeader';
export { default as AppFooter } from './AppFooter';
export { default as Layout } from './Layout';
export { default as PageComponent } from './PageComponent';
export { default as ComponentLoader } from './ComponentLoader';
export { Sidebar } from './Sidebar';

// Note: Import TypeScript interfaces directly from source files:
// - HeaderUser from './AppHeader'
// - FooterConfig, FooterLink from './AppFooter'
// - LayoutConfig from './Layout'
// - PageComponentConfig from './PageComponent'
// - ComponentLoaderConfig, LoadingCallbacks from './ComponentLoader'
// - NavigationItem from './Sidebar'
