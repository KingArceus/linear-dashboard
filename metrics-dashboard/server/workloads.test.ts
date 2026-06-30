import { describe, expect, it } from "vitest";
import { parseWorkloadsContent, totalWorkloadLimit } from "./workloads.js";

describe("parseWorkloadsContent", () => {
  it("parses Linear user mention lines", () => {
    const content = '<user id="abc-123">khang.pham</user> - 3\n<user id="def-456">jane.doe</user> - 5';

    expect(parseWorkloadsContent(content)).toEqual([
      { userId: "abc-123", name: "khang.pham", limit: 3 },
      { userId: "def-456", name: "jane.doe", limit: 5 },
    ]);
  });

  it("parses plain name lines", () => {
    expect(parseWorkloadsContent("alice - 2\nbob - 4")).toEqual([
      { name: "alice", limit: 2 },
      { name: "bob", limit: 4 },
    ]);
  });

  it("ignores blank and invalid lines", () => {
    expect(parseWorkloadsContent("\nnot a workload\n<user id=\"1\">x</user> - 2\n")).toEqual([
      { userId: "1", name: "x", limit: 2 },
    ]);
  });
});

describe("totalWorkloadLimit", () => {
  it("sums workload limits", () => {
    expect(
      totalWorkloadLimit([
        { name: "alice", limit: 2 },
        { name: "bob", limit: 4 },
      ])
    ).toBe(6);
  });
});
