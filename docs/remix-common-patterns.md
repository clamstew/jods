# Common Patterns with jods and Remix

This guide covers common patterns and best practices for using jods with Remix applications.

## Error Handling

Handling errors gracefully in form submissions and loaders:

```typescript
export const user = defineStore({
  // ...
  handlers: {
    async updateProfile({ current, form }) {
      try {
        // Validate input
        const name = form.get("name");
        if (!name || typeof name !== "string") {
          return {
            ...current,
            error: "Name is required",
            formError: true,
          };
        }

        // Attempt update
        await updateUserInDb({ name });
        return {
          ...current,
          name,
          error: null,
          formError: false,
          updated: true,
        };
      } catch (error) {
        // Return error state
        return {
          ...current,
          error: error.message,
          formError: true,
          updated: false,
        };
      }
    },
  },
});

// In your component
function ProfileForm() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <form {...form.props}>
      {userData.formError && <div className="error">{userData.error}</div>}
      <input name="name" defaultValue={userData.name} />
      <button type="submit">Update Profile</button>
      {userData.updated && <div className="success">Profile updated!</div>}
    </form>
  );
}
```

## Dependent Data Loading

When one store depends on another:

```typescript
export const user = defineStore({
  name: "user",
  schema: userSchema,
  loader: async () => getUserFromDb(),
});

export const posts = defineStore({
  name: "posts",
  schema: postsSchema,
  loader: async ({ getState }) => {
    // Get data from another store
    const userData = getState("user");
    if (!userData?.id) {
      return [];
    }
    return getPostsForUser(userData.id);
  },
});

// Use both stores in your route
export const loader = withJods([user, posts]);
```

## Form Validation

Using Zod for form validation:

```typescript
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const contact = defineStore({
  name: "contact",
  schema: contactSchema.extend({
    // Add additional fields for form state
    errors: z.record(z.string()).optional(),
    success: z.boolean().optional(),
  }),
  defaults: {
    name: "",
    email: "",
    message: "",
  },
  handlers: {
    async submit({ form }) {
      const data = {
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
      };

      // Validate using Zod
      const result = contactSchema.safeParse(data);

      if (!result.success) {
        // Return validation errors
        return {
          ...data,
          errors: result.error.flatten().fieldErrors,
          success: false,
        };
      }

      // Process valid submission
      await sendContactForm(result.data);

      return {
        name: "",
        email: "",
        message: "",
        errors: {},
        success: true,
      };
    },
  },
});
```

## Optimistic UI Updates

Implementing optimistic UI for better user experience:

```tsx
import { useOptimisticUpdate, useJodsForm, useJodsStore } from "jods/remix";
import { todo } from "~/jods/todo.jods";

function TodoList() {
  const todoData = useJodsStore(todo);
  const form = useJodsForm(todo.actions.toggleComplete);

  // Create optimistic UI updates when toggling todo items
  const optimisticTodos = useOptimisticUpdate(
    todo,
    "toggleComplete",
    (currentState) => {
      const todoId = form.formData?.get("id") as string;
      if (!todoId) return currentState;

      return {
        items: currentState.items.map((item) =>
          item.id === todoId ? { ...item, completed: !item.completed } : item
        ),
      };
    }
  );

  return (
    <div>
      <h1>Todo List</h1>
      <ul>
        {optimisticTodos.items.map((item) => (
          <li key={item.id} className={item.completed ? "completed" : ""}>
            <form {...form.props}>
              <input type="hidden" name="id" value={item.id} />
              <button type="submit">
                {item.completed ? "Mark Incomplete" : "Mark Complete"}
              </button>
            </form>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Nested Forms

Handling nested data structures in forms:

```tsx
export const profile = defineStore({
  name: "profile",
  schema: z.object({
    name: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    }),
  }),
  handlers: {
    async updateAddress({ current, form }) {
      return {
        ...current,
        address: {
          street: form.get("street"),
          city: form.get("city"),
          zipCode: form.get("zipCode"),
        },
      };
    },
  },
});

// In your component
function AddressForm() {
  const profileData = useJodsStore(profile);
  const form = useJodsForm(profile.actions.updateAddress);

  return (
    <form {...form.props}>
      <input name="street" defaultValue={profileData.address.street} />
      <input name="city" defaultValue={profileData.address.city} />
      <input name="zipCode" defaultValue={profileData.address.zipCode} />
      <button type="submit">Update Address</button>
    </form>
  );
}
```

## Tracking Loading/Submission State

Using `useJodsFetchers` and `useJodsTransition` to provide feedback:

```tsx
import { useJodsFetchers, useJodsTransition } from "jods/remix";

function SubmitButton() {
  const { isSubmitting } = useJodsFetchers("profile.updateProfile");
  const { isPending } = useJodsTransition("profile.updateProfile");

  const isBusy = isSubmitting || isPending;

  return (
    <>
      <button type="submit" disabled={isBusy}>
        {isBusy ? "Saving..." : "Save Profile"}
      </button>
      {isBusy && <div className="spinner" />}
    </>
  );
}
```

## Caching Strategies

Using the cache control utilities:

```typescript
import { setJodsCacheControl } from "jods/remix";

export const products = defineStore({
  name: "products",
  schema: productsSchema,
  loader: async ({ request }) => {
    // Get headers from request
    const url = new URL(request.url);
    const headers = new Headers();

    // Get products data
    const products = await getProducts();

    // Set cache control headers - cache for 5 minutes
    setJodsCacheControl(headers, {
      maxAge: 300,
      staleWhileRevalidate: 600,
      private: false,
    });

    return products;
  },
});
```

## Sequential Form Submissions

Handling forms that should be submitted in a specific order:

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const formData = useJodsStore(formStore);

  // Different form for each step
  const step1Form = useJodsForm(formStore.actions.saveStep1);
  const step2Form = useJodsForm(formStore.actions.saveStep2);
  const submitForm = useJodsForm(formStore.actions.submit);

  // Track submission state
  const { isSubmitting } = useJodsFetchers("formStore.submit");

  return (
    <div>
      {step === 1 && (
        <form
          {...step1Form.props}
          onSubmit={(e) => {
            e.preventDefault();
            step1Form.submit(e).then(() => setStep(2));
          }}
        >
          {/* Step 1 fields */}
          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <form
          {...step2Form.props}
          onSubmit={(e) => {
            e.preventDefault();
            step2Form.submit(e).then(() => setStep(3));
          }}
        >
          {/* Step 2 fields */}
          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
          <button type="submit">Next</button>
        </form>
      )}

      {step === 3 && (
        <form {...submitForm.props}>
          <div className="summary">{/* Show summary of entered data */}</div>
          <button type="button" onClick={() => setStep(2)}>
            Back
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
```
