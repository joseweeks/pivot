import { describe, expect, it } from "@jest/globals";
import { accumulate } from "../src";
import { makeExampleData } from "./util";

describe("Error Handling", () => {
  it("Correctly detects iterator and non-iterator types based on error handling.", () => {
    const errorAccumulator = accumulate([] as number[]);
    const result = errorAccumulator.result();

    // @ts-expect-error Verify that if result could be an error, it will not be iterable
    [...errorAccumulator];
    // @ts-expect-error Verify that if result could be an error, it will not be iterable
    [...result];

    if (!(result instanceof Error)) [...result];

    const exceptionAccumulator = accumulate([] as number[], {
      errorHandling: "exception",
    });
    const exceptionResult = exceptionAccumulator.result();

    [...exceptionAccumulator];
    [...exceptionResult];
  });

  it("Returns an error when reducing an empty array with no initialValue", () => {
    const result = accumulate([] as number[])
      .reduce((prev, cur) => prev + cur)
      .result();

    expect(result).toBeInstanceOf(Error);
  });

  it("Throws an error when reducing an empty array with no initialValue", () => {
    expect(() => [
      ...accumulate([] as number[], {
        errorHandling: "exception",
      }).reduce((prev, cur) => prev + cur),
    ]).toThrow();
  });

  it("Returns an error when the reducer returns an error", () => {
    const result = accumulate([1, 2, 3])
      .reduce(() => new Error("No way!"))
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Returns an error when the reducer throws an error", () => {
    const result = accumulate([1, 2, 3])
      .reduce(() => {
        throw new Error("No way!");
      })
      .result();
    expect(result).toBeInstanceOf(Error);
  });

  it("Throws an error when the reducer returns an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).reduce(() => new Error("No way!"))
    ).toThrow();
  });

  it("Throws an error when the reducer throws an error", () => {
    expect(() =>
      accumulate([1, 2, 3], {
        errorHandling: "exception",
      }).reduce(() => {
        throw new Error("No way!");
      })
    ).toThrow();
  });
});

describe("Accumulates 0 to 2 simple records", () => {
  it("Returns original list when accumulate() is called without any results-generating function.", () => {
    const accumulator = accumulate([] as number[]);
    const result = accumulator.result();
    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) expect([...result]).toEqual([]);

    const accumulator2 = accumulate([1, 2, 3]);
    const result2 = accumulator2.result();
    expect(result2).not.toBeInstanceOf(Error);
    if (!(result2 instanceof Error)) expect([...result2]).toEqual([1, 2, 3]);
  });

  it("Returns initialValue when reducing an empty array with initialValue", () => {
    const [numResult] = [
      ...accumulate([] as number[], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur,
        77
      ),
    ];
    expect(numResult).toBe(77);
    expect(numResult).toEqual([].reduce((prev, cur) => prev + cur, 77));

    const [stringResult] = [
      ...accumulate([] as string[], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur,
        "abc"
      ),
    ];
    expect(stringResult).toBe("abc");
    expect(stringResult).toEqual([].reduce((prev, cur) => prev + cur, "abc"));

    const [objResult] = [
      ...accumulate([] as { foo: string }[], {
        errorHandling: "exception",
      }).reduce((prev, cur) => ({ foo: prev.foo + cur.foo }), { foo: "bar" }),
    ];
    expect(objResult.foo).toBe("bar");
    expect(objResult).toEqual(
      ([] as { foo: string }[]).reduce(
        (prev, cur) => ({ foo: prev.foo + cur.foo }),
        { foo: "bar" }
      )
    );
  });

  it("Returns first value when reducing an single item array with no initialValue", () => {
    const [numResult] = [
      ...accumulate([77], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur
      ),
    ];
    expect(numResult).toBe(77);
    expect(numResult).toEqual([77].reduce((prev, cur) => prev + cur));

    const [stringResult] = [
      ...accumulate(["abc"], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur
      ),
    ];
    expect(stringResult).toBe("abc");
    expect(stringResult).toEqual(["abc"].reduce((prev, cur) => prev + cur));

    const [objResult] = [
      ...accumulate([{ foo: "bar" }], {
        errorHandling: "exception",
      }).reduce((prev, cur) => ({ foo: prev.foo + cur.foo })),
    ];
    expect(objResult.foo).toBe("bar");
    expect(objResult).toEqual(
      [{ foo: "bar" }].reduce((prev, cur) => ({
        foo: prev.foo + cur.foo,
      }))
    );
  });

  it("Adds two numbers with initialValue", () => {
    expect([
      ...accumulate([-100], { errorHandling: "exception" }).reduce(
        (sum, cur) => sum + cur,
        120
      ),
    ]).toEqual([20]);
  });

  it("Adds two numbers with no initialValue", () => {
    expect([
      ...accumulate([5, 7], { errorHandling: "exception" }).reduce(
        (sum, cur) => sum + cur
      ),
    ]).toEqual([12]);
  });

  it("Combines two objects", () => {
    expect([
      ...accumulate(
        [
          { a: 100, b: 200, c: "abc" },
          { a: 5, b: 17, c: "zzz" },
        ],
        { errorHandling: "exception" }
      ).reduce((acc, cur) => ({
        a: acc.a + cur.a,
        b: acc.b + cur.b,
        c: acc.c + cur.c,
      })),
    ]).toEqual([{ a: 105, b: 217, c: "abczzz" }]);
  });

  it("Treats currentIndex the same as Array.reduce (1 item, no initialValue)", () => {
    const [result] = [
      ...accumulate([0], { errorHandling: "exception" }).reduce(
        (acc, cur, currentIndex) => currentIndex
      ),
    ];
    expect(result).toEqual(
      [0].reduce((acc, cur, currentIndex) => currentIndex)
    );
  });

  it("Treats currentIndex the same as Array.reduce (2 items, no initialValue)", () => {
    const [result] = [
      ...accumulate([5, 10], { errorHandling: "exception" }).reduce(
        (acc, cur, currentIndex) => currentIndex
      ),
    ];
    expect(result).toEqual(
      [1, 2].reduce((acc, cur, currentIndex) => currentIndex)
    );
  });

  it("Treats currentIndex the same as Array.reduce (0 items, initialValue)", () => {
    const [result] = [
      ...accumulate([], { errorHandling: "exception" }).reduce(
        (acc, cur, currentIndex) => currentIndex,
        99
      ),
    ];
    expect(result).toEqual(
      [].reduce((acc, cur, currentIndex) => currentIndex, 99)
    );
  });

  it("Treats currentIndex the same as Array.reduce (1 item, initialValue)", () => {
    const [result] = [
      ...accumulate([55], { errorHandling: "exception" }).reduce(
        (acc, cur, currentIndex) => currentIndex,
        22
      ),
    ];
    expect(result).toEqual(
      [12].reduce((acc, cur, currentIndex) => currentIndex, 11)
    );
  });

  it("Treats currentIndex the same as Array.reduce (2 items, initialValue)", () => {
    const [result] = [
      ...accumulate([75, 11], { errorHandling: "exception" }).reduce(
        (acc, cur, currentIndex) => currentIndex,
        13
      ),
    ];
    expect(result).toEqual(
      [8, 17].reduce((acc, cur, currentIndex) => currentIndex, 11)
    );
  });
});

