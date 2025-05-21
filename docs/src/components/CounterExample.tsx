import React from "react";
import { translate } from "@docusaurus/Translate";
import CodeBlock from "@theme/CodeBlock";

export default function CounterExample() {
  // Get translations for counter and count
  const counter = translate({
    id: "homepage.demo.counter.example.counter",
    message: "counter",
    description: "Translation for 'counter' in Counter example",
  });

  const count = translate({
    id: "homepage.demo.counter.example.count",
    message: "Count",
    description: "Translation for 'Count' in Counter example",
  });

  // Get translation for property name
  const countProperty = translate({
    id: "homepage.demo.counter.example.property.count",
    message: "count",
    description: "Translation for the count property name in Counter example",
  });

  const counterCode = `import { store } from 'jods';
import { useJods } from 'jods/react';

const ${counter} = store({ ${countProperty}: 0 });

function Counter() {
  const state = useJods(${counter});
  
  return (
    <button onClick={() => ${counter}.${countProperty}++}>
      ${count}: {state.${countProperty}}
    </button>
  );
}`;

  return (
    <div className="counter-example-container">
      <CodeBlock language="jsx">{counterCode}</CodeBlock>
    </div>
  );
}
