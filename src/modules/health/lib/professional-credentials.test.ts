import { describe, expect, it } from "vitest";
import {
  buildProfessionalCredential,
  formatProfessionalCredential,
  parseProfessionalCredential,
} from "./professional-credentials";

describe("professional credentials", () => {
  it("formats saved credentials with a single separator", () => {
    expect(formatProfessionalCredential("CRP - 12345")).toBe("CRP - 12345");
    expect(formatProfessionalCredential("CRP-12345")).toBe("CRP - 12345");
  });

  it("keeps only the credential number when parsing existing data", () => {
    expect(parseProfessionalCredential("CRN - 98765").number).toBe("98765");
  });

  it("removes a leading separator before saving from the edit form", () => {
    expect(buildProfessionalCredential("CRN", "- 98765")).toBe("CRN - 98765");
  });
});
