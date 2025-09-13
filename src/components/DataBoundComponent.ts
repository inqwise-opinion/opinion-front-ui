/**
 * Data-Bound Component Base Class
 * Extends PageComponent with automatic data binding capabilities
 */

import { PageComponent, type PageComponentConfig } from './PageComponent';
import { Observable } from '../utils/Observable';
import type { MainContent } from './MainContent';
import MainContentImpl from './MainContentImpl';

interface DataBinding<T> {
  observable: Observable<T>;
  selector: string;
  property?: keyof HTMLElement | 'textContent' | 'innerHTML' | 'value';
  formatter?: (value: T) => string;
  validator?: (element: HTMLElement, value: T) => boolean;
  beforeUpdate?: (element: HTMLElement, value: T) => void;
  afterUpdate?: (element: HTMLElement, value: T) => void;
}

interface DataLoader<T> {
  load(): Promise<T>;
  invalidate(): void;
  isLoading(): boolean;
}

interface LoaderBinding<T> {
  loader: DataLoader<T>;
  selector: string;
  property?: keyof HTMLElement | 'textContent' | 'innerHTML' | 'value';
  formatter?: (value: T) => string;
  loadingText?: string;
  errorText?: string;
  refreshInterval?: number; // Auto-refresh interval in ms
}

export abstract class DataBoundComponent extends PageComponent {
  private bindings: Map<string, DataBinding<any>> = new Map();
  private loaderBindings: Map<string, LoaderBinding<any>> = new Map();
  private unsubscribers: Map<string, () => void> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private observables: Map<string, Observable<any>> = new Map();

  constructor(mainContent: MainContentImpl, config: PageComponentConfig = {}) {
    super(mainContent, config);
  }

  /**
   * Bind an observable to a DOM element
   */
  protected bindData<T>(
    key: string,
    observable: Observable<T>,
    selector: string,
    options: Partial<DataBinding<T>> = {}
  ): void {
    const binding: DataBinding<T> = {
      observable,
      selector,
      property: 'textContent',
      ...options,
    };

    this.bindings.set(key, binding);

    // Subscribe to observable changes
    const unsubscribe = observable.subscribe((value) => {
      this.updateElement(binding, value);
    });

    this.unsubscribers.set(key, unsubscribe);
    console.log(`📊 DataBoundComponent - Bound data: ${key} -> ${selector}`);
  }

  /**
   * Bind a DataLoader to a DOM element with loading states
   */
  protected bindLoader<T>(
    key: string,
    loader: DataLoader<T>,
    selector: string,
    options: Partial<LoaderBinding<T>> = {}
  ): void {
    const binding: LoaderBinding<T> = {
      loader,
      selector,
      property: 'textContent',
      loadingText: 'Loading...',
      errorText: 'Failed to load',
      ...options,
    };

    this.loaderBindings.set(key, binding);

    // Initial load
    this.loadAndBind(key, binding);

    // Setup auto-refresh if specified
    if (binding.refreshInterval && binding.refreshInterval > 0) {
      const timer = setInterval(() => {
        this.loadAndBind(key, binding);
      }, binding.refreshInterval);

      this.refreshTimers.set(key, timer);
      console.log(`⏱️ DataBoundComponent - Auto-refresh setup: ${key} (${binding.refreshInterval}ms)`);
    }

    console.log(`🔄 DataBoundComponent - Bound loader: ${key} -> ${selector}`);
  }

  /**
   * Create and bind a new observable
   */
  protected createObservable<T>(key: string, initialValue: T): Observable<T> {
    const observable = new Observable(initialValue);
    this.observables.set(key, observable);
    console.log(`📊 DataBoundComponent - Created observable: ${key}`);
    return observable;
  }

  /**
   * Get an existing observable
   */
  protected getObservable<T>(key: string): Observable<T> | undefined {
    return this.observables.get(key);
  }

  /**
   * Update an observable value (syntactic sugar)
   */
  protected updateData<T>(key: string, value: T): void {
    const observable = this.observables.get(key);
    if (observable) {
      observable.value = value;
      console.log(`📊 DataBoundComponent - Updated data: ${key}`, value);
    } else {
      console.warn(`DataBoundComponent - Observable not found: ${key}`);
    }
  }

  /**
   * Get current data value
   */
  protected getData<T>(key: string): T | undefined {
    const observable = this.observables.get(key);
    return observable?.value;
  }

  /**
   * Refresh a DataLoader binding
   */
  protected async refreshLoader(key: string): Promise<void> {
    const binding = this.loaderBindings.get(key);
    if (binding) {
      binding.loader.invalidate();
      await this.loadAndBind(key, binding);
      console.log(`🔄 DataBoundComponent - Refreshed loader: ${key}`);
    }
  }

