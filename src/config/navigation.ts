import { NavigationItem } from '../components/Sidebar';

/**
 * Default navigation structure for the application
 */
export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
    {
        id: "dashboard",
        text: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
        caption: "View analytics, reports and key metrics",
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
        href: "/",
        caption: "Development tools and troubleshooting",
        active: false,
    },
];