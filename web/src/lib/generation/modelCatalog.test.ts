import { describe, expect, it } from "vitest";
import { getModelCatalogEntry, MODEL_CATALOG } from "./modelCatalog";

describe("getModelCatalogEntry", () => {
  it("returns the catalog entry for a known model id", () => {
    expect(getModelCatalogEntry("sonnet")).toEqual(MODEL_CATALOG.sonnet);
  });

  it("returns undefined for an unknown model id", () => {
    expect(getModelCatalogEntry("not-a-model")).toBeUndefined();
  });

  it("marks exactly one model as free", () => {
    const freeModels = Object.values(MODEL_CATALOG).filter((m) => m.free);
    expect(freeModels).toHaveLength(1);
    expect(freeModels[0].id).toBe("sonnet");
  });
});
