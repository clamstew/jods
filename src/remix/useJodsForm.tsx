/** @jsxImportSource react */
import { useFetcher } from "@remix-run/react";

// Dynamic import for React to prevent bundling issues
function getReactHooks() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require("react");
    return {
      createElement: React.createElement,
    };
  } catch (e) {
    throw new Error("React is required but could not be loaded");
  }
}

export function useJodsForm(store: any, handler: string) {
  const fetcher = useFetcher();
  const { createElement } = getReactHooks();

  const HiddenInput = createElement("input", {
    type: "hidden",
    name: "_jods_handler",
    value: handler,
  });

  const FormWrapper = (props: any) => {
    // Extract children and spread all other props to the form
    const { children, ...formProps } = props;

    return createElement(fetcher.Form, { method: "post", ...formProps }, [
      HiddenInput,
      children,
    ]);
  };

  return {
    fetcher,
    Form: FormWrapper,
  };
}
