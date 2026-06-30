import { describe, expect, it } from "vitest";
import { formatDateInput, getLastWeekWorkingDays } from "../shared/dateRange.js";

describe("getLastWeekWorkingDays", () => {
  it("returns previous Monday through Friday when reference is Tuesday", () => {
    const reference = new Date(2026, 5, 30);
    const { from, to } = getLastWeekWorkingDays(reference);

    expect(formatDateInput(from)).toBe("2026-06-22");
    expect(formatDateInput(to)).toBe("2026-06-26");
  });

  it("returns previous Monday through Friday when reference is Monday", () => {
    const reference = new Date(2026, 5, 29);
    const { from, to } = getLastWeekWorkingDays(reference);

    expect(formatDateInput(from)).toBe("2026-06-22");
    expect(formatDateInput(to)).toBe("2026-06-26");
  });
});
