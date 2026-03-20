import { describe, it, expect } from "vitest";

describe("Failing Test", () => {
  it("should fail due to a typo", () => {
    const message = "Hello World";
    // Typo in expectation: 'Hello Word' instead of 'Hello World'
    expect(message).toBe("Hello Word");
  });

  it("should fail due to formatting (if we had a strict lint check)", () => {
    const x = 1; // Missing spaces around '='
    expect(x).toBe(1);
  });
});