  /**
   * Load data and update bound element
   */
  private async loadAndBind<T>(key: string, binding: LoaderBinding<T>): Promise<void> {
    const element = document.querySelector(binding.selector) as HTMLElement;
    if (!element) {
      console.warn(`DataBoundComponent - Element not found for binding: ${binding.selector}`);
      return;
    }

    try {
      // Show loading state
      if (binding.loadingText) {
        this.setElementValue(element, binding.property || 'textContent', binding.loadingText);
      }

      // Load data
      const data = await binding.loader.load();

      // Format and update element
      const formattedValue = binding.formatter ? binding.formatter(data) : String(data);
      this.setElementValue(element, binding.property || 'textContent', formattedValue);

      console.log(`✅ DataBoundComponent - Loaded data for: ${key}`);
    } catch (error) {
      console.error(`❌ DataBoundComponent - Failed to load data for: ${key}`, error);
      
      // Show error state
      const errorText = binding.errorText || 'Error loading data';
      this.setElementValue(element, binding.property || 'textContent', errorText);
    }
  }

  /**
   * Update a bound element with new value
   */
  private updateElement<T>(binding: DataBinding<T>, value: T): void {
    const element = document.querySelector(binding.selector) as HTMLElement;
    if (!element) {
      console.warn(`DataBoundComponent - Element not found for binding: ${binding.selector}`);
      return;
    }

    // Run validator if provided
    if (binding.validator && !binding.validator(element, value)) {
      console.warn('DataBoundComponent - Validation failed for binding update');
      return;
    }

    // Before update hook
    if (binding.beforeUpdate) {
      binding.beforeUpdate(element, value);
    }

    // Format value
    const formattedValue = binding.formatter ? binding.formatter(value) : String(value);

    // Update element
    this.setElementValue(element, binding.property || 'textContent', formattedValue);

    // After update hook
    if (binding.afterUpdate) {
      binding.afterUpdate(element, value);
    }
  }

  /**
   * Set element value based on property
   */
  private setElementValue(
    element: HTMLElement,
    property: keyof HTMLElement | 'textContent' | 'innerHTML' | 'value',
    value: string
  ): void {
    if (property === 'textContent') {
      element.textContent = value;
    } else if (property === 'innerHTML') {
      element.innerHTML = value;
    } else if (property === 'value' && 'value' in element) {
      (element as any).value = value;
    } else {
      (element as any)[property] = value;
    }
  }

  /**
   * Bind form input to observable (two-way binding)
   */
  protected bindInput<T>(
    key: string,
    observable: Observable<T>,
    selector: string,
    parser: (value: string) => T = (v) => v as unknown as T
  ): void {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (!element) {
      console.warn(`DataBoundComponent - Input element not found: ${selector}`);
      return;
    }

    // Observable -> Input (one-way)
    const unsubscribe = observable.subscribe((value) => {
      element.value = String(value);
    });
    this.unsubscribers.set(`${key}-input`, unsubscribe);

    // Input -> Observable (reverse binding)
    this.addEventListener(element, 'input', () => {
      try {
        const parsedValue = parser(element.value);
        observable.value = parsedValue;
      } catch (error) {
        console.warn('DataBoundComponent - Failed to parse input value:', error);
      }
    });

    console.log(`🔗 DataBoundComponent - Two-way bound input: ${key} <-> ${selector}`);
  }

  /**
   * Remove a data binding
   */
  protected unbind(key: string): void {
    // Remove observable subscription
    const unsubscribe = this.unsubscribers.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(key);
    }

    // Remove loader binding
    this.loaderBindings.delete(key);

    // Clear refresh timer
    const timer = this.refreshTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(key);
    }

    // Remove data binding
    this.bindings.delete(key);

    console.log(`📊 DataBoundComponent - Unbound: ${key}`);
  }

  /**
   * Cleanup all bindings when component is destroyed
   */
  protected onDestroy(): void {
    // Clear all subscriptions
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers.clear();

    // Clear all timers
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();

    // Destroy observables
    this.observables.forEach(observable => observable.destroy());
    this.observables.clear();

    // Clear binding maps
    this.bindings.clear();
    this.loaderBindings.clear();

    console.log(`🧹 DataBoundComponent - All bindings cleaned up`);
    
    // Call parent cleanup
    super.onDestroy?.();
  }

  /**
   * Setup automatic form binding based on data-bind attributes
   */
  protected setupAutomaticBinding(): void {
    const bindElements = this.getElements('[data-bind]');
    
    bindElements.forEach((element) => {
      const bindKey = element.getAttribute('data-bind');
      const bindProperty = element.getAttribute('data-bind-property') || 'textContent';
      
      if (bindKey) {
        const observable = this.getObservable(bindKey);
        if (observable) {
          // Create binding
          this.bindData(
            `auto-${bindKey}`,
            observable,
            `[data-bind="${bindKey}"]`,
            { property: bindProperty as any }
          );

          console.log(`🤖 DataBoundComponent - Auto-bound: ${bindKey}`);
        }
      }
    });
  }
}

export default DataBoundComponent;