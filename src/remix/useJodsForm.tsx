/** @jsxImportSource react */
import { useFetcher } from "@remix-run/react";

export function useJodsForm(store: any, handler: string) {
  const fetcher = useFetcher();

  const HiddenInput = (
    <input type="hidden" name="_jods_handler" value={handler} />
  );

  const FormWrapper = (props: any) => (
    <fetcher.Form method="post">
      {HiddenInput}
      {props.children}
    </fetcher.Form>
  );

  return {
    fetcher,
    Form: FormWrapper,
  };
}
