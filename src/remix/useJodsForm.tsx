/** @jsxImportSource react */
import { useFetcher } from "@remix-run/react";
import { getCreateElement } from "../utils/reactUtils";

export function useJodsForm(store: any, handler: string) {
  const fetcher = useFetcher();
  const createElement = getCreateElement();

  const HiddenInput = createElement("input", {
    key: "_jods_handler_input",
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
