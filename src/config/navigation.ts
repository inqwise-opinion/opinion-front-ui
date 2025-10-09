import { NavigationItem } from '../components/Sidebar';

/**
 * Default navigation structure for the application
 * Note: href values are route paths, not full URLs. The SidebarComponent will apply getFullPath() when rendering.
 */
export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
    {
        id: "dashboard",
        text: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
        caption: "Main dashboard - view analytics, reports and key metrics",
        active: false,
    },
    {
        id: "surveys",
        text: "Surveys",
        icon: "poll",
        href: "/surveys",
        caption: "Create and manage survey questionnaires",
        active: false,
    },
    {
        id: "debug",
        text: "Debug",
        icon: "bug_report",
        href: "/debug",
        caption: "Development tools and troubleshooting",
        active: false,
    },
];
