/** @jsxImportSource react */
import { useNavigation } from "@remix-run/react";

/**
 * Hook to track transition state for jods action submissions
 *
 * @param actionId Optional action ID to filter for specific actions
 * @returns Object with transition state information
 */
export function useJodsTransition(actionId?: string) {
  const navigation = useNavigation();

  // If no actionId provided, return general transition state
  if (!actionId || !navigation.formData) {
    return {
      isSubmitting: navigation.state === "submitting",
      isPending: navigation.state !== "idle",
      formData: navigation.formData,
    };
  }

  // Check if this transition is for the specified action
  const isRelevant = navigation.formData?.get("__jods_action") === actionId;

  return {
    isSubmitting: navigation.state === "submitting" && isRelevant,
    isPending:
      (navigation.state === "loading" || navigation.state === "submitting") &&
      isRelevant,
    formData: isRelevant ? navigation.formData : null,
  };
}
