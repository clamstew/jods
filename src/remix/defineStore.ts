import { z } from "zod";
import { store, json, type StoreState } from "../index";

type StoreConfig<T extends StoreState> = {
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

export function defineStore<T extends StoreState>(config: StoreConfig<T>) {
  // Create a jods store with signals instead of simple state variable
  const jodsStore = store(config.defaults);

  return {
    ...config,
    store: jodsStore,
    getState: () => json(jodsStore),
    setState: (newState: T) => {
      // Update store properties to trigger proper signals
      Object.assign(jodsStore, newState);
    },
    loader: async ({ request }: { request: Request }) => {
      if (config.loader) {
        const loaded = await config.loader({ request });
        Object.assign(jodsStore, loaded);
      }
      return { [config.name]: json(jodsStore) };
    },
    action: async ({ request }: { request: Request }) => {
      const form = await request.formData();
      const handlerName = form.get("_jods_handler") as string;
      if (!handlerName || !config.handlers?.[handlerName]) {
        throw new Error(`Invalid handler: ${handlerName}`);
      }
      const updated = await config.handlers[handlerName]({
        current: json(jodsStore) as T,
        form,
        request,
      });
      const validated = config.schema.parse(updated);
      Object.assign(jodsStore, validated);
      return { [config.name]: json(jodsStore) };
    },
  };
}
