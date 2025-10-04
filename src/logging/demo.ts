import { 
    runAllLoggingExamples,
    runBasicLoggerExamples,
    runAsyncConsumerExamples,
    basicConsoleLoggingExample,
    customLogChannelExample,
    basicMessagesConsumerExample,
    errorTrackingExample,
    realWorldUsageExample
} from './examples';

/**
 * Demo script showing how to use the comprehensive logging examples
 * 
 * This file demonstrates how to import and run the various logging examples
 * that showcase both basic logger configuration and advanced async consumer patterns.
 */

// Example 1: Run all examples in sequence
export function demoAllExamples() {
    console.log('🎬 Starting comprehensive logging demo...');
    runAllLoggingExamples();
}

// Example 2: Run only basic logger configuration examples
export function demoBasicLogging() {
    console.log('🎬 Starting basic logging demo...');
    runBasicLoggerExamples();
}

// Example 3: Run only async consumer examples
export function demoAsyncConsumers() {
    console.log('🎬 Starting async consumer demo...');
    runAsyncConsumerExamples();
}

// Example 4: Run individual examples for targeted learning
export function demoSpecificExamples() {
    console.log('🎬 Running specific examples...');
    
    // Basic logger examples
    console.log('\n--- Running specific basic logger examples ---');
    basicConsoleLoggingExample();
    
    setTimeout(() => {
        customLogChannelExample();
    }, 1000);
    
    // Async consumer examples
    setTimeout(() => {
        console.log('\n--- Running specific async consumer examples ---');
        basicMessagesConsumerExample();
    }, 2000);
    
    setTimeout(() => {
        errorTrackingExample();
    }, 3000);
    
    setTimeout(() => {
        realWorldUsageExample();
    }, 4500);
}

// Example 5: Quick demonstration of key features
export function demoQuickStart() {
    console.log('🎬 Quick start demo - showing key features...');
    
    console.log('\n1️⃣ Basic console logging:');
    basicConsoleLoggingExample();
    
    setTimeout(() => {
        console.log('\n2️⃣ Messages consumer (catches all logs):');
        basicMessagesConsumerExample();
    }, 1000);
    
    setTimeout(() => {
        console.log('\n3️⃣ Error tracking across services:');
        errorTrackingExample();
    }, 2000);
    
    setTimeout(() => {
        console.log('\n✨ Quick start demo complete! Check examples.ts for more.');
    }, 3500);
}

// Uncomment one of these to run when this file is executed:

// demoAllExamples();        // Full comprehensive demo
// demoBasicLogging();       // Just basic logger configuration
// demoAsyncConsumers();     // Just async consumer patterns  
// demoSpecificExamples();   // Individual targeted examples
// demoQuickStart();         // Quick overview of key features

console.log('💡 Logging Demo Script Ready!');
console.log('   Uncomment one of the demo functions above to run examples.');
console.log('   Or import specific functions from examples.ts in your code.');