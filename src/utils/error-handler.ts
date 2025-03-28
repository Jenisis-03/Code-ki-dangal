/**
 * Centralized error handling utility for production
 * Provides consistent error logging and formatting
 */

import { isProduction } from '@/lib/env';

// Error codes for consistent error handling
export enum ErrorCode {
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Database errors
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Standard error response format
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  code: ErrorCode;
}

/**
 * Format error for API response
 * @param message Error message
 * @param code Error code
 * @param details Additional error details
 * @returns Formatted error response
 */
export function formatError(
  message: string,
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  details?: string
): ErrorResponse {
  return {
    success: false,
    error: message,
    ...(details && { details }),
    code,
  };
}

/**
 * Log error with appropriate level based on environment
 * @param error Error object
 * @param context Additional context information
 */
export function logError(error: Error | unknown, context?: string): void {
  if (isProduction) {
    // In production, log minimal information
    console.error(
      `[ERROR]${context ? ` [${context}]` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } else {
    // In development, log full error details
    console.error(`[ERROR]${context ? ` [${context}]` : ''}:`, error);
  }
}

/**
 * Handle API errors with consistent formatting
 * @param error Error object
 * @param context Context where the error occurred
 * @returns Formatted error response
 */
export function handleApiError(error: unknown, context?: string): ErrorResponse {
  logError(error, context);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return formatError('Request timed out', ErrorCode.TIMEOUT_ERROR);
    }
    
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return formatError('Network error', ErrorCode.NETWORK_ERROR);
    }
    
    // Return the actual error message in development, generic in production
    return formatError(
      isProduction ? 'An error occurred' : error.message,
      ErrorCode.API_ERROR,
      isProduction ? undefined : error.stack
    );
  }
  
  // Generic error handling
  return formatError('An unexpected error occurred', ErrorCode.UNKNOWN_ERROR);
}

/**
 * Try to execute a function and handle any errors
 * @param fn Function to execute
 * @param errorHandler Custom error handler
 * @returns Result of the function or error handler
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return errorHandler(error);
  }
}