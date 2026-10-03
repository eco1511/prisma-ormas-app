export const clean = (value: unknown) => String(value ?? "").trim().replace(/\s+/g, " ");

export function generateMemberNo(sequence: number) {
  const year = new Date().getFullYear();
  return `PRS-${year}-${String(sequence).padStart(6, "0")}`;
}

export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
