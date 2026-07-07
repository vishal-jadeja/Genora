import { defineConfig } from "@trigger.dev/sdk";

// TRIGGER_PROJECT_REF comes from `npx trigger.dev@latest init` against a real
// Trigger.dev project — not created yet, see backend-plan.md Phase 4.
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "",
  dirs: ["./trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
});
