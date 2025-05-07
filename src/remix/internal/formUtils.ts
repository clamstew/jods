export function parseFormData(form: FormData): Record<string, any> {
  const entries: Record<string, any> = {};
  for (const [key, value] of (form as any).entries()) {
    entries[key] = typeof value === "string" ? value : String(value);
  }
  return entries;
}
