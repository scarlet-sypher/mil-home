export function formatOrderRef(id: number, year: number = new Date().getFullYear()): string {
  return `STN-HOU-${year}-${String(id).padStart(6, "0")}`;
}
