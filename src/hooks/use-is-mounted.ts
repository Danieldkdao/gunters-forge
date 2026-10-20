import { useSyncExternalStore } from "react";

// Guards code to only run on the client
// Returns false during server rendering and hydration
// True during client snapshot read
export const useIsMounted = () => {
  const subscribe = () => {
    return () => {};
  };

  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
};
