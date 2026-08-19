const MAX_WITHDRAWAL_RECEIPT_BYTES = 5 * 1024 * 1024;

const RECEIPT_FILE_CONFIG = {
  "application/pdf": {
    extension: ".pdf",
    matches: (bytes: Buffer) => bytes.subarray(0, 5).toString() === "%PDF-",
  },
  "image/jpeg": {
    extension: ".jpg",
    matches: (bytes: Buffer) =>
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    matches: (bytes: Buffer) =>
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  "image/webp": {
    extension: ".webp",
    matches: (bytes: Buffer) =>
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP",
  },
} as const;

type ReceiptValidationResult =
  | {
      success: true;
      receipt: {
        bytes: Buffer;
        contentType: keyof typeof RECEIPT_FILE_CONFIG;
        fileName: string;
      };
    }
  | { success: false; error: string };

function safeReceiptFileName(
  originalName: string,
  contentType: keyof typeof RECEIPT_FILE_CONFIG,
) {
  const extension = RECEIPT_FILE_CONFIG[contentType].extension;
  const sanitized = originalName
    .normalize("NFKC")
    .replace(/[\\/\u0000-\u001f\u007f]/g, "-")
    .replace(/[^\p{L}\p{N}._ -]/gu, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  if (!sanitized) return `comprovante-pix${extension}`;
  if (sanitized.toLowerCase().endsWith(extension)) return sanitized;
  return `${sanitized.replace(/\.[^.]+$/, "")}${extension}`;
}

export async function validateWithdrawalReceipt(
  input: FormDataEntryValue | null,
): Promise<ReceiptValidationResult> {
  if (!(input instanceof File) || input.size === 0) {
    return {
      success: false,
      error: "Anexe o comprovante da transferencia.",
    };
  }

  if (input.size > MAX_WITHDRAWAL_RECEIPT_BYTES) {
    return {
      success: false,
      error: "O comprovante deve ter no maximo 5 MB.",
    };
  }

  const config = RECEIPT_FILE_CONFIG[
    input.type as keyof typeof RECEIPT_FILE_CONFIG
  ];
  if (!config) {
    return { success: false, error: "Envie um PDF, JPG, PNG ou WEBP." };
  }

  const bytes = Buffer.from(await input.arrayBuffer());
  if (!config.matches(bytes)) {
    return {
      success: false,
      error: "O conteudo do comprovante nao corresponde ao tipo do arquivo.",
    };
  }

  return {
    success: true,
    receipt: {
      bytes,
      contentType: input.type as keyof typeof RECEIPT_FILE_CONFIG,
      fileName: safeReceiptFileName(input.name, input.type as keyof typeof RECEIPT_FILE_CONFIG),
    },
  };
}
