import {describe, it, expect} from "vitest";

describe("Smoke Test", () => {
    it("matches the expected message", () => {
        const message = "Hello World";
        expect(message).toBe("Hello World");
    });

    it("keeps the basic arithmetic smoke check passing", () => {
        const x = 1;
        expect(x).toBe(1);
    });
});
