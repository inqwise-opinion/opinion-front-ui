/**
 * Main entry point for Opinion Front UI
 * TypeScript migration from servlet-based application
 */

import './assets/styles/main.scss';
import { OpinionApp } from './app';

// Initialize the application
const app = new OpinionApp();
app.init();

export { OpinionApp };
