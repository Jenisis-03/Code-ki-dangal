import { ImageProps } from 'next/image';

/**
 * Utility for optimizing image loading in the application
 * Provides consistent image configuration for better performance
 */

// Default image sizes for responsive design
export const defaultImageSizes = {
  small: '(max-width: 640px) 100vw, 640px',
  medium: '(max-width: 1024px) 50vw, 512px',
  large: '(max-width: 1536px) 33vw, 512px',
  full: '100vw',
};

// Default image loading priority settings
export const defaultPriority = {
  high: true,
  low: false,
};

// Default image quality settings
export const defaultQuality = {
  high: 85,
  medium: 75,
  low: 60,
};

/**
 * Get optimized image props based on usage context
 * @param priority Whether the image should be prioritized for loading
 * @param size The responsive size configuration to use
 * @param quality The quality level for the image
 * @returns Partial ImageProps with optimized settings
 */
export function getOptimizedImageProps(
  priority: boolean = defaultPriority.low,
  size: string = defaultImageSizes.medium,
  quality: number = defaultQuality.medium
): Partial<ImageProps> {
  return {
    priority,
    quality,
    sizes: size,
    loading: priority ? 'eager' : 'lazy',
    // Use modern formats when available
    placeholder: priority ? 'blur' : 'empty',
  };
}

/**
 * Get optimized image URL with parameters for external images
 * @param url The original image URL
 * @param width The desired width
 * @param quality The quality level (0-100)
 * @returns Optimized image URL with parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width: number = 800,
  quality: number = defaultQuality.medium
): string {
  // For external images that don't go through Next.js Image optimization
  // This is a placeholder implementation - adjust based on your CDN or image service
  if (!url) return '';
  
  // If URL already has parameters, append to them
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&q=${quality}`;
}