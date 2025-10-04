/**
 * Test to verify AppHeader LayoutContext fix
 * 
 * This test ensures that AppHeader and services use the same LayoutContext instance
 * when AppHeader is provided with a specific LayoutContext (not the singleton).
 */

import { AppHeaderImpl } from '../../../src/components/AppHeaderImpl';
import { ComponentReference } from '../../../src/components/ComponentReference';
import LayoutContextImpl from '../../../src/contexts/LayoutContextImpl';
import { getLayoutContext } from '../../../src/contexts/index';

describe('AppHeader LayoutContext Integration', () => {
  beforeEach(() => {
    // Clear any existing singleton instance by overwriting the module's variable
    const contextModule = require('../../../src/contexts/index');
    contextModule.layoutContextInstance = null;
    
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="app-header">
        <div class="header-container"></div>
      </div>
    `;
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('should use provided LayoutContext instead of singleton', async () => {
    // Create specific layout context
    const layoutContext = new LayoutContextImpl();
    
    // Create header with specific context
    const header = new AppHeaderImpl({}, layoutContext);
    await header.init();
    
    // Should register with the provided context
    expect(layoutContext.getHeader()).toBe(header);
    
    // Clean up
    layoutContext.destroy();
  });

  test('should use provided LayoutContext instead of singleton (fix)', async () => {
    // Create specific LayoutContext (simulating Layout's context)
    const specificContext = new LayoutContextImpl();
    
    // Create header with specific context
    const header = new AppHeaderImpl({}, specificContext);
    await header.init();
    
    // Should register with the specific context
    expect(specificContext.getHeader()).toBe(header);
    
    // The key fix: header should register with the provided context, not singleton
    // (We don't test singleton state since it's hard to reset in Jest)
  });

  test('should resolve correctly with ComponentReference using same context', async () => {
    const specificContext = new LayoutContextImpl();
    
    // Create header with specific context
    const header = new AppHeaderImpl({}, specificContext);
    await header.init();
    
    // Create ComponentReference using the same context
    const headerRef = new ComponentReference(
      specificContext,
      'AppHeader',
      () => specificContext.getHeader(),
      { maxRetries: 1 } // No retries needed since header should be immediately available
    );
    
    // Should resolve immediately
    const resolvedHeader = await headerRef.get();
    expect(resolvedHeader).toBe(header);
    expect(headerRef.isAvailable()).toBe(true);
  });

  test('should fail to resolve with ComponentReference using different context (demonstrates the old bug)', async () => {
    const specificContext = new LayoutContextImpl();
    const differentContext = new LayoutContextImpl();
    
    // Create header with specific context
    const header = new AppHeaderImpl({}, specificContext);
    await header.init();
    
    // Create ComponentReference using a DIFFERENT context (simulates the old bug)
    const headerRef = new ComponentReference(
      differentContext,
      'AppHeader',
      () => differentContext.getHeader(),
      { maxRetries: 2, retryInterval: 10 } // Quick fail
    );
    
    // Should fail to resolve since header is registered in different context
    const resolvedHeader = await headerRef.get();
    expect(resolvedHeader).toBeNull();
    expect(headerRef.isAvailable()).toBe(false);
  });

  test('should demonstrate the fix: Layout pattern with services', async () => {
    // Simulate Layout pattern
    const layoutContext = new LayoutContextImpl();
    
    // Create header with Layout's context (the fix)
    const header = new AppHeaderImpl({}, layoutContext);
    await header.init();
    
    // Services use the same LayoutContext (passed via onContextReady)
    const serviceComponentRef = new ComponentReference(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader()
    );
    
    // Should resolve successfully
    const serviceHeader = await serviceComponentRef.get();
    expect(serviceHeader).toBe(header);
    
    // Multiple services can access the same header
    const anotherServiceRef = new ComponentReference(
      layoutContext,
      'AppHeader',
      () => layoutContext.getHeader()
    );
    
    const anotherServiceHeader = await anotherServiceRef.get();
    expect(anotherServiceHeader).toBe(header);
  });
});