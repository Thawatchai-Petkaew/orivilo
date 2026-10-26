/** Vite's `?raw` import: a file's source as a string, used by the "no model" source check. */
declare module "*?raw" {
  const source: string;
  export default source;
}
