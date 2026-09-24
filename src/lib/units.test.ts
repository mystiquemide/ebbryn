import { describe, expect, it } from "vitest";
import { fromBaseUnits, toBaseUnits } from "./units";

describe("toBaseUnits", () => {
  it("converts whole USDC to 6-decimal base units", () => {
    expect(toBaseUnits(75600)).toBe("75600000000");
    expect(toBaseUnits("1")).toBe("1000000");
  });

  it("keeps cents exact without float drift", () => {
    expect(toBaseUnits(0.1 + 0.2)).toBe("300000");
    expect(toBaseUnits("42000.37")).toBe("42000370000");
  });

  it("rejects bad input", () => {
    expect(() => toBaseUnits("-5")).toThrow();
    expect(() => toBaseUnits("1e6")).toThrow();
    expect(() => toBaseUnits("1.0000001")).toThrow();
  });
});

describe("fromBaseUnits", () => {
  it("round-trips", () => {
    expect(fromBaseUnits("75600000000")).toBe(75600);
    expect(fromBaseUnits(toBaseUnits("12.5"))).toBe(12.5);
  });
});
