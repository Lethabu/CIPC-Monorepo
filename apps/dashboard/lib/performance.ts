export const trackModuleFederationLoad = (componentName: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[MF] ${componentName} loaded in ${duration.toFixed(2)}ms`);
      
      // Track to analytics in production
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Add your analytics tracking here
      }
    }
  };
};