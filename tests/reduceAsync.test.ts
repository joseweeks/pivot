import { describe, expect, it } from "@jest/globals";
import { accumulateAsync } from "../src";
import { makeExampleData } from "./util";
import { sleep } from "../src/accumulate/_private";

async function sleepAndReturn<T>(val: T) {
  await sleep(10);
  return val;
}

async function sleepAndThrow(errString: string): Promise<Error> {
  await sleep(10);
  throw new Error(errString);
}

describe("Error Handling", () => {
  it("Returns an error when reducing an empty array with no initialValue", async () => {
    const result = await accumulateAsync([] as number[])
      .reduce((prev, cur) => prev + cur)
      .result();

    expect(result).toBeInstanceOf(Error);

    const result2 = await accumulateAsync([] as number[])
      .reduce((prev, cur) => sleepAndReturn(prev + cur))
      .result();

    expect(result2).toBeInstanceOf(Error);
  });

  it("Throws an error when reducing an empty array with no initialValue", async () => {
    const accumulator = accumulateAsync([] as number[])
      .enableExceptions()
      .reduce((prev, cur) => prev + cur);

    await expect(async () => {
      await accumulator.result();
    }).rejects.toThrowError();

    const accumulator2 = accumulateAsync([] as number[])
      .enableExceptions()
      .reduce((prev, cur) => sleepAndReturn(prev + cur));

    await expect(async () => {
      await accumulator2.result();
    }).rejects.toThrowError();
  });

  it("Returns an error when the reducer returns an error", async () => {
    const result = await accumulateAsync([1, 2, 3])
      .reduce(() => new Error("No way!"))
      .result();
    expect(result).toBeInstanceOf(Error);

    const result2 = await accumulateAsync([1, 2, 3])
      .reduce(() => sleepAndReturn(new Error("No way!")))
      .result();
    expect(result2).toBeInstanceOf(Error);
  });

  it("Returns an error when the reducer throws an error", async () => {
    const result = await accumulateAsync([1, 2, 3])
      .reduce(() => {
        throw new Error("No way!");
      })
      .result();
    expect(result).toBeInstanceOf(Error);

    const result2 = await accumulateAsync([1, 2, 3])
      .reduce(() => sleepAndThrow("No way!"))
      .result();
    expect(result2).toBeInstanceOf(Error);
  });

  it("Throws an error when the reducer returns an error", async () => {
    await expect(() =>
      accumulateAsync([1, 2, 3])
        .enableExceptions()
        .reduce(() => new Error("No way!"))
        .result()
    ).rejects.toThrowError();

    await expect(() =>
      accumulateAsync([1, 2, 3])
        .enableExceptions()
        .reduce(() => sleepAndReturn(new Error("No way!")))
        .result()
    ).rejects.toThrowError();
  });

  it("Throws an error when the reducer throws an error", async () => {
    await expect(() =>
      accumulateAsync([1, 2, 3])
        .enableExceptions()
        .reduce(() => {
          throw new Error("No way!");
        })
        .result()
    ).rejects.toThrowError();

    await expect(() =>
      accumulateAsync([1, 2, 3])
        .enableExceptions()
        .reduce(() => sleepAndThrow("No way!"))
        .result()
    ).rejects.toThrowError();
  });
});

