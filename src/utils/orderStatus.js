/**
 * Order status can be compound: "pending_payment | assigned"
 * Use these helpers to parse, add, and remove status parts.
 */
const STATUS_SEP = ' | ';

export function parseStatus(status) {
  if (!status || typeof status !== 'string') return [];
  return status.split(STATUS_SEP).map((s) => s.trim()).filter(Boolean);
}

export function hasStatusPart(status, part) {
  return parseStatus(status).includes(part);
}

export function addStatusPart(status, part) {
  const parts = parseStatus(status);
  if (parts.includes(part)) return status;
  parts.push(part);
  return parts.join(STATUS_SEP);
}

export function removeStatusPart(status, part) {
  const parts = parseStatus(status).filter((p) => p !== part);
  if (parts.length === 0) return null;
  return parts.join(STATUS_SEP);
}
