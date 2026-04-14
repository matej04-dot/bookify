const ENTITY_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function normalizeRouteParam(value: string): string {
  return decodeURIComponent(value || "").trim();
}

export function normalizeBookId(value: string): string {
  return normalizeRouteParam(value)
    .replace(/^\/?works\//i, "")
    .trim();
}

export function isValidEntityId(value: string): boolean {
  return ENTITY_ID_PATTERN.test(value);
}

export function isValidBookId(value: string): boolean {
  return isValidEntityId(value);
}

export function isValidReviewId(value: string): boolean {
  return isValidEntityId(value);
}