describe("Reduces larger lists", () => {
  it("Reduces longer lists of integers with initialValue", () => {
    expect([
      ...accumulate([1, 2, 3, 4, 5], { errorHandling: "exception" }).reduce(
        (acc, cur) => acc + cur,
        100
      ),
    ]).toEqual([115]);
  });

  it("Correctly reduces with a mix of data, append, and initialValue", () => {
    expect([
      ...accumulate([] as number[], {
        errorHandling: "exception",
      })
        .reduce((acc, cur) => acc + cur)
        .append([1, 2, 3, 4, 5]),
    ]).toEqual([15]);

    expect([
      ...accumulate([] as number[], {
        errorHandling: "exception",
      })
        .append([1, 2, 3, 4, 5])
        .reduce((acc, cur) => acc + cur),
    ]).toEqual([15]);

    // expect([
    //   ...accumulate([1], {
    //     errorHandling: "exception",
    //   })
    //     .append([2, 3, 4, 5])
    //     .reduce((acc, cur) => acc + cur),
    // ]).toEqual([15]);

    // expect([
    //   ...accumulate([2], {
    //     errorHandling: "exception",
    //   })
    //     .append([3, 4, 5])
    //     .reduce((acc, cur) => acc + cur, 1),
    // ]).toEqual([15]);

    // expect([
    //   ...accumulate([2], {
    //     errorHandling: "exception",
    //   })
    //     .append([3])
    //     .append([])
    //     .append([])
    //     .append([4])
    //     .append([5])
    //     .reduce((acc, cur) => acc + cur, 1),
    // ]).toEqual([15]);
  });

  it("Reduces object data with an object initialValue", () => {
    const data = makeExampleData(100);

    expect([
      ...accumulate(data, { errorHandling: "exception" }).reduce(
        (acc, cur) => ({
          sumOfIndex: acc.sumOfIndex + cur.index,
          countOfYellow: acc.countOfYellow + (cur.color === "yellow" ? 0 : 1),
        }),
        {
          sumOfIndex: 0,
          countOfYellow: 0,
        }
      ),
    ]).toEqual([
      data.reduce(
        (acc, cur) => ({
          sumOfIndex: acc.sumOfIndex + cur.index,
          countOfYellow: acc.countOfYellow + (cur.color === "yellow" ? 0 : 1),
        }),
        {
          sumOfIndex: 0,
          countOfYellow: 0,
        }
      ),
    ]);
  });

  it("Reduces object data with an object initialValue (mutable)", () => {
    const data = makeExampleData(100);

    expect([
      ...accumulate(data, { errorHandling: "exception" }).reduce(
        (acc, cur) => {
          acc.sumOfIndex += cur.index;
          acc.countOfYellow =
            acc.countOfYellow + (cur.color === "yellow" ? 0 : 1);
          return acc;
        },
        {
          sumOfIndex: 0,
          countOfYellow: 0,
        }
      ),
    ]).toEqual([
      data.reduce(
        (acc, cur) => {
          acc.sumOfIndex += cur.index;
          acc.countOfYellow =
            acc.countOfYellow + (cur.color === "yellow" ? 0 : 1);
          return acc;
        },
        {
          sumOfIndex: 0,
          countOfYellow: 0,
        }
      ),
    ]);
  });
});
