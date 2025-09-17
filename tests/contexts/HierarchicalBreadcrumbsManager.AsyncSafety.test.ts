/**
 * Tests for HierarchicalBreadcrumbsManagerImpl Async Safety
 * 
 * These tests verify that the hierarchical breadcrumbs manager handles
 * async component availability gracefully without crashing.
 */

import { HierarchicalBreadcrumbsManagerImpl } from '../../src/contexts/HierarchicalBreadcrumbsManagerImpl';
import type { LayoutContext } from '../../src/contexts/LayoutContext';
import type { ActivePage } from '../../src/interfaces/ActivePage';
import type { BreadcrumbItem } from '../../src/interfaces/BreadcrumbItem';

describe('HierarchicalBreadcrumbsManagerImpl - Async Safety', () => {
  let mockLayoutContext: LayoutContext;
  let mockActivePage: ActivePage;
  let manager: HierarchicalBreadcrumbsManagerImpl;

  beforeEach(() => {
    // Mock layout context that returns null header (simulating component not ready)
    mockLayoutContext = {
      getHeader: jest.fn().mockReturnValue(null)
    } as any;

    mockActivePage = {
      getPageId: jest.fn().mockReturnValue('test-page')
    } as any;

    manager = new HierarchicalBreadcrumbsManagerImpl(
      mockLayoutContext,
      mockActivePage,
      true // Enable logging for test visibility
    );
  });

  describe('when component is not available', () => {
    test('should handle set() operation safely', () => {
      const items: BreadcrumbItem[] = [
        { id: 'test1', text: 'Test 1' },
        { id: 'test2', text: 'Test 2' }
      ];

      // Should not throw
      expect(() => manager.set(items)).not.toThrow();
    });

    test('should handle add() operation safely', () => {
      const item: BreadcrumbItem = { id: 'test', text: 'Test' };

      // Should not throw
      expect(() => manager.add(item)).not.toThrow();
    });

    test('should handle remove() operation safely', () => {
      // Should not throw
      expect(() => manager.remove('test-id')).not.toThrow();
    });

    test('should handle update() operation safely', () => {
      // Should not throw
      expect(() => manager.update('test-id', { text: 'Updated' })).not.toThrow();
    });

    test('should handle clear() operation safely', () => {
      // Should not throw
      expect(() => manager.clear()).not.toThrow();
    });

    test('should return empty array from get() operation safely', () => {
      const result = manager.get();
      expect(result).toEqual([]);
    });

    test('should return false from isAvailable()', () => {
      const result = manager.isAvailable();
      expect(result).toBe(false);
    });

    test('should return null from getDebugInfo()', () => {
      const result = manager.getDebugInfo();
      expect(result).toBeNull();
    });
  });

  describe('when component becomes available later', () => {
    test('should work correctly after component initialization', () => {
      // Initially not available
      expect(manager.isAvailable()).toBe(false);

      // Mock component becoming available
      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue([]),
        setBreadcrumbs: jest.fn(),
        addBreadcrumb: jest.fn(),
        removeBreadcrumb: jest.fn(),
        updateBreadcrumb: jest.fn(),
        clearBreadcrumbs: jest.fn()
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      // Update layout context to return the header
      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);

      // Now should be available
      expect(manager.isAvailable()).toBe(true);

      // Operations should work
      const items: BreadcrumbItem[] = [{ id: 'test', text: 'Test' }];
      manager.set(items);

      expect(mockBreadcrumbsComponent.setBreadcrumbs).toHaveBeenCalledWith(items);
    });
  });

  describe('scoping behavior when component available', () => {
    beforeEach(() => {
      const existingBreadcrumbs: BreadcrumbItem[] = [
        { id: 'parent1', text: 'Parent 1' },
        { id: 'parent2', text: 'Parent 2' },
        { id: 'test-page', text: 'Current Page' }, // This is where our page starts
        { id: 'child1', text: 'Child 1' }
      ];

      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue(existingBreadcrumbs),
        setBreadcrumbs: jest.fn(),
        addBreadcrumb: jest.fn(),
        removeBreadcrumb: jest.fn(),
        updateBreadcrumb: jest.fn(),
        clearBreadcrumbs: jest.fn()
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);
    });

    test('should scope set() operation correctly', () => {
      const newScopedItems: BreadcrumbItem[] = [
        { id: 'test-page', text: 'Current Page Updated' },
        { id: 'new-child', text: 'New Child' }
      ];

      manager.set(newScopedItems);

      const mockComponent = mockLayoutContext.getHeader()!.getBreadcrumbsComponent();
      expect(mockComponent!.setBreadcrumbs).toHaveBeenCalledWith([
        { id: 'parent1', text: 'Parent 1' },     // Parent preserved
        { id: 'parent2', text: 'Parent 2' },     // Parent preserved
        { id: 'test-page', text: 'Current Page Updated' }, // Our scope starts here
        { id: 'new-child', text: 'New Child' }   // Our new item
      ]);
    });

    test('should scope clear() operation correctly', () => {
      manager.clear();

      const mockComponent = mockLayoutContext.getHeader()!.getBreadcrumbsComponent();
      expect(mockComponent!.setBreadcrumbs).toHaveBeenCalledWith([
        { id: 'parent1', text: 'Parent 1' },     // Parent preserved
        { id: 'parent2', text: 'Parent 2' }      // Parent preserved
        // Everything from our scope is cleared
      ]);
    });

    test('should return scoped items from get()', () => {
      const result = manager.get();
      
      expect(result).toEqual([
        { id: 'test-page', text: 'Current Page' }, // Our scope starts here
        { id: 'child1', text: 'Child 1' }         // Items in our scope
      ]);
    });

    test('should provide debug info correctly', () => {
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo).toEqual({
        pageId: 'test-page',
        scopeIndex: 2,        // Found at index 2
        parentCount: 2,       // 2 parent items before our scope
        scopedCount: 2,       // 2 items in our scope
        totalCount: 4,        // Total breadcrumbs
        isFallbackMode: false, // Found exact match
        scopeType: 'hierarchical'
      });
    });
  });

  describe('case-insensitive search and fallback behavior', () => {
    test('should find case-insensitive match', () => {
      const existingBreadcrumbs: BreadcrumbItem[] = [
        { id: 'parent1', text: 'Parent 1' },
        { id: 'TEST-PAGE', text: 'Current Page' }, // Different case
        { id: 'child1', text: 'Child 1' }
      ];

      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue(existingBreadcrumbs),
        setBreadcrumbs: jest.fn(),
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);

      const result = manager.get();
      
      // Should find the case-insensitive match at index 1
      expect(result).toEqual([
        { id: 'TEST-PAGE', text: 'Current Page' },
        { id: 'child1', text: 'Child 1' }
      ]);
    });

    test('should use append-only fallback when page ID not found', () => {
      const existingBreadcrumbs: BreadcrumbItem[] = [
        { id: 'parent1', text: 'Parent 1' },
        { id: 'parent2', text: 'Parent 2' },
        { id: 'other-page', text: 'Other Page' }
      ];

      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue(existingBreadcrumbs),
        setBreadcrumbs: jest.fn(),
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);

      // Add an item - should append after existing items
      const newItem: BreadcrumbItem = { id: 'test-new', text: 'New Item' };
      manager.add(newItem);

      expect(mockBreadcrumbsComponent.setBreadcrumbs).toHaveBeenCalledWith([
        { id: 'parent1', text: 'Parent 1' },
        { id: 'parent2', text: 'Parent 2' },
        { id: 'other-page', text: 'Other Page' },
        { id: 'test-new', text: 'New Item' } // Appended at the end
      ]);
    });

    test('should show fallback mode in debug info', () => {
      const existingBreadcrumbs: BreadcrumbItem[] = [
        { id: 'parent1', text: 'Parent 1' },
        { id: 'other-page', text: 'Other Page' }
      ];

      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue(existingBreadcrumbs),
        setBreadcrumbs: jest.fn(),
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);

      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo).toEqual({
        pageId: 'test-page',
        scopeIndex: 2,        // After all existing items (append-only)
        parentCount: 2,       // All existing items are "parents"
        scopedCount: 0,       // No items in our scope initially
        totalCount: 2,        // Total existing breadcrumbs
        isFallbackMode: true, // Using fallback mode
        scopeType: 'append-only'
      });
    });

    test('should clear only scoped items in fallback mode', () => {
      const existingBreadcrumbs: BreadcrumbItem[] = [
        { id: 'parent1', text: 'Parent 1' },
        { id: 'other-page', text: 'Other Page' }
      ];

      const mockBreadcrumbsComponent = {
        getBreadcrumbs: jest.fn().mockReturnValue(existingBreadcrumbs),
        setBreadcrumbs: jest.fn(),
      };

      const mockHeader = {
        getBreadcrumbsComponent: jest.fn().mockReturnValue(mockBreadcrumbsComponent)
      };

      (mockLayoutContext.getHeader as jest.Mock).mockReturnValue(mockHeader);

      // Clear should preserve all existing items (since scope is after them)
      manager.clear();

      expect(mockBreadcrumbsComponent.setBreadcrumbs).toHaveBeenCalledWith([
        { id: 'parent1', text: 'Parent 1' },
        { id: 'other-page', text: 'Other Page' }
        // Nothing removed since scope is append-only
      ]);
    });
  });
});