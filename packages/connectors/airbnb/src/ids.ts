// 에어비앤비 Relay global ID: base64("타입:숫자")
export type GlobalIdType = "StayListing" | "StaySupplyListing" | "User";

export function toGlobalId(type: GlobalIdType, id: string): string {
  return Buffer.from(`${type}:${id}`).toString("base64");
}

export function fromGlobalId(globalId: string): { type: string; id: string } | null {
  const decoded = Buffer.from(globalId, "base64").toString("utf8");
  const i = decoded.indexOf(":");
  if (i <= 0 || !/^\d+$/.test(decoded.slice(i + 1))) return null;
  return { type: decoded.slice(0, i), id: decoded.slice(i + 1) };
}
