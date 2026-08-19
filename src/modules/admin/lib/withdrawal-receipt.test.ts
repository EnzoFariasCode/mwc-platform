import { describe, expect, it } from "vitest";
import { validateWithdrawalReceipt } from "./withdrawal-receipt";

describe("withdrawal receipt validation", () => {
  it("accepts a PDF by MIME type and file signature", async () => {
    const result = await validateWithdrawalReceipt(
      new File([Buffer.from("%PDF-1.7 receipt")], "comprovante.pdf", {
        type: "application/pdf",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.receipt.fileName).toBe("comprovante.pdf");
      expect(result.receipt.contentType).toBe("application/pdf");
    }
  });

  it("rejects a file whose content does not match its declared type", async () => {
    const result = await validateWithdrawalReceipt(
      new File([Buffer.from("not a PDF")], "comprovante.pdf", {
        type: "application/pdf",
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "O conteudo do comprovante nao corresponde ao tipo do arquivo.",
    });
  });

  it("sanitizes the attachment filename", async () => {
    const result = await validateWithdrawalReceipt(
      new File([Buffer.from("%PDF-1.7 receipt")], "../comprovante?.exe", {
        type: "application/pdf",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.receipt.fileName).toBe("..-comprovante-.pdf");
    }
  });
});
