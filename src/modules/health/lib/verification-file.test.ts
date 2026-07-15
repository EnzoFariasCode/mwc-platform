import { describe, expect, it } from "vitest";
import { validateVerificationFile } from "./verification-file";

describe("arquivos da verificacao profissional", () => {
  it("aceita PDF com assinatura valida", () => {
    expect(
      validateVerificationFile({
        mimeType: "application/pdf",
        bytes: Buffer.from("%PDF-1.7 documento"),
      }),
    ).toBeNull();
  });

  it("rejeita executavel renomeado como PDF", () => {
    expect(
      validateVerificationFile({
        mimeType: "application/pdf",
        bytes: Buffer.from("MZ executavel"),
      }),
    ).toContain("nao corresponde");
  });

  it("rejeita formato fora da lista permitida", () => {
    expect(
      validateVerificationFile({
        mimeType: "image/svg+xml",
        bytes: Buffer.from("<svg></svg>"),
      }),
    ).toContain("Formato nao permitido");
  });
});
