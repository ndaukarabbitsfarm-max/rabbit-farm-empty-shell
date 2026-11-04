export const TRBA = {
  name: "Tanzania Rabbit Breeders Association (TRBA)",
  shortName: "TRBA",
  slogan: "Connecting breeders, improving breeds, creating opportunities",
  phone: "0614015748",
  email: "asiphiwendauka30@gmail.com",
} as const;

export const MAX_LEADERSHIP_YEARS = 5;

export function isValidNida(value: string) {
  return /^\d{20}$/.test(value.replace(/\D/g, ""));
}

export function isValidTanzaniaPhone(value: string) {
  return /^(0|\+?255)[67]\d{8}$/.test(value.replace(/[\s-]/g, ""));
}

export function isLeadershipTermAllowed(startsOn: string, endsOn: string) {
  const start = new Date(`${startsOn}T00:00:00Z`);
  const end = new Date(`${endsOn}T00:00:00Z`);
  const limit = new Date(start);
  limit.setUTCFullYear(limit.getUTCFullYear() + MAX_LEADERSHIP_YEARS);
  return end > start && end <= limit;
}

export function memberCode(n: number | string) {
  return `TRBA-${String(n).padStart(6, "0")}`;
}