// Safely parses a fetch Response body as JSON, returning a fallback value instead of
// throwing if the body is empty or not valid JSON -- a crashed dev server, a proxy, or
// any bug that slips past the API's own error handling could return a body like that,
// and calling response.json() directly on it throws "Unexpected end of JSON input"
// rather than letting the caller just show a normal error message.
export async function safeParseJson<T>(response: Response, fallback: T): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function readErrorMessage(response: Response, fallback = "Something went wrong."): Promise<string> {
  const data = await safeParseJson<{ error?: string }>(response, {});
  return typeof data.error === "string" ? data.error : fallback;
}
