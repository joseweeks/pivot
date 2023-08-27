import { describe, expect, it } from "@jest/globals";
import { accumulate } from "../src/accumulate";
import { PivotResult } from "src/accumulate/_/pivot/PivotResult";
import { makeExampleData } from "./util/makeExampleData";

describe("Error Handling", () => {
  // We have to be careful here, because the reducer function will only be called when there
  // are at least two items to be reduced.

  it("Returns an error when the reducer returns an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: (prev) => "same",
        reducer: () => new Error("No way!"),
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Returns an error when the reducer throws an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: (prev) => "same",
        reducer: () => {
          throw new Error("No way!");
        },
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Throws an error when the reducer returns an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).pivot({
        classifier: (prev) => "same",
        reducer: () => new Error("No way!"),
      })
    ).toThrow();
  });

  it("Throws an error when the reducer throws an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).pivot({
        classifier: (prev) => "same",
        reducer: () => {
          throw new Error("No way!");
        },
      })
    ).toThrow();
  });

  it("Returns an error when the classifier returns an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: () => new Error("No way!"),
        reducer: (a, b) => a + b,
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Returns an error when the classifier throws an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: () => {
          throw new Error("No way!");
        },
        reducer: () => {
          throw new Error("No way!");
        },
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Throws an error when the classifier returns an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).pivot({
        classifier: () => new Error("No way!"),
        reducer: () => new Error("No way!"),
      })
    ).toThrow();
  });

  it("Throws an error when the classifier throws an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).pivot({
        classifier: () => {
          throw new Error("No way!");
        },
        reducer: () => {
          throw new Error("No way!");
        },
      })
    ).toThrow();
  });
});

describe("Pivots a small number of values", () => {
  it("Pivots three rows into one", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        reducer: (a, b) => a + b,
        valueName: "val",
        classifier: (a) => "thisIsTheClassification",
        classificationName: "thisIsTheKey",
      })
      .result();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect([...result][0]).toEqual({
      thisIsTheKey: "thisIsTheClassification",
      val: 6,
    });
  });

  it("Pivots three rows into three", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        reducer: (a, b) => a + b,
        valueName: "val",
        classifier: (a) => a.toString(),
        classificationName: "thisIsTheKey",
      })
      .result();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect([...result]).toEqual([
      {
        thisIsTheKey: "1",
        val: 1,
      },
      {
        thisIsTheKey: "2",
        val: 2,
      },
      {
        thisIsTheKey: "3",
        val: 3,
      },
    ]);
  });

  it("Pivots seven rows into three", () => {
    const result = accumulate([1, 2, 3, 4, 5, 6, 7])
      .pivot({
        reducer: (a, b) => a + b,
        valueName: "val",
        classifier: (a) => (a % 3).toString(),
        classificationName: "thisIsTheKey",
      })
      .result();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(
      [...result].sort((a, b) => a.thisIsTheKey.localeCompare(b.thisIsTheKey))
    ).toEqual([
      {
        thisIsTheKey: "0",
        val: 9,
      },
      {
        thisIsTheKey: "1",
        val: 12,
      },
      {
        thisIsTheKey: "2",
        val: 7,
      },
    ]);
  });
});

describe("Complex operations", () => {
  it("Chains pivots", () => {
    const data = makeExampleData(10000);

    const classifier = (d: { firstName: string; lastName: string }) => ({
      key: `${d.firstName}:${d.lastName}`,
      classification: { firstName: d.firstName, lastName: d.lastName },
    });

    const initialValue = {
      count: 0,
      red: 0,
      green: 0,
      blue: 0,
      minIndex: NaN,
      maxIndex: NaN,
    };

    const result = accumulate(data)
      .pivot({
        classifier,
        initialValue,
        reducer: (acc, cur) => {
          ++acc.count;
          if (cur.color === "red") acc.red++;
          if (cur.color === "green") acc.green++;
          if (cur.color === "blue") acc.blue++;
          if (isNaN(acc.minIndex)) acc.minIndex = cur.index;
          else acc.minIndex = Math.min(acc.minIndex, cur.index);
          if (isNaN(acc.maxIndex)) acc.maxIndex = cur.index;
          else acc.maxIndex = Math.max(acc.maxIndex, cur.index);

          return acc;
        },
      })
      .pivot({
        classifier: (cur) => cur.firstName,
        reducer: (acc, cur) => ({
          red:
            cur.maxIndex % 3 === 0 &&
            cur.red === 16 &&
            !acc.red.includes(cur.lastName)
              ? [...acc.red, cur.lastName].sort()
              : acc.red,
          green:
            cur.maxIndex % 3 === 0 &&
            cur.green === 16 &&
            !acc.green.includes(cur.lastName)
              ? [...acc.green, cur.lastName].sort()
              : acc.green,
        }),
        initialValue: {
          red: [] as string[],
          green: [] as string[],
        },
        classificationName: "firstName",
      })
      .result();
    if (!(result instanceof Error))
      console.table(
        [...result].map((r) => ({
          firstName: r.firstName,
          red: r.red.join(" "),
          green: r.green.join(" "),
        }))
      );
  });
});
