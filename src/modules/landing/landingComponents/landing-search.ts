const onlineAdvocacyTerms = new Set([
  "advocacia",
  "advogado",
  "advogada",
  "advogado(a)",
]);

function normalizeSearchTerm(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolveLandingSearchUrl(query: string, location = "") {
  if (onlineAdvocacyTerms.has(normalizeSearchTerm(query))) {
    return "/agendar-consulta/advocacia";
  }

  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (location.trim()) params.set("local", location.trim());

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}
