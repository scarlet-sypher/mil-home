// Capitalizes the first letter of every word, so multi-word names
// ("john doe", "mary jane watson") display correctly too.
export function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}
