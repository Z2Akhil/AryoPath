/**
 * Request Queueing System for ThyroCare API calls
 * Prevents concurrent API calls that could trigger WAF/Cloudflare protection
 */
class RequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.concurrency = options.concurrency || 1; // Only process one request at a time
    this.minDelay = options.minDelay || 5000; // Minimum 5 seconds between requests
    this.lastProcessed = 0;
    
    // Statistics
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      queueSize: 0,
      averageWaitTime: 0,
      lastProcessedTime: null
    };
  }

  /**
   * Add a request to the queue
   * @param {Function} fn - The function to execute
   * @param {Object} options - Request options
   * @returns {Promise<any>} The result of the function
   */
  async enqueue(fn, options = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        fn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        priority: options.priority || 'normal', // 'high', 'normal', 'low'
        metadata: options.metadata || {}
      };

      // Add to queue based on priority
      if (request.priority === 'high') {
        this.queue.unshift(request); // Add to front for high priority
      } else {
        this.queue.push(request); // Add to end for normal/low priority
      }

      this.stats.queueSize = this.queue.length;
      console.log(`📥 Enqueued request (priority: ${request.priority}), queue size: ${this.queue.length}`);

      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`🔄 Starting queue processing, ${this.queue.length} requests in queue`);

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      this.stats.queueSize = this.queue.length;

      try {
        // Calculate delay to ensure minimum spacing between requests
        const now = Date.now();
        const timeSinceLastProcessed = now - this.lastProcessed;
        const delayNeeded = Math.max(0, this.minDelay - timeSinceLastProcessed);

        if (delayNeeded > 0) {
          console.log(`⏳ Delaying request by ${delayNeeded}ms to maintain minimum spacing`);
          await new Promise(resolve => setTimeout(resolve, delayNeeded));
        }

        // Calculate wait time for statistics
        const waitTime = Date.now() - request.enqueuedAt;
        this.stats.averageWaitTime = (this.stats.averageWaitTime * this.stats.totalProcessed + waitTime) / (this.stats.totalProcessed + 1);

        console.log(`🚀 Processing request after ${waitTime}ms wait (queue: ${this.queue.length})`);
        
        // Execute the function
        const result = await request.fn();
        
        // Update statistics
        this.stats.totalProcessed++;
        this.stats.lastProcessedTime = new Date();
        this.lastProcessed = Date.now();
        
        console.log(`✅ Request processed successfully (total: ${this.stats.totalProcessed})`);
        request.resolve(result);
        
      } catch (error) {
        // Update statistics
        this.stats.totalFailed++;
        console.error(`❌ Request failed:`, error.message);
        request.reject(error);
      }

      // Small delay between processing to prevent tight loops
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
    console.log('🏁 Queue processing completed');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      stats: { ...this.stats },
      nextAvailable: this.lastProcessed + this.minDelay - Date.now()
    };
  }

  /**
   * Clear the queue (for emergency situations)
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.stats.queueSize = 0;
    console.log(`🧹 Cleared ${clearedCount} requests from queue`);
    return clearedCount;
  }

  /**
   * Get queue length
   */
  getLength() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }
}

// Create a singleton instance for ThyroCare API calls
const thyrocareRequestQueue = new RequestQueue({
  concurrency: 1, // Only one concurrent request to ThyroCare
  minDelay: 10000 // Minimum 10 seconds between ThyroCare API calls
});

export { RequestQueue, thyrocareRequestQueue };
