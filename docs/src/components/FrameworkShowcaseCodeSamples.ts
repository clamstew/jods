export const reactCodeSample = (
  counterReact: string,
  countProperty: string,
  countReact: string
) => `import { store } from 'jods';
import { useJods } from 'jods/react';

const ${counterReact} = store({ ${countProperty}: 0 });

function Counter() {
  const state = useJods(${counterReact});
  
  return (
    <button onClick={() => ${counterReact}.${countProperty}++}>
      ${countReact}: {state.${countProperty}}
    </button>
  );
}`;

export const preactCodeSample = (
  counterPreact: string,
  countProperty: string,
  countPreact: string
) => `import { store } from 'jods';
import { useJods } from 'jods/preact';

const ${counterPreact} = store({ ${countProperty}: 0 });

function Counter() {
  const state = useJods(${counterPreact});
  
  return (
    <button onClick={() => ${counterPreact}.${countProperty}++}>
      ${countPreact}: {state.${countProperty}}
    </button>
  );
}`;

export const remixCodeSample = (
  counter: string,
  countProperty: string
) => `import { defineStore, useJods, j } from 'jods/remix';

export const ${counter} = defineStore({
  name: 'counter',
  schema: j.object({
    ${countProperty}: j.number(),
    lastUpdated: j.string().optional(),
  }),
  defaults: { 
    ${countProperty}: 0,
    lastUpdated: null,
  },
  handlers: {
    async increment({ current }) {
      return {
        ...current,
        ${countProperty}: current.${countProperty} + 1,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
});

// In your component
function Counter() {
  const { store, actions } = useJods(${counter}, 'increment');
  
  return (
    <div>
      <h1>Count: {store.${countProperty}}</h1>
      
      {store.lastUpdated && (
        <p className="update-time">
          Last updated: {store.lastUpdated}
        </p>
      )}
      
      <actions.increment.Form>
        <button type="submit">Increment</button>
      </actions.increment.Form>
    </div>
  );
}`;
