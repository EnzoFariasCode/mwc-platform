const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;

const MIME_SIGNATURES: Record<string, (bytes: Buffer) => boolean> = {
  "application/pdf": (bytes) => bytes.subarray(0, 5).toString() === "%PDF-",
  "image/jpeg": (bytes) =>
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff,
  "image/png": (bytes) =>
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
  "image/webp": (bytes) =>
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP",
};

export function validateVerificationFile({
  mimeType,
  bytes,
}: {
  mimeType: string;
  bytes: Buffer;
}) {
  if (!MIME_SIGNATURES[mimeType]) {
    return "Formato nao permitido. Envie PDF, JPG, PNG ou WEBP.";
  }

  if (bytes.length === 0 || bytes.length > MAX_VERIFICATION_FILE_SIZE) {
    return "O arquivo deve ter no maximo 5 MB.";
  }

  if (!MIME_SIGNATURES[mimeType](bytes)) {
    return "O conteudo do arquivo nao corresponde ao formato informado.";
  }

  return null;
}

export function safeVerificationFileName(name: string) {
  const sanitized = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  return sanitized || "documento";
}
