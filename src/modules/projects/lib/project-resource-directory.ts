export const PROJECT_RESOURCE_DIRECTORY_URL_MAX_LENGTH = 2_000;

export type ProjectResourceDirectoryValidation =
  | { success: true; value: string }
  | { success: false; error: string };

export function validateProjectResourceDirectoryUrl(
  value: unknown,
): ProjectResourceDirectoryValidation {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return {
      success: false,
      error: "Informe o link da pasta com os arquivos e dependencias do projeto.",
    };
  }

  if (normalized.length > PROJECT_RESOURCE_DIRECTORY_URL_MAX_LENGTH) {
    return {
      success: false,
      error: `O link deve ter no maximo ${PROJECT_RESOURCE_DIRECTORY_URL_MAX_LENGTH} caracteres.`,
    };
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "https:") {
      return {
        success: false,
        error: "Utilize um link seguro iniciado por https://.",
      };
    }

    if (!url.hostname || url.username || url.password) {
      return { success: false, error: "Informe um link de pasta valido." };
    }

    return { success: true, value: url.toString() };
  } catch {
    return { success: false, error: "Informe um link de pasta valido." };
  }
}
