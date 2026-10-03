// Which take this run films (a film may have several takes of its song). ?take=<name> in the browser; render.ts passes
// --take through. Every take's data and master audio live in takes/<take>/ at the repository root.
export const TAKE = new URLSearchParams(location.search).get('take') ?? 'demo';
export const takeUrl = (file: string) => `takes/${TAKE}/${file}`;
