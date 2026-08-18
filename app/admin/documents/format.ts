/** Human-readable file size, e.g. "12.6 MB". Shared by the page and uploader. */
export function formatBytes(n: number | null | undefined): string {
  if (!n || n <= 0) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
