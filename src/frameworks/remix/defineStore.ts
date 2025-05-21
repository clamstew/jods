/* eslint-disable @typescript-eslint/no-unused-vars */
import { j } from "./index"; // Import j from Remix index instead of directly from utils
/* eslint-enable @typescript-eslint/no-unused-vars */
import { store, json, type StoreState } from "../../index";

type StoreConfig<T extends StoreState> = {
  name: string;
  schema: any; // Use any for schema type to handle j.ZodType
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

      try {
        const updated = await config.handlers[handlerName]({
          current: json(jodsStore) as T,
          form,
          request,
        });

        // Using the schema from config to validate data
        const validated = config.schema.parse(updated);

        // Update store with validated data
        Object.assign(jodsStore, validated);

        return { [config.name]: json(jodsStore) };
      } catch (error) {
        // If validation fails, rethrow the error
        throw error;
      }
    },
  };
}
