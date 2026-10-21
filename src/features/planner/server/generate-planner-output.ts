import { generateText, type LanguageModel } from "ai";
import { plannerOutputSchema, type PlannerOutput } from "../lib/planner-schemas";

export const parsePlannerOutput = (text: string): PlannerOutput => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("The model returned no plan. Return the final JSON object.");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start)
    throw new Error("Return a complete JSON object, without prose or markdown.");
  return plannerOutputSchema.parse(JSON.parse(trimmed.slice(start, end + 1)));
};

export const generatePlannerOutput = async ({
  model,
  system,
  validate,
}: {
  model: LanguageModel;
  system: string;
  validate: (output: PlannerOutput) => void;
}): Promise<PlannerOutput> => {
  const signal = AbortSignal.timeout(110000);
  let correction = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await generateText({
      model,
      system,
      prompt: `Return ONLY a JSON object with this exact shape:
{"summary":"Brief overall explanation","orders":[{"orderRef":"order-1","workType":"standard","reason":"Brief factual explanation"}]}
Include every queued order exactly once. Allowed workType values: small_job, extended_project, batch_candidate, standard.
The summary must be 1-500 characters; each reason must be 1-300 characters. Prefer a summary under 200 characters and reasons under 120 characters.
Do not add fields. Be concise and prioritize completing the final JSON over lengthy reasoning.${correction}`,
      maxOutputTokens: attempt === 0 ? 12000 : 20000,
      maxRetries: 0,
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(50000)]),
      telemetry: { isEnabled: false },
    });
    try {
      const output = parsePlannerOutput(result.text);
      validate(output);
      return output;
    } catch (error) {
      if (attempt === 1) throw error;
      correction = `\nThe previous response was invalid. Correct this issue using the original snapshot: ${
        error instanceof Error ? error.message.slice(0, 2000) : "Invalid plan"
      }`;
    }
  }
  throw new Error("The model did not return a valid queue plan.");
};
