import { useFetchers } from "@remix-run/react";

/**
 * Hook to track the state of all fetchers for a specific jods store action
 *
 * @param actionId The unique identifier for the action (typically store.name + actionName)
 * @returns Object with state information about fetchers for this action
 */
export function useJodsFetchers(actionId: string) {
  const fetchers = useFetchers();

  // Filter fetchers related to this specific jods action
  const relevantFetchers = fetchers.filter(
    (fetcher) => fetcher.formData?.get("__jods_action") === actionId
  );

  return {
    // Are any fetchers for this action currently submitting?
    isSubmitting: relevantFetchers.some((f) => f.state === "submitting"),
    // Have all fetchers for this action completed?
    isComplete: relevantFetchers.every((f) => f.state === "idle"),
    // Count of active fetchers for this action
    count: relevantFetchers.length,
    // All related fetchers
    fetchers: relevantFetchers,
  };
}
