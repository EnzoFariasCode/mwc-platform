import { describe, expect, it } from "vitest";

import {
  PROJECT_RESOURCE_DIRECTORY_URL_MAX_LENGTH,
  validateProjectResourceDirectoryUrl,
} from "../project-resource-directory";

describe("project resource directory", () => {
  it("accepts and normalizes a secure directory URL", () => {
    expect(
      validateProjectResourceDirectoryUrl(
        "  https://drive.google.com/drive/folders/example  ",
      ),
    ).toEqual({
      success: true,
      value: "https://drive.google.com/drive/folders/example",
    });
  });

  it("rejects empty, insecure and credential-bearing URLs", () => {
    expect(validateProjectResourceDirectoryUrl("").success).toBe(false);
    expect(
      validateProjectResourceDirectoryUrl("http://example.com/files").success,
    ).toBe(false);
    expect(
      validateProjectResourceDirectoryUrl("https://user:pass@example.com/files")
        .success,
    ).toBe(false);
  });

  it("rejects URLs beyond the persistence limit", () => {
    expect(
      validateProjectResourceDirectoryUrl(
        `https://example.com/${"a".repeat(PROJECT_RESOURCE_DIRECTORY_URL_MAX_LENGTH)}`,
      ).success,
    ).toBe(false);
  });
});
