/** Turns an API error body into one plain sentence for the form. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail: unknown }).detail;
    if (detail && typeof detail === "object" && "message" in detail) {
      return String((detail as { message: unknown }).message);
    }
    if (Array.isArray(detail)) return "Please check the highlighted fields.";
  }
  return fallback;
}

export function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "detail" in error) {
    const detail = (error as { detail: unknown }).detail;
    if (detail && typeof detail === "object" && "code" in detail) return String((detail as { code: unknown }).code);
  }
  return undefined;
}
