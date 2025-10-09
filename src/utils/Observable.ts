/**
 * Observable Pattern for Data Binding
 * Provides reactive data binding capabilities for components
 */

import { LoggerFactory } from '../logging/LoggerFactory';
import { Logger } from '../logging/Logger';

type Observer<T> = (data: T) => void;
type Validator<T> = (data: T) => boolean | string;
type Transformer<T> = (data: T) => T;

export class Observable<T> {
  private observers: Observer<T>[] = [];
  private _value: T;
  private validators: Validator<T>[] = [];
  private transformers: Transformer<T>[] = [];
  private logger: Logger;

  constructor(initialValue: T) {
    this._value = initialValue;
    this.logger = LoggerFactory.getInstance().getLogger('Observable');
  }

  /**
   * Get current value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Set new value and notify observers
   */
  set value(newValue: T) {
    // Run validators
    for (const validator of this.validators) {
      const result = validator(newValue);
      if (result !== true) {
        const error = typeof result === 'string' ? result : 'Validation failed';
        this.logger.warn('Observable validation failed:', error);
        return; // Don't update if validation fails
      }
    }

    // Apply transformers
    let transformedValue = newValue;
    for (const transformer of this.transformers) {
      transformedValue = transformer(transformedValue);
    }

    // Only update if value actually changed
    if (this._value !== transformedValue) {
      const oldValue = this._value;
      this._value = transformedValue;
      
      // Notify observers
      this.observers.forEach(observer => {
        try {
          observer(this._value);
        } catch (error) {
          this.logger.error('Observer error:', error);
        }
      });

      this.logger.debug('Observable value changed:', { oldValue, newValue: this._value });
    }
  }

  /**
   * Subscribe to value changes
   */
  subscribe(observer: Observer<T>): () => void {
    this.observers.push(observer);
    
    // Immediately call observer with current value
    try {
      observer(this._value);
    } catch (error) {
      this.logger.error('Observer error during subscription:', error);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Add validator
   */
  addValidator(validator: Validator<T>): void {
    this.validators.push(validator);
  }

  /**
   * Add transformer
   */
  addTransformer(transformer: Transformer<T>): void {
    this.transformers.push(transformer);
  }

  /**
   * Update value with validation bypass (for internal updates)
   */
  forceUpdate(newValue: T): void {
    this._value = newValue;
    this.observers.forEach(observer => observer(this._value));
  }

  /**
   * Clear all observers
   */
  destroy(): void {
    this.observers = [];
    this.validators = [];
    this.transformers = [];
  }
}

/**
 * Computed Observable - derives value from other observables
 */
export class ComputedObservable<T> extends Observable<T> {
  private dependencies: Observable<any>[] = [];
  private unsubscribers: (() => void)[] = [];
  private computeFn: () => T;

  constructor(computeFn: () => T, dependencies: Observable<any>[]) {
    super(computeFn()); // Initial value
    this.computeFn = computeFn;
    this.dependencies = dependencies;
    
    // Subscribe to dependencies
    this.dependencies.forEach(dep => {
      const unsubscribe = dep.subscribe(() => {
        this.recompute();
      });
      this.unsubscribers.push(unsubscribe);
    });
  }

  private recompute(): void {
    const newValue = this.computeFn();
    super.forceUpdate(newValue);
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    super.destroy();
  }
}

export default Observable;