// On a desktop-wide window the gear list and the catalog share the screen, so adding gear never
// means leaving the list. Phones and narrow windows keep one screen at a time.
export const SPLIT_MIN = 1024;

// The project id in a list or add-gear route, or null for every other screen.
export const splitProjectId = (hash) => hash.match(/^#\/p\/([^/]+)(?:\/add)?$/)?.[1] ?? null;

export const isSplitRoute = (hash, width) => width >= SPLIT_MIN && splitProjectId(hash) !== null;
