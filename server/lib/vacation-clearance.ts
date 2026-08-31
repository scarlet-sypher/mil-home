export function determineClearanceStatus(defects: string): "CLEARED" | "DEFECTS" {
  return defects.trim() ? "DEFECTS" : "CLEARED";
}
