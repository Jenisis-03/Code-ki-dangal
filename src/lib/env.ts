/**
 * Environment variables configuration with validation
 * Ensures all required environment variables are present and correctly typed
 */

// Define the shape of our environment variables
interface EnvVariables {
  // Database
  DATABASE_URL: string;
  
  // API URLs and keys
  FRONTEND_URL: string;
  
  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Server configuration
  PORT?: string;
}

// Default values for optional environment variables
const defaultValues: Partial<EnvVariables> = {
  PORT: '3000',
};

/**
 * Get environment variable with validation
 * @param key The environment variable key
 * @param defaultValue Optional default value
 * @param required Whether the variable is required
 * @returns The environment variable value
 */
function getEnvVar(
  key: keyof EnvVariables,
  defaultValue?: string,
  required = true
): string {
  const value = process.env[key] || defaultValue;
  
  if (required && !value) {
    // In production, throw an error if required variables are missing
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment variable ${key} is required but not set`);
    } else {
      // In development, log a warning
      console.warn(`⚠️ Environment variable ${key} is not set`);
    }
  }
  
  return value || '';
}

/**
 * Environment variables with validation and defaults
 */
export const env: EnvVariables = {
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  
  // API URLs
  FRONTEND_URL: getEnvVar('FRONTEND_URL', '*'),
  
  // Node environment
  NODE_ENV: getEnvVar('NODE_ENV', 'development') as EnvVariables['NODE_ENV'],
  
  // Server configuration
  PORT: getEnvVar('PORT', defaultValues.PORT, false),
};

/**
 * Check if running in production environment
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development environment
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test environment
 */
export const isTest = env.NODE_ENV === 'test';