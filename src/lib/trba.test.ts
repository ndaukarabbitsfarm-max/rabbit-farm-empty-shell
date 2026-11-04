import { describe, expect, it } from "vitest";
import { isLeadershipTermAllowed, isValidNida, isValidTanzaniaPhone } from "./trba";

describe("TRBA rules", () => {
  it("allows a leadership term of exactly five years", () => {
    expect(isLeadershipTermAllowed("2026-01-01", "2031-01-01")).toBe(true);
  });
  it("rejects a leadership term longer than five years", () => {
    expect(isLeadershipTermAllowed("2026-01-01", "2031-01-02")).toBe(false);
  });
  it("accepts the association phone format", () => {
    expect(isValidTanzaniaPhone("0614015748")).toBe(true);
  });
  it("requires a 20-digit NIDA number", () => {
    expect(isValidNida("1234567890123456789")).toBe(false);
  });
});