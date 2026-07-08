import { NotFoundError, runs } from "@trigger.dev/sdk";
import type { GeneratePostOutput } from "../../../trigger/generatePost";

// Also thrown for a run id that doesn't exist at all — from the caller's
// perspective a run they don't own and a run that was never created should
// look identical, so this doubles as the "not found" case.
export class RunAccessError extends Error {}

export interface RunStatus {
  id: string;
  status: string;
  output: GeneratePostOutput | undefined;
  error: { message: string } | undefined;
}

// Ownership isn't tracked by Trigger.dev natively, so every run triggered by
// runGenerate is tagged `user:<userId>` — this checks that tag rather than
// trusting the caller-supplied userId against some other run.
export async function getRunStatus(
  userId: string,
  runId: string,
): Promise<RunStatus> {
  let run;
  try {
    run = await runs.retrieve(runId);
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new RunAccessError("run does not exist");
    }
    throw err;
  }

  if (!run.tags?.includes(`user:${userId}`)) {
    throw new RunAccessError("run does not belong to this user");
  }

  return {
    id: run.id,
    status: run.status,
    output: run.output as GeneratePostOutput | undefined,
    error: run.error ? { message: run.error.message } : undefined,
  };
}
