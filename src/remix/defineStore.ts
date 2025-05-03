import { z } from "zod";

type StoreConfig<T> = {
  name: string;
  schema: z.ZodType<T>;
  defaults: T;
  handlers?: {
    [key: string]: (ctx: {
      current: T;
      form: FormData;
      request: Request;
    }) => Promise<T> | T;
  };
  loader?: (ctx: { request: Request }) => Promise<T>;
};

export function defineStore<T>(config: StoreConfig<T>) {
  let state: T = config.defaults;

  return {
    ...config,
    getState: () => state,
    setState: (newState: T) => {
      state = newState;
    },
    loader: async ({ request }: { request: Request }) => {
      if (config.loader) {
        const loaded = await config.loader({ request });
        state = loaded;
      }
      return { [config.name]: state };
    },
    action: async ({ request }: { request: Request }) => {
      const form = await request.formData();
      const handlerName = form.get("_jods_handler") as string;
      if (!handlerName || !config.handlers?.[handlerName]) {
        throw new Error(`Invalid handler: ${handlerName}`);
      }
      const updated = await config.handlers[handlerName]({
        current: state,
        form,
        request,
      });
      state = config.schema.parse(updated);
      return { [config.name]: state };
    },
  };
}
