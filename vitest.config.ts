import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],

        // A hang detector, not a performance budget: the tests start real shells.
        testTimeout: 30_000,
        coverage: {
            provider: "v8",
            reporter: ["text"],
            include: ["lib.ts", "page.ts"]
        }
    }
});
