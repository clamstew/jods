import React, { useState } from "react";
import CodeBlock from "@theme/CodeBlock";

export default function InteractiveDemo(): React.ReactElement {
  const [firstName, setFirstName] = useState("Burt");
  const [lastName, setLastName] = useState("Macklin");
  const [mood, setMood] = useState("curious");

  // Generate the code sample based on current state
  const code = `import { store, json, computed } from "jods";

const user = store({
  firstName: "${firstName}",
  lastName: "${lastName}",
  mood: "${mood}"
});

// Add computed property
user.fullName = computed(() => 
  \`\${user.firstName} \${user.lastName}\`
);

// Get JSON snapshot
console.log(json(user));
/* Output: 
${JSON.stringify(
  {
    firstName,
    lastName,
    mood,
    fullName: `${firstName} ${lastName}`,
  },
  null,
  2
)}
*/`;

  return (
    <section className="features-container" id="try-jods-live">
      <div className="container">
        <h2 className="section-title">
          🚀 Try jods <span className="gradient-text">live</span> 🧑‍💻
        </h2>
        <p
          style={{
            textAlign: "center",
            maxWidth: "700px",
            margin: "0 auto 2rem",
          }}
        >
          Edit the values below and see how jods reactively updates and
          generates JSON snapshots
        </p>

        <div className="demo-container">
          <div className="controls">
            <div className="control-group">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="control-group">
              <label>Mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                <option value="curious">Curious</option>
                <option value="sneaky">Sneaky</option>
                <option value="excited">Excited</option>
                <option value="focused">Focused</option>
              </select>
            </div>
          </div>

          <div className="code-preview">
            <CodeBlock language="jsx">{code}</CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
