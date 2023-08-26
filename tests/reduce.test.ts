import { describe, expect, test, it } from "@jest/globals";
import { accumulate } from "../src/accumulate";

describe("Error Handling", () => {
  it("Correctly detects iterator and non-iterator types based on error handling.", () => {
    const errorAccumulator = accumulate([] as number[]);
    const result = errorAccumulator.result();

    // @ts-expect-error
    [...errorAccumulator];
    // @ts-expect-error
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
    expect(() =>
      accumulate([] as number[], {
        errorHandling: "exception",
      }).reduce((prev, cur) => prev + cur)
    ).toThrow();
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

    const [stringResult] = [
      ...accumulate([] as string[], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur,
        "abc"
      ),
    ];
    expect(stringResult).toBe("abc");

    const [objResult] = [
      ...accumulate([] as { foo: string }[], {
        errorHandling: "exception",
      }).reduce((prev, cur) => ({ foo: prev.foo + cur.foo }), { foo: "bar" }),
    ];
    expect(objResult.foo).toBe("bar");
  });

  it("Returns first value when reducing an single item array with no initialValue", () => {
    const [numResult] = [
      ...accumulate([77], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur
      ),
    ];
    expect(numResult).toBe(77);

    const [stringResult] = [
      ...accumulate(["abc"], { errorHandling: "exception" }).reduce(
        (prev, cur) => prev + cur
      ),
    ];
    expect(stringResult).toBe("abc");

    const [objResult] = [
      ...accumulate([{ foo: "bar" }], {
        errorHandling: "exception",
      }).reduce((prev, cur) => ({ foo: prev.foo + cur.foo })),
    ];
    expect(objResult.foo).toBe("bar");
  });

  it("Adds two numbers", () => {
    expect([
      ...accumulate([5, 7], { errorHandling: "exception" }).reduce(
        (sum, cur) => sum + cur
      ),
    ]).toEqual([12]);
    expect([
      ...accumulate([-100], { errorHandling: "exception" }).reduce(
        (sum, cur) => sum + cur,
        120
      ),
    ]).toEqual([20]);
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
});

describe("Reduces larger lists", () => {
  expect([
    ...accumulate([1, 2, 3, 4, 5], { errorHandling: "exception" }).reduce(
      (acc, cur) => acc + cur,
      100
    ),
  ]).toEqual([115]);
});
