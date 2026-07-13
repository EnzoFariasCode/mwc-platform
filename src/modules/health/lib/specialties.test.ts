import { describe, expect, it } from "vitest";

import {
  getHealthSpecialtyById,
  getHealthSpecialtySearchIds,
} from "./specialties";

describe("taxonomia de Advocacia", () => {
  it("usa advocacia como slug canonico do MWC Online", () => {
    expect(getHealthSpecialtyById("advocacia")?.id).toBe("advocacia");
  });

  it("preserva advogado apenas como alias legado", () => {
    const specialty = getHealthSpecialtyById("advogado");

    expect(specialty?.id).toBe("advocacia");
    expect(specialty && getHealthSpecialtySearchIds(specialty)).toEqual([
      "advocacia",
      "advogado",
    ]);
  });
});
