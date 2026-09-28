export function isScanHistorySchemaUnavailable(code?: string): boolean {
  return code === "42703" || code === "42P01" || code === "PGRST204";
}

export function isTransientSupabaseError(error: { code?: string; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return ["522", "502", "503", "504", "timed out", "timeout", "fetch failed"].some(
    (marker) => message.includes(marker)
  );
}