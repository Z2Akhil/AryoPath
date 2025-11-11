/**
 * Circuit Breaker pattern implementation for ThyroCare API calls
 * Prevents repeated calls to failing APIs and provides graceful degradation
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    
    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 3;
    this.timeout = options.timeout || 60000; // 1 minute timeout when OPEN
    this.resetTimeout = options.resetTimeout || 300000; // 5 minutes to reset after success
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      circuitOpens: 0,
      lastFailure: null,
      lastSuccess: null
    };
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - The function to execute
   * @returns {Promise<any>} The result of the function
   */
  async execute(fn) {
    this.stats.totalCalls++;
    
    // Check if circuit is OPEN and timeout hasn't expired
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log('🔴 Circuit breaker is OPEN, rejecting request');
        throw new Error('Circuit breaker is OPEN - ThyroCare API is temporarily unavailable');
      } else {
        console.log('🟡 Circuit breaker transitioning to HALF_OPEN');
        this.state = 'HALF_OPEN';
      }
    }

    try {
      console.log(`🟢 Circuit breaker ${this.state}, executing function`);
      const result = await fn();
      
      // On success
      this.onSuccess();
      return result;
      
    } catch (error) {
      // On failure
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    this.stats.successfulCalls++;
    this.stats.lastSuccess = new Date();
    
    if (this.state === 'HALF_OPEN') {
      console.log('🟢 HALF_OPEN success, checking if circuit should close');
      
      if (this.successCount >= this.successThreshold) {
        console.log('✅ Circuit breaker closing - success threshold reached');
        this.state = 'CLOSED';
        this.successCount = 0;
        this.stats.circuitOpens++;
      }
    }
  }

  /**
   * Handle failed execution
   */
  onFailure() {
    this.failureCount++;
    this.successCount = 0;
    this.stats.failedCalls++;
    this.stats.lastFailure = new Date();
    
    console.log(`❌ Circuit breaker failure (${this.failureCount}/${this.failureThreshold})`);
    
    if (this.failureCount >= this.failureThreshold) {
      console.log('🔴 Circuit breaker opening - failure threshold reached');
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      this.stats.circuitOpens++;
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
      stats: { ...this.stats }
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    console.log('🔄 Manually resetting circuit breaker');
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  /**
   * Check if circuit is currently open
   */
  isOpen() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      return false;
    }
    return this.state === 'OPEN';
  }
}

// Create a singleton instance for ThyroCare API calls
const thyrocareCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3, // Open circuit after 3 consecutive failures
  successThreshold: 2, // Close circuit after 2 consecutive successes
  timeout: 120000, // 2 minutes timeout when OPEN
  resetTimeout: 300000 // 5 minutes to reset after success
});

export { CircuitBreaker, thyrocareCircuitBreaker };
