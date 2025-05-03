---
slug: jods-journey
title: "The jods Journey: From Name-Squatting to Full Framework Integration"
authors: [clay]
tags: [jods, react, remix, signals, reactivity]
---

# The jods Journey: From Name-Squatting to Full Framework Integration

What started as a simple npm name-squatting exercise has evolved into something far more meaningful in just under two weeks. Here's the story of how jods came to be.

## The Beginning: A Short Name on npm

About two weeks ago, I decided to claim a short, memorable name on npm — [@jods](https://www.npmjs.com/package/jods) (JavaScript Object Dynamics System). Initially, after playing around with [BullMQ](https://github.com/taskforcesh/bullmq), I thought it might become a job queuing system (jods = jobs, get it?). But I quickly pivoted when I had a loose idea about creating a state management library instead. At that point, I just wanted to secure a name that was easy to remember and type.

## Creating a Simple API

After securing the name, I started to flesh out what this library could be. I knew I wanted something with:

- 🌟 A simple, intuitive API
- 🎯 Zero dependencies
- 🔌 Easy integration with any framework
- 📸 JSON snapshot capability out of the box

I quickly realized that with a proxy-based approach, I could create something that felt natural to use — just plain JavaScript objects that magically become reactive.

## React and Beyond

Once I had the core reactivity system working, I moved on to integrating with React. This is where things got interesting. I found that with the proxy approach, integrating with React was almost trivial:

```jsx
// Create a store
const user = store({
  firstName: "Burt",
  lastName: "Macklin",
  mood: "curious",
});

// In your React component
function Profile() {
  const userData = useJods(user);

  return (
    <div>
      <h1>Hello, {userData.firstName}</h1>
      <p>Mood: {userData.mood}</p>

      {/* Direct state mutations - no actions, reducers, or dispatchers needed */}
      <button onClick={() => (user.mood = "sneaky")}>Go Undercover</button>
      <button onClick={() => (user.firstName = "Burt Macklin")}>
        Use FBI Name
      </button>
    </div>
  );
}
```

The simplicity compared to some other libraries surprised me 🤔. No need for selectors, actions, or reducers — just directly use the object. That "aha moment" when I realized I could just write `user.mood = "sneaky"` and have the UI update automatically was when I knew this approach had merit. 🙌

## The Signal Revolution

As the project progressed, I couldn't ignore the growing popularity of signals in frameworks like Preact, Solid, and Angular. The [proposed TC39 signals spec](https://github.com/tc39/proposal-signals) caught my attention, and I even [opened an issue](https://github.com/clamstew/jods/issues/11) to track our potential adoption of native signals.

So one morning, I created a [branch to rewrite jods with signals](https://github.com/clamstew/jods/pull/20) as the foundation. This enabled more fine-grained reactivity — only updating components when the specific properties they use change, rather than the entire store. The community showed interest too, with discussions emerging around [signal integration strategies](https://github.com/clamstew/jods/issues/23).

## Enter Remix: Rethinking the Model Layer

With the core reactivity model working well, I decided to tackle one of my favorite meta-frameworks: Remix. Remix is incredibly powerful, but there's sometimes boilerplate when setting up loaders, actions, and form handling.

I realized jods could serve as a bridge — creating a more model-centric approach where your data models define their:

- 📝 Schema validation
- 🔄 Server-side loaders
- 📋 Form handlers
- ⚡️ Client-side reactivity

The result is what we now have in `jods/remix` — a streamlined approach that reduces boilerplate and brings a more familiar model-view pattern to Remix development:

```typescript
// Define your model once
export const user = defineStore({
  name: "user",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  defaults: {
    name: "Guest",
    email: "",
  },
  handlers: {
    async updateProfile({ current, form }) {
      // Update logic
    },
  },
  loader: async ({ request }) => {
    // Load user data
  },
});

// Export ready-to-use loaders and actions
export const loader = withJods([user]);
export const action = user.action;
```

Then in your components, simply use:

```tsx
function ProfilePage() {
  const userData = useJodsStore(user);
  const form = useJodsForm(user.actions.updateProfile);

  return (
    <form {...form.props}>
      <input name="name" defaultValue={userData.name} />
      <button type="submit">Update</button>
    </form>
  );
}
```

## The Road Ahead

While I'm thrilled with how far jods has come in such a short time, there's still much more to explore:

- 💾 Enhanced persistence options ([#5](https://github.com/clamstew/jods/issues/5))
- 🔄 Remote syncing capabilities ([#7](https://github.com/clamstew/jods/issues/7))
- 📡 Streaming updates from server sources ([#9](https://github.com/clamstew/jods/issues/9))
- ⏰ Time-travel debugging
- 🛠️ Developer tools

## Final Thoughts

What started as a simple name registration has evolved into a project I'm genuinely excited about. jods reflects my belief that state management should be as simple and intuitive as possible, while still being powerful enough for real-world applications.

I never expected to build all this in less than two weeks, but it's amazing what you can accomplish when you're passionate about solving a problem you care about.

I'd love to hear your thoughts and see what you build with jods!

— Clay
