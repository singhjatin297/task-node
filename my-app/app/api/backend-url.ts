const DEFAULT_BACKEND_URL = "http://localhost:8080";

export const getBackendUrl = (path: string) => {
  const baseUrl = process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return new URL(path, normalizedBaseUrl).toString();
};
