import { CustomLogChannel, LogMessage } from './ChannelTypes';

/**
 * Async log consumer interface
 */
export interface AsyncLogConsumer {
    /**
     * Process a log message asynchronously
     * @param message The log message to process
     * @returns Promise that resolves when processing is complete
     */
    consume(message: LogMessage): Promise<void>;
    
    /**
     * Optional error handler for when consume() throws
     * @param error The error that occurred
     * @param message The message that caused the error
     */
    onError?(error: Error, message: LogMessage): void;
}

/**
 * Function type for removing a consumer
 */
export type RemoveConsumerFunction = () => void;

/**
 * Channel that manages async log consumers
 */
export class AsyncConsumerLogChannel implements CustomLogChannel {
    readonly type = 'LogChannel' as const;
    
    private readonly name: string;
    private readonly consumers = new Set<AsyncLogConsumer>();
    private readonly processingQueue: Array<{ message: LogMessage; timestamp: number }> = [];
    private isProcessing = false;
    
    constructor(name: string) {
        this.name = name;
    }
    
    /**
     * Get the channel name
     */
    getName(): string {
        return this.name;
    }
    
    /**
     * Add a consumer to this channel
     * @param consumer The consumer to add
     * @returns Function to remove this consumer
     */
    addConsumer(consumer: AsyncLogConsumer): RemoveConsumerFunction {
        this.consumers.add(consumer);
        
        // Return removal function
        return () => {
            this.consumers.delete(consumer);
        };
    }
    
    
    /**
     * Get the number of consumers
     */
    getConsumerCount(): number {
        return this.consumers.size;
    }
    
    /**
     * Write log message (from CustomLogChannel interface)
     * This queues the message for async processing
     */
    write(message: LogMessage): void {
        if (this.consumers.size === 0) {
            return; // No consumers, skip processing
        }
        
        // Add to queue
        this.processingQueue.push({
            message,
            timestamp: Date.now()
        });
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    
    /**
     * Process the queue of messages asynchronously
     * @private
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) {
            return; // Already processing
        }
        
        this.isProcessing = true;
        
        try {
            while (this.processingQueue.length > 0) {
                const item = this.processingQueue.shift();
                if (!item) continue;
                
                // Process message with all consumers in parallel
                const consumerPromises = Array.from(this.consumers).map(consumer =>
                    this.processWithConsumer(consumer, item.message)
                );
                
                // Wait for all consumers to process this message
                await Promise.allSettled(consumerPromises);
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * Process a message with a specific consumer
     * @private
     */
    private async processWithConsumer(consumer: AsyncLogConsumer, message: LogMessage): Promise<void> {
        try {
            await consumer.consume(message);
        } catch (error) {
            // Handle consumer errors
            const err = error instanceof Error ? error : new Error(String(error));
            
                if (consumer.onError) {
                    try {
                        consumer.onError(err, message);
                    } catch (onErrorErr) {
                        // If onError also throws, log to console as fallback
                        console.error(`AsyncConsumerLogChannel[${this.name}]: Consumer onError handler failed:`, onErrorErr);
                    }
                } else {
                    // Default error handling - log to console
                    console.error(`AsyncConsumerLogChannel[${this.name}]: Consumer failed:`, err);
                }
        }
    }
    
    /**
     * Clear all consumers
     */
    clearConsumers(): void {
        this.consumers.clear();
    }
    
    /**
     * Get current queue size (for monitoring)
     */
    getQueueSize(): number {
        return this.processingQueue.length;
    }
    
    /**
     * Check if currently processing
     */
    isCurrentlyProcessing(): boolean {
        return this.isProcessing;
    }
}