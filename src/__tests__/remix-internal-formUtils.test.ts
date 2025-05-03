import { describe, it, expect } from "vitest";
import { parseFormData } from "../remix/internal/formUtils";

describe("parseFormData", () => {
  it("should convert FormData to a plain object", () => {
    // Create a FormData instance
    const form = new FormData();
    form.append("name", "John Doe");
    form.append("email", "john@example.com");
    form.append("age", "30");

    // Parse the form data
    const result = parseFormData(form);

    // Verify conversion
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      age: "30",
    });
  });

  it("should handle multiple values with the same key", () => {
    const form = new FormData();
    form.append("tags", "javascript");
    form.append("tags", "typescript");
    form.append("tags", "react");

    // When the same key is used multiple times, typically the last value wins
    // when converting to a plain object
    const result = parseFormData(form);

    // With parseFormData implementation, the last value should be kept
    expect(result.tags).toBe("react");
  });

  it("should convert non-string values to strings", () => {
    const form = new FormData();

    // Create a File object (which is not a string)
    const fileBlob = new Blob(["file content"], { type: "text/plain" });
    const file = new File([fileBlob], "test.txt", { type: "text/plain" });

    form.append("file", file);

    const result = parseFormData(form);

    // Verify file is converted to string representation
    expect(typeof result.file).toBe("string");
  });

  it("should handle empty FormData", () => {
    const form = new FormData();
    const result = parseFormData(form);

    expect(result).toEqual({});
  });
});
