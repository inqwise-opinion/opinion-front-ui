/**
 * Tests for OpinionApp class
 */

import { OpinionApp } from '../src/app';

describe('OpinionApp', () => {
  let app: OpinionApp;

  beforeEach(() => {
    app = new OpinionApp();
  });

  afterEach(() => {
    // Clean up any DOM changes or global state
    document.body.innerHTML = '';
  });

  test('should create app instance', () => {
    expect(app).toBeInstanceOf(OpinionApp);
  });

  test('should initialize app correctly', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    app.init();
    
    expect(consoleSpy).toHaveBeenCalledWith('Opinion Front UI - Ready');
    
    consoleSpy.mockRestore();
  });

  test('should not initialize twice', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    app.init();
    app.init(); // Second initialization
    
    expect(consoleSpy).toHaveBeenCalledWith('Application already initialized');
    
    consoleSpy.mockRestore();
  });
});