describe("Accumulates 0 to 2 simple records", () => {
  it("Returns original list when accumulateAsync() is called without any results-generating function.", async () => {
    const accumulator = accumulateAsync([] as number[]);
    const result = await accumulator.result();
    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) expect([...result]).toEqual([]);

    const accumulator2 = accumulateAsync([1, 2, 3]);
    const result2 = await accumulator2.result();
    expect(result2).not.toBeInstanceOf(Error);
    if (!(result2 instanceof Error)) expect([...result2]).toEqual([1, 2, 3]);
  });

  it("Returns initialValue when reducing an empty array with initialValue", async () => {
    const [numResult] = await accumulateAsync([] as number[])
      .enableExceptions()
      .reduce((prev, cur) => prev + cur, 77)
      .toArray();

    expect(numResult).toBe(77);
    expect(numResult).toEqual(
      ([] as number[]).reduce((prev, cur) => prev + cur, 77)
    );

    const [stringResult] = await accumulateAsync([] as string[])
      .enableExceptions()
      .reduce((prev, cur) => prev + cur, "abc")
      .toArray();
    expect(stringResult).toBe("abc");
    expect(stringResult).toEqual(
      ([] as number[]).reduce((prev, cur) => prev + cur, "abc")
    );

    const [objResult] = await accumulateAsync([] as { foo: string }[])
      .enableExceptions()
      .reduce((prev, cur) => ({ foo: prev.foo + cur.foo }), { foo: "bar" })
      .toArray();

    expect(objResult.foo).toBe("bar");
    expect(objResult).toEqual(
      ([] as { foo: string }[]).reduce(
        (prev, cur) => ({ foo: prev.foo + cur.foo }),
        { foo: "bar" }
      )
    );
  });

  it("Returns first value when reducing an single item array with no initialValue", async () => {
    const [numResult] = await accumulateAsync([77])
      .enableExceptions()
      .reduce((prev, cur) => prev + cur)
      .toArray();
    expect(numResult).toBe(77);
    expect(numResult).toEqual([77].reduce((prev, cur) => prev + cur));

    const [stringResult] = await accumulateAsync(["abc"])
      .enableExceptions()
      .reduce((prev, cur) => prev + cur)
      .toArray();
    expect(stringResult).toBe("abc");
    expect(stringResult).toEqual(["abc"].reduce((prev, cur) => prev + cur));

    const [objResult] = await accumulateAsync([{ foo: "bar" }])
      .enableExceptions()
      .reduce((prev, cur) => ({ foo: prev.foo + cur.foo }))
      .toArray();
    expect(objResult.foo).toBe("bar");
    expect(objResult).toEqual(
      [{ foo: "bar" }].reduce((prev, cur) => ({
        foo: prev.foo + cur.foo,
      }))
    );
  });

  it("Adds two numbers with initialValue", async () => {
    const result = await accumulateAsync([-100])
      .enableExceptions()
      .reduce((sum, cur) => {
        return sum + cur;
      }, 120)
      .toArray();
    expect(result).toEqual([20]);
  });

  it("Adds two numbers with no initialValue", async () => {
    const result = await accumulateAsync([5, 7])
      .enableExceptions()
      .reduce((sum, cur) => sum + cur)
      .toArray();
    expect(result).toEqual([12]);
  });

  it("Combines two objects", async () => {
    const result = await accumulateAsync([
      { a: 100, b: 200, c: "abc" },
      { a: 5, b: 17, c: "zzz" },
    ])
      .enableExceptions()
      .reduce((acc, cur) => ({
        a: acc.a + cur.a,
        b: acc.b + cur.b,
        c: acc.c + cur.c,
      }))
      .result();

    expect(result).toEqual([{ a: 105, b: 217, c: "abczzz" }]);
  });

  it("Treats currentIndex the same as Array.reduce (1 item, no initialValue)", async () => {
    const [result] = await accumulateAsync([0])
      .enableExceptions()
      .reduce((acc, cur, currentIndex) => currentIndex)
      .toArray();
    expect(result).toEqual(
      [0].reduce((acc, cur, currentIndex) => currentIndex)
    );
  });

  it("Treats currentIndex the same as Array.reduce (2 items, no initialValue)", async () => {
    const [result] = await accumulateAsync([5, 10])
      .enableExceptions()
      .reduce((acc, cur, currentIndex) => currentIndex)
      .result();

    expect(result).toEqual(
      [1, 2].reduce((acc, cur, currentIndex) => currentIndex)
    );
  });

  it("Treats currentIndex the same as Array.reduce (0 items, initialValue)", async () => {
    const [result] = await accumulateAsync([])
      .enableExceptions()
      .reduce((acc, cur, currentIndex) => currentIndex, 99)
      .toArray();

    expect(result).toEqual(
      [].reduce((acc, cur, currentIndex) => currentIndex, 99)
    );
  });

  it("Treats currentIndex the same as Array.reduce (1 item, initialValue)", async () => {
    const [result] = await accumulateAsync([55])
      .enableExceptions()
      .reduce((acc, cur, currentIndex) => currentIndex, 22)
      .toArray();

    expect(result).toEqual(
      [12].reduce((acc, cur, currentIndex) => currentIndex, 11)
    );
  });

  it("Treats currentIndex the same as Array.reduce (2 items, initialValue)", async () => {
    const [result] = await accumulateAsync([75, 11])
      .enableExceptions()
      .reduce((acc, cur, currentIndex) => currentIndex, 13)
      .toArray();

    expect(result).toEqual(
      [8, 17].reduce((acc, cur, currentIndex) => currentIndex, 11)
    );
  });
});

describe("Reduces larger lists", () => {
  it("Reduces longer lists of integers with initialValue", async () => {
    expect(
      await accumulateAsync([1, 2, 3, 4, 5])
        .enableExceptions()
        .reduce((acc, cur) => acc + cur, 100)
        .result()
    ).toEqual([115]);
  });

  it("Correctly reduces with a mix of data, append, and initialValue", async () => {
    expect(
      await accumulateAsync([] as number[])
        .enableExceptions()
        .reduce((acc, cur) => sleepAndReturn(acc + cur))
        .append([1, 2, 3, 4, 5])
        .toArray()
    ).toEqual([15]);

    expect(
      await accumulateAsync([] as number[])
        .enableExceptions()
        .append([1, 2, 3, 4, 5])
        .reduce((acc, cur) => acc + cur)
        .toArray()
    ).toEqual([15]);
  });

  it("Reduces object data with an object initialValue", async () => {
    const data = makeExampleData(100);

    expect(
      await accumulateAsync(data)
        .enableExceptions()
        .reduce(
          (acc, cur) => ({
            sumOfIndex: acc.sumOfIndex + cur.index,
            countOfYellow: acc.countOfYellow + (cur.color === "yellow" ? 0 : 1),
          }),
          {
            sumOfIndex: 0,
            countOfYellow: 0,
          }
        )
        .toArray()
    ).toEqual([
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

  it("Reduces object data with an object initialValue (mutable)", async () => {
    const data = makeExampleData(100);

    expect(
      await accumulateAsync(data)
        .enableExceptions()
        .reduce(
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
        )
        .toArray()
    ).toEqual([
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
