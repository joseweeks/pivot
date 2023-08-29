import { describe, expect, it } from "@jest/globals";
import { accumulate } from "../src";
import { makeExampleData } from "./util";

describe("Error Handling", () => {
  // We have to be careful here, because the reducer function will only be called when there
  // are at least two items to be reduced.

  it("Returns an error when the reducer returns an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: () => "same",
        reducer: () => new Error("No way!"),
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Returns an error when the reducer throws an error", () => {
    const result = accumulate([1, 2, 3])
      .pivot({
        classifier: () => "same",
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
        classifier: () => "same",
        reducer: () => new Error("No way!"),
      })
    ).toThrow();
  });

  it("Throws an error when the reducer throws an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).pivot({
        classifier: () => "same",
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
        classifier: () => "thisIsTheClassification",
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
        reducer: (acc, cur) => {
          acc[cur.lastName] = `${cur.red}:${cur.green}:${cur.blue}`;

          return acc;
        },
        initialValue: {} as Record<string, string>,
        classificationName: "firstName",
      })
      .toArray();

    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error))
      expect(result).toEqual([
        {
          firstName: "Maria",
          Wang: "16:16:16",
          Li: "16:16:16",
          Zhang: "15:16:16",
          Chen: "16:16:16",
          Liu: "16:16:16",
          Devi: "16:16:15",
          Yang: "16:16:16",
          Huang: "16:15:16",
          Singh: "16:16:16",
        },
        {
          firstName: "Nushi",
          Li: "16:16:16",
          Zhang: "16:16:16",
          Chen: "16:15:16",
          Liu: "16:16:16",
          Devi: "15:16:16",
          Yang: "16:16:16",
          Huang: "16:16:16",
          Singh: "16:16:15",
          Wang: "16:16:16",
        },
        {
          firstName: "Mohammed",
          Zhang: "16:16:16",
          Chen: "16:16:16",
          Liu: "16:16:15",
          Devi: "16:16:16",
          Yang: "16:15:16",
          Huang: "16:16:16",
          Singh: "15:16:16",
          Wang: "16:16:16",
          Li: "16:16:16",
        },
        {
          firstName: "Jose",
          Chen: "16:16:16",
          Liu: "15:16:16",
          Devi: "16:16:16",
          Yang: "16:16:16",
          Huang: "16:16:15",
          Singh: "16:16:16",
          Wang: "16:15:16",
          Li: "16:16:16",
          Zhang: "15:16:16",
        },
        {
          firstName: "Wei",
          Liu: "16:16:16",
          Devi: "16:15:16",
          Yang: "16:16:16",
          Huang: "15:16:16",
          Singh: "16:16:16",
          Wang: "16:16:16",
          Li: "16:16:15",
          Zhang: "16:16:16",
          Chen: "16:15:16",
        },
        {
          firstName: "Ahmed",
          Devi: "16:16:16",
          Yang: "16:16:15",
          Huang: "16:16:16",
          Singh: "16:15:16",
          Wang: "16:16:16",
          Li: "15:16:16",
          Zhang: "16:16:16",
          Chen: "16:16:16",
          Liu: "16:16:15",
        },
        {
          firstName: "Yan",
          Yang: "16:16:16",
          Huang: "16:16:16",
          Singh: "16:16:16",
          Wang: "16:16:15",
          Li: "16:16:16",
          Zhang: "16:15:16",
          Chen: "16:16:16",
          Liu: "15:16:16",
          Devi: "16:16:16",
        },
        {
          firstName: "Ali",
          Huang: "16:16:16",
          Singh: "16:16:16",
          Wang: "15:16:16",
          Li: "16:16:16",
          Zhang: "16:16:16",
          Chen: "16:16:15",
          Liu: "16:16:16",
          Devi: "16:15:16",
          Yang: "16:16:16",
        },
        {
          firstName: "John",
          Singh: "16:16:16",
          Wang: "16:16:16",
          Li: "16:15:16",
          Zhang: "16:16:16",
          Chen: "15:16:16",
          Liu: "16:16:16",
          Devi: "16:16:16",
          Yang: "16:16:15",
          Huang: "16:16:16",
        },
        {
          firstName: "David",
          Wang: "16:16:16",
          Li: "16:16:16",
          Zhang: "16:16:15",
          Chen: "16:16:16",
          Liu: "16:15:16",
          Devi: "16:16:16",
          Yang: "15:16:16",
          Huang: "16:16:16",
          Singh: "16:16:16",
        },
      ]);
  });
});
