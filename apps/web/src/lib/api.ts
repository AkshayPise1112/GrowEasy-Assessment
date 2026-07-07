export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configured || configured === "/") {
    return "";
  }

  return configured.replace(/\/$/, "");
}

export function getImportStreamUrl() {
  return `${getApiBaseUrl()}/api/import/stream`;
}
