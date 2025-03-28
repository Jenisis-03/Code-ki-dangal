/**
 * Performance monitoring utilities for production
 * Helps track and optimize application performance
 */

import { isProduction } from '@/lib/env';

// Performance metrics storage
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

// In-memory storage for performance metrics
const metrics: PerformanceMetric[] = [];

// Maximum number of metrics to store in memory
const MAX_METRICS = 100;

/**
 * Measure the execution time of a function
 * @param name Name of the operation being measured
 * @param fn Function to measure
 * @returns Result of the function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    recordMetric(name, duration);
  }
}

/**
 * Record a performance metric
 * @param name Name of the operation
 * @param duration Duration in milliseconds
 */
export function recordMetric(name: string, duration: number): void {
  // Add metric to the beginning of the array
  metrics.unshift({
    name,
    duration,
    timestamp: Date.now(),
  });
  
  // Keep only the most recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.pop();
  }
  
  // Log slow operations in development
  if (!isProduction && duration > 1000) {
    console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
  }
}

/**
 * Get performance metrics for analysis
 * @param operationName Optional filter by operation name
 * @returns Filtered performance metrics
 */
export function getPerformanceMetrics(operationName?: string): PerformanceMetric[] {
  if (operationName) {
    return metrics.filter(metric => metric.name === operationName);
  }
  return [...metrics];
}

/**
 * Calculate average duration for an operation
 * @param operationName Name of the operation
 * @returns Average duration in milliseconds
 */
export function getAverageDuration(operationName: string): number {
  const relevantMetrics = metrics.filter(metric => metric.name === operationName);
  
  if (relevantMetrics.length === 0) {
    return 0;
  }
  
  const totalDuration = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / relevantMetrics.length;
}

/**
 * Performance monitoring decorator for class methods
 * @param target Class prototype
 * @param propertyKey Method name
 * @param descriptor Method descriptor
 * @returns Modified descriptor with performance monitoring
 */
export function monitor(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const className = this.constructor.name;
    const methodName = propertyKey;
    const operationName = `${className}.${methodName}`;
    
    return measurePerformance(operationName, () => originalMethod.apply(this, args));
  };
  
  return descriptor;
}