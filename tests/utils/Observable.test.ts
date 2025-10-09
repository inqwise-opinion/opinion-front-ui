import Observable, { ComputedObservable } from '../../src/utils/Observable';
import { LoggerFactory } from '../../src/logging/LoggerFactory';

// Mock the logger to avoid console output during tests
jest.mock('../../src/logging/LoggerFactory', () => ({
  LoggerFactory: {
    getInstance: () => ({
      getLogger: () => ({
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      })
    })
  }
}));

describe('Observable', () => {
  describe('Basic functionality', () => {
    it('should create Observable with initial value', () => {
      const observable = new Observable('initial');
      
      expect(observable.value).toBe('initial');
    });

    it('should update value and notify observers', () => {
      const observable = new Observable(0);
      const observer = jest.fn();
      
      observable.subscribe(observer);
      
      // Clear initial call
      observer.mockClear();
      
      observable.value = 42;
      
      expect(observable.value).toBe(42);
      expect(observer).toHaveBeenCalledWith(42);
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it('should not notify observers if value does not change', () => {
      const observable = new Observable('same');
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = 'same';
      
      expect(observer).not.toHaveBeenCalled();
    });

    it('should work with different data types', () => {
      const stringObs = new Observable<string>('test');
      const numberObs = new Observable<number>(42);
      const booleanObs = new Observable<boolean>(true);
      const objectObs = new Observable<{ id: number }>({ id: 1 });
      const arrayObs = new Observable<number[]>([1, 2, 3]);
      
      expect(stringObs.value).toBe('test');
      expect(numberObs.value).toBe(42);
      expect(booleanObs.value).toBe(true);
      expect(objectObs.value).toEqual({ id: 1 });
      expect(arrayObs.value).toEqual([1, 2, 3]);
    });
  });

  describe('Observer subscription', () => {
    it('should immediately call observer with current value on subscription', () => {
      const observable = new Observable(123);
      const observer = jest.fn();
      
      observable.subscribe(observer);
      
      expect(observer).toHaveBeenCalledWith(123);
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it('should support multiple observers', () => {
      const observable = new Observable('multi');
      const observer1 = jest.fn();
      const observer2 = jest.fn();
      const observer3 = jest.fn();
      
      observable.subscribe(observer1);
      observable.subscribe(observer2);
      observable.subscribe(observer3);
      
      // Clear initial calls
      observer1.mockClear();
      observer2.mockClear();
      observer3.mockClear();
      
      observable.value = 'updated';
      
      expect(observer1).toHaveBeenCalledWith('updated');
      expect(observer2).toHaveBeenCalledWith('updated');
      expect(observer3).toHaveBeenCalledWith('updated');
    });

    it('should return unsubscribe function', () => {
      const observable = new Observable('test');
      const observer = jest.fn();
      
      const unsubscribe = observable.subscribe(observer);
      
      expect(typeof unsubscribe).toBe('function');
      
      observer.mockClear();
      unsubscribe();
      
      observable.value = 'changed';
      
      expect(observer).not.toHaveBeenCalled();
    });

    it('should handle observer errors gracefully', () => {
      const observable = new Observable('test');
      const errorObserver = jest.fn(() => {
        throw new Error('Observer error');
      });
      const normalObserver = jest.fn();
      
      // The errorObserver will throw during subscription, but it should be caught
      expect(() => {
        observable.subscribe(errorObserver);
      }).not.toThrow(); // Observable should catch errors during initial call
      
      observable.subscribe(normalObserver);
      
      // Clear calls after subscription
      errorObserver.mockClear();
      normalObserver.mockClear();
      
      expect(() => {
        observable.value = 'new value';
      }).not.toThrow();
      
      expect(errorObserver).toHaveBeenCalled();
      expect(normalObserver).toHaveBeenCalledWith('new value');
    });
  });

  describe('Validators', () => {
    it('should validate values before updating', () => {
      const observable = new Observable<number>(5);
      const observer = jest.fn();
      
      // Add validator that only allows positive numbers
      observable.addValidator((value: number) => value > 0 || 'Must be positive');
      observable.subscribe(observer);
      observer.mockClear();
      
      // Valid update
      observable.value = 10;
      expect(observable.value).toBe(10);
      expect(observer).toHaveBeenCalledWith(10);
      
      observer.mockClear();
      
      // Invalid update
      observable.value = -5;
      expect(observable.value).toBe(10); // Should not change
      expect(observer).not.toHaveBeenCalled();
    });

    it('should support multiple validators', () => {
      const observable = new Observable<number>(5);
      const observer = jest.fn();
      
      observable.addValidator((value: number) => value > 0 || 'Must be positive');
      observable.addValidator((value: number) => value < 100 || 'Must be less than 100');
      observable.subscribe(observer);
      observer.mockClear();
      
      // Valid value
      observable.value = 50;
      expect(observable.value).toBe(50);
      expect(observer).toHaveBeenCalled();
      
      observer.mockClear();
      
      // Invalid - too large
      observable.value = 150;
      expect(observable.value).toBe(50); // Should not change
      expect(observer).not.toHaveBeenCalled();
      
      // Invalid - negative
      observable.value = -10;
      expect(observable.value).toBe(50); // Should not change
    });

    it('should support boolean validators', () => {
      const observable = new Observable<string>('valid');
      const observer = jest.fn();
      
      observable.addValidator((value: string) => value.length > 0);
      observable.subscribe(observer);
      observer.mockClear();
      
      // Valid update
      observable.value = 'new value';
      expect(observable.value).toBe('new value');
      expect(observer).toHaveBeenCalled();
      
      observer.mockClear();
      
      // Invalid update
      observable.value = '';
      expect(observable.value).toBe('new value'); // Should not change
      expect(observer).not.toHaveBeenCalled();
    });
  });

  describe('Transformers', () => {
    it('should transform values before setting', () => {
      const observable = new Observable<string>('test');
      const observer = jest.fn();
      
      // Add transformer that converts to uppercase
      observable.addTransformer((value: string) => value.toUpperCase());
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = 'hello world';
      
      expect(observable.value).toBe('HELLO WORLD');
      expect(observer).toHaveBeenCalledWith('HELLO WORLD');
    });

    it('should apply multiple transformers in order', () => {
      const observable = new Observable<string>('test');
      const observer = jest.fn();
      
      observable.addTransformer((value: string) => value.trim());
      observable.addTransformer((value: string) => value.toLowerCase());
      observable.addTransformer((value: string) => value.replace(/\s+/g, '-'));
      
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = '  Hello World  ';
      
      expect(observable.value).toBe('hello-world');
      expect(observer).toHaveBeenCalledWith('hello-world');
    });

    it('should apply validators after transformers', () => {
      const observable = new Observable<string>('test');
      const observer = jest.fn();
      
      // Transform to uppercase, then validate minimum length
      observable.addTransformer((value: string) => value.toUpperCase());
      observable.addValidator((value: string) => value.length >= 3 || 'Too short');
      
      observable.subscribe(observer);
      observer.mockClear();
      
      // Valid after transformation
      observable.value = 'ok';  // Becomes 'OK' (length 2, fails validation)
      expect(observable.value).toBe('test'); // Should not change
      expect(observer).not.toHaveBeenCalled();
      
      // Valid after transformation
      observable.value = 'good'; // Becomes 'GOOD' (length 4, passes validation)
      expect(observable.value).toBe('GOOD');
      expect(observer).toHaveBeenCalledWith('GOOD');
    });
  });

  describe('Force update', () => {
    it('should bypass validation and transformers', () => {
      const observable = new Observable<number>(10);
      const observer = jest.fn();
      
      observable.addValidator((value: number) => value > 0);
      observable.addTransformer((value: number) => Math.abs(value));
      
      observable.subscribe(observer);
      observer.mockClear();
      
      // Force update with invalid value
      observable.forceUpdate(-5);
      
      expect(observable.value).toBe(-5);
      expect(observer).toHaveBeenCalledWith(-5);
    });

    it('should always notify observers', () => {
      const observable = new Observable('same');
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observer.mockClear();
      
      // Force update with same value
      observable.forceUpdate('same');
      
      expect(observer).toHaveBeenCalledWith('same');
    });
  });

  describe('Destroy functionality', () => {
    it('should clear all observers, validators, and transformers', () => {
      const observable = new Observable('test');
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observable.addValidator(() => true);
      observable.addTransformer((v) => v);
      
      observer.mockClear();
      
      observable.destroy();
      
      // Should not notify after destroy
      observable.value = 'new value';
      expect(observer).not.toHaveBeenCalled();
      
      // Validators and transformers should be cleared
      expect(observable.value).toBe('new value'); // Direct assignment works
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values', () => {
      const observable = new Observable<string | null>(null);
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = 'not null';
      expect(observable.value).toBe('not null');
      expect(observer).toHaveBeenCalledWith('not null');
      
      observer.mockClear();
      
      observable.value = null;
      expect(observable.value).toBe(null);
      expect(observer).toHaveBeenCalledWith(null);
    });

    it('should handle object reference changes', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 1 }; // Same content, different reference
      const observable = new Observable(obj1);
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = obj2;
      
      expect(observable.value).toBe(obj2);
      expect(observer).toHaveBeenCalledWith(obj2);
    });

    it('should handle array updates', () => {
      const observable = new Observable<number[]>([1, 2, 3]);
      const observer = jest.fn();
      
      observable.subscribe(observer);
      observer.mockClear();
      
      observable.value = [4, 5, 6];
      
      expect(observable.value).toEqual([4, 5, 6]);
      expect(observer).toHaveBeenCalledWith([4, 5, 6]);
    });
  });

  describe('Memory management', () => {
    it('should handle many observers efficiently', () => {
      const observable = new Observable('test');
      const observers = Array.from({ length: 1000 }, () => jest.fn());
      const unsubscribers = observers.map(observer => 
        observable.subscribe(observer)
      );
      
      observers.forEach(observer => observer.mockClear());
      
      observable.value = 'broadcast';
      
      observers.forEach(observer => {
        expect(observer).toHaveBeenCalledWith('broadcast');
      });
      
      // Cleanup
      unsubscribers.forEach(unsub => unsub());
      
      observers.forEach(observer => observer.mockClear());
      observable.value = 'should not reach';
      
      observers.forEach(observer => {
        expect(observer).not.toHaveBeenCalled();
      });
    });
  });
});

describe('ComputedObservable', () => {
  it('should compute initial value from dependencies', () => {
    const a = new Observable(5);
    const b = new Observable(3);
    
    const sum = new ComputedObservable(
      () => a.value + b.value,
      [a, b]
    );
    
    expect(sum.value).toBe(8);
  });

  it('should recompute when dependencies change', () => {
    const a = new Observable(10);
    const b = new Observable(20);
    const observer = jest.fn();
    
    const product = new ComputedObservable(
      () => a.value * b.value,
      [a, b]
    );
    
    product.subscribe(observer);
    observer.mockClear();
    
    a.value = 5;
    
    expect(product.value).toBe(100); // 5 * 20
    expect(observer).toHaveBeenCalledWith(100);
    
    observer.mockClear();
    
    b.value = 4;
    
    expect(product.value).toBe(20); // 5 * 4
    expect(observer).toHaveBeenCalledWith(20);
  });

  it('should handle multiple dependencies', () => {
    const x = new Observable(1);
    const y = new Observable(2);
    const z = new Observable(3);
    
    const formula = new ComputedObservable(
      () => x.value * y.value + z.value,
      [x, y, z]
    );
    
    expect(formula.value).toBe(5); // 1 * 2 + 3
    
    x.value = 2;
    expect(formula.value).toBe(7); // 2 * 2 + 3
    
    z.value = 10;
    expect(formula.value).toBe(14); // 2 * 2 + 10
  });

  it('should handle dependencies that do not change the result', () => {
    const a = new Observable(0);
    const b = new Observable(5);
    const observer = jest.fn();
    
    // Always returns 0 regardless of b
    const alwaysZero = new ComputedObservable(
      () => a.value * b.value,
      [a, b]
    );
    
    alwaysZero.subscribe(observer);
    observer.mockClear();
    
    b.value = 100; // Should recompute but result is still 0
    
    expect(alwaysZero.value).toBe(0);
    // The implementation uses forceUpdate which always notifies observers
    // even if the computed value didn't actually change
    expect(observer).toHaveBeenCalled();
  });

  it('should handle complex computations', () => {
    const firstName = new Observable('John');
    const lastName = new Observable('Doe');
    const age = new Observable(25);
    
    const profile = new ComputedObservable(
      () => ({
        fullName: `${firstName.value} ${lastName.value}`,
        isAdult: age.value >= 18,
        displayText: `${firstName.value} ${lastName.value} (${age.value})`
      }),
      [firstName, lastName, age]
    );
    
    expect(profile.value).toEqual({
      fullName: 'John Doe',
      isAdult: true,
      displayText: 'John Doe (25)'
    });
    
    age.value = 16;
    
    expect(profile.value.isAdult).toBe(false);
    expect(profile.value.displayText).toBe('John Doe (16)');
  });

  it('should clean up dependencies on destroy', () => {
    const dep1 = new Observable(1);
    const dep2 = new Observable(2);
    const observer = jest.fn();
    
    const computed = new ComputedObservable(
      () => dep1.value + dep2.value,
      [dep1, dep2]
    );
    
    computed.subscribe(observer);
    observer.mockClear();
    
    computed.destroy();
    
    // Changes to dependencies should not affect the computed observable
    dep1.value = 100;
    dep2.value = 200;
    
    expect(observer).not.toHaveBeenCalled();
  });

  it('should handle circular dependency protection implicitly', () => {
    const a = new Observable(1);
    const b = new ComputedObservable(() => a.value * 2, [a]);
    
    // This should not create infinite loops
    const observer = jest.fn();
    b.subscribe(observer);
    observer.mockClear();
    
    a.value = 5;
    
    expect(b.value).toBe(10);
    expect(observer).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in compute function', () => {
    const a = new Observable(1);
    const observer = jest.fn();
    
    const errorComputed = new ComputedObservable(
      () => {
        if (a.value === 0) throw new Error('Division by zero');
        return 10 / a.value;
      },
      [a]
    );
    
    expect(errorComputed.value).toBe(10); // 10 / 1
    
    errorComputed.subscribe(observer);
    observer.mockClear();
    
    // This should not crash the system
    expect(() => {
      a.value = 0;
    }).not.toThrow();
  });

  it('should work with nested computed observables', () => {
    const base = new Observable(2);
    const doubled = new ComputedObservable(() => base.value * 2, [base]);
    const quadrupled = new ComputedObservable(() => doubled.value * 2, [doubled]);
    
    expect(quadrupled.value).toBe(8); // 2 * 2 * 2
    
    base.value = 3;
    
    expect(doubled.value).toBe(6); // 3 * 2
    expect(quadrupled.value).toBe(12); // 6 * 2
  });
});