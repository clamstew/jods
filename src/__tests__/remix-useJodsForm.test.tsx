/** @jsxImportSource react */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { useJodsForm } from "../remix/useJodsForm";
import { defineStore } from "../remix/defineStore";
import { z } from "zod";
import * as React from "react";

// Mock the Remix useFetcher hook
vi.mock("@remix-run/react", () => ({
  useFetcher: vi.fn(() => ({
    Form: (props: any) => (
      <form data-testid="fetcher-form" {...props}>
        {props.children}
      </form>
    ),
    state: "idle",
    submit: vi.fn(),
    data: null,
  })),
}));

// Create a test store for our forms
const createTestStore = () => {
  return defineStore({
    name: "testStore",
    schema: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    defaults: {
      name: "Test User",
      email: "test@example.com",
    },
    handlers: {
      updateName: vi.fn(),
      updateEmail: vi.fn(),
    },
  });
};

describe("useJodsForm", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should render a form with the hidden jods handler input", () => {
    const testStore = createTestStore();

    function TestComponent() {
      const { Form } = useJodsForm(testStore, "updateName");

      return (
        <Form>
          <input data-testid="name-input" type="text" name="name" />
          <button data-testid="submit-button" type="submit">
            Submit
          </button>
        </Form>
      );
    }

    render(<TestComponent />);

    // The form should be rendered
    const form = screen.getByTestId("fetcher-form");
    expect(form).toBeInTheDocument();

    // The hidden input for the jods handler should be included
    const hiddenInput = document.querySelector('input[name="_jods_handler"]');
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput?.getAttribute("value")).toBe("updateName");

    // Our custom form elements should be included too
    expect(screen.getByTestId("name-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("should expose the fetcher from useFetcher", () => {
    const testStore = createTestStore();

    function TestComponent() {
      const { Form, fetcher } = useJodsForm(testStore, "updateEmail");

      // Store the fetcher in a test element for inspection
      return (
        <div>
          <div data-testid="fetcher-state">{fetcher.state}</div>
          <Form>
            <input type="email" name="email" />
          </Form>
        </div>
      );
    }

    render(<TestComponent />);

    // Should have access to the fetcher state
    expect(screen.getByTestId("fetcher-state").textContent).toBe("idle");
  });

  it("should work with different handlers for the same store", () => {
    const testStore = createTestStore();

    function TestComponent() {
      const nameForm = useJodsForm(testStore, "updateName");
      const emailForm = useJodsForm(testStore, "updateEmail");

      return (
        <div>
          <nameForm.Form data-testid="name-form">
            <input data-testid="name-input" type="text" name="name" />
          </nameForm.Form>

          <emailForm.Form data-testid="email-form">
            <input data-testid="email-input" type="email" name="email" />
          </emailForm.Form>
        </div>
      );
    }

    render(<TestComponent />);

    // Both forms should be rendered
    const nameForm = screen.getByTestId("name-form");
    const emailForm = screen.getByTestId("email-form");

    expect(nameForm).toBeInTheDocument();
    expect(emailForm).toBeInTheDocument();

    // Each form should have the correct handler
    const nameHandler = nameForm.querySelector('input[name="_jods_handler"]');
    const emailHandler = emailForm.querySelector('input[name="_jods_handler"]');

    expect(nameHandler?.getAttribute("value")).toBe("updateName");
    expect(emailHandler?.getAttribute("value")).toBe("updateEmail");
  });
});
