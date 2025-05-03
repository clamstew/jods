/** @jsxImportSource react */
import { useTransition } from "@remix-run/react";

/**
 * Hook to track transition state for jods action submissions
 *
 * @param actionId Optional action ID to filter for specific actions
 * @returns Object with transition state information
 */
export function useJodsTransition(actionId?: string) {
  const transition = useTransition();

  // If no actionId provided, return general transition state
  if (!actionId || !transition.submission) {
    return {
      isSubmitting: transition.state === "submitting",
      isPending: transition.state !== "idle",
      formData: transition.submission?.formData,
    };
  }

  // Check if this transition is for the specified action
  const isRelevant =
    transition.submission?.formData?.get("__jods_action") === actionId;

  return {
    isSubmitting: transition.state === "submitting" && isRelevant,
    isPending: transition.state !== "idle" && isRelevant,
    formData: isRelevant ? transition.submission?.formData : null,
  };
}
