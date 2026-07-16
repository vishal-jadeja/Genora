import { describe, expect, it } from "vitest";
import { getModelCatalogEntry, MODEL_CATALOG } from "./modelCatalog";

describe("getModelCatalogEntry", () => {
  it("returns the catalog entry for a known model id", () => {
    expect(getModelCatalogEntry("sonnet")).toEqual(MODEL_CATALOG.sonnet);
  });

  it("returns undefined for an unknown model id", () => {
    expect(getModelCatalogEntry("not-a-model")).toBeUndefined();
  });

  it("marks exactly groq as the free-tier model (gemini is BYOK-only)", () => {
    const freeModels = Object.values(MODEL_CATALOG).filter((m) => m.free);
    expect(freeModels.map((m) => m.id).sort()).toEqual(["groq"]);
  });
});
