import { describe, expect, it } from "vitest";

import { resetPasswordEmail } from "./auth-emails";

describe("resetPasswordEmail", () => {
  it("usa a marca institucional da plataforma", () => {
    const email = resetPasswordEmail("123456");

    expect(email.subject).toBe(
      "Maximus World Click - Codigo de recuperacao de senha",
    );
    expect(email.html).toContain("Maximus World Click");
    expect(email.html).not.toContain("MWC Online");
    expect(email.text).toContain("123456");
  });
});
