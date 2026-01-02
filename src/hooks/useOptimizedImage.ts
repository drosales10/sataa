// ============================================================================
// HOOK: OPTIMIZED IMAGE LOADING
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseOptimizedImageOptions {
  src: string;
  placeholder?: string;
  threshold?: number;
}

/**
 * Hook para lazy loading de imágenes con Intersection Observer
 */
export function useOptimizedImage({ 
  src, 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  threshold = 0.1 
}: UseOptimizedImageOptions) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && src && !isLoaded) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setIsError(false);
      };

      img.onerror = () => {
        setIsError(true);
        setIsLoaded(false);
      };

      img.src = src;
    }
  }, [inView, src, isLoaded]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
  };
}

/**
 * Componente de imagen optimizada con lazy loading
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  placeholder,
  className = '',
  ...props 
}: OptimizedImageProps) {
  const { ref, src: optimizedSrc, isLoaded, isError } = useOptimizedImage({ 
    src, 
    placeholder 
  });

  const combinedClassName = `relative ${className}`;
  const imgClassName = `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isError ? 'hidden' : ''}`;

  return (
    <div ref={ref} className={combinedClassName}>
      <img
        src={optimizedSrc}
        alt={alt}
        className={imgClassName}
        {...props}
      />
      {!isLoaded && !isError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {isError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Error al cargar imagen</span>
        </div>
      )}
    </div>
  );
}