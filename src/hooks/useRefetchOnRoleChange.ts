import { useEffect } from "react";
import { onRoleChange } from "@/lib/roleEmitter";

/**
 * Custom hook that triggers a callback whenever the role changes
 * Useful for refetching data when role switches
 * Safe to use in any context - handles SSR gracefully
 */
/**
 * Custom hook that triggers a callback whenever the role changes
 * Useful for refetching data when role switches
 * Safe to use in any context - handles SSR gracefully
 */
export function useRefetchOnRoleChange(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Subscribe to role changes via global event emitter
      const unsubscribe = onRoleChange(() => {
        // Add a small delay to ensure localStorage is updated
        const timer = setTimeout(() => {
          try {
            callback();
          } catch (e) {
            console.error('Error in role change callback:', e);
          }
        }, 50);
        return () => clearTimeout(timer);
      });

      return unsubscribe;
    } catch (e) {
      console.error('Failed to setup role change listener:', e);
      return undefined;
    }
  }, [callback]);
}


