import { describe, expect, it } from "@jest/globals";
import { makeExampleData } from "./util";
import { accumulate, accumulateAsync } from "../src";
import { sleep } from "../src/accumulate/_private";

describe("A simple pivot example", () => {
  it("Performs a simple classification with counting", () => {
    const data = makeExampleData(1000);
    const result = accumulate(data)
      .pivot({
        reducer: (acc, datum) => ({
          count: acc.count + 1,
          countOfRed: acc.countOfRed + (datum.color === "red" ? 1 : 0),
        }),
        initialValue: { count: 0, countOfRed: 0 },
        classifier: (d) => ({
          key: d.firstName + ":" + d.lastName,
          classification: { firstName: d.firstName, lastName: d.lastName },
        }),
      })
      .result();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    const array = [...result];

    expect(array.length).toBe(90);

    expect(array.slice(0, 10)).toEqual([
      { firstName: "Maria", lastName: "Wang", count: 12, countOfRed: 2 },
      { firstName: "Nushi", lastName: "Li", count: 12, countOfRed: 2 },
      { firstName: "Mohammed", lastName: "Zhang", count: 12, countOfRed: 2 },
      { firstName: "Jose", lastName: "Chen", count: 12, countOfRed: 2 },
      { firstName: "Wei", lastName: "Liu", count: 12, countOfRed: 2 },
      { firstName: "Ahmed", lastName: "Devi", count: 12, countOfRed: 1 },
      { firstName: "Yan", lastName: "Yang", count: 12, countOfRed: 1 },
      { firstName: "Ali", lastName: "Huang", count: 12, countOfRed: 2 },
      { firstName: "John", lastName: "Singh", count: 12, countOfRed: 2 },
      { firstName: "David", lastName: "Wang", count: 12, countOfRed: 2 },
    ]);
  });

  it("Performs a simple classification with counting - async", async () => {
    const data = makeExampleData(1000);
    const result = await accumulateAsync(data)
      .pivot({
        reducer: async (acc, datum) => {
          await sleep(10);
          return {
            count: acc.count + 1,
            countOfRed: acc.countOfRed + (datum.color === "red" ? 1 : 0),
          };
        },
        initialValue: { count: 0, countOfRed: 0 },
        classifier: (d) =>
          Promise.resolve({
            key: d.firstName + ":" + d.lastName,
            classification: { firstName: d.firstName, lastName: d.lastName },
          }),
      })
      .result();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    const array = [...result];

    expect(array.length).toBe(90);

    expect(array.slice(0, 10)).toEqual([
      { firstName: "Maria", lastName: "Wang", count: 12, countOfRed: 2 },
      { firstName: "Nushi", lastName: "Li", count: 12, countOfRed: 2 },
      { firstName: "Mohammed", lastName: "Zhang", count: 12, countOfRed: 2 },
      { firstName: "Jose", lastName: "Chen", count: 12, countOfRed: 2 },
      { firstName: "Wei", lastName: "Liu", count: 12, countOfRed: 2 },
      { firstName: "Ahmed", lastName: "Devi", count: 12, countOfRed: 1 },
      { firstName: "Yan", lastName: "Yang", count: 12, countOfRed: 1 },
      { firstName: "Ali", lastName: "Huang", count: 12, countOfRed: 2 },
      { firstName: "John", lastName: "Singh", count: 12, countOfRed: 2 },
      { firstName: "David", lastName: "Wang", count: 12, countOfRed: 2 },
    ]);
  });

  it("Pivots with columns based on input data", () => {
    const data = makeExampleData(1000);
    const result = accumulate(data)
      .pivot({
        reducer: (acc, datum) => {
          if (datum.mod[4] !== 0) return acc;

          if (datum.firstName in acc) ++acc[datum.firstName];
          else acc[datum.firstName] = 1;

          return acc;
        },
        initialValue: {} as Record<string, number>,
        classifier: (d) => d.lastName,
        classificationName: "lastName",
      })
      .toArray();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result).toEqual([
      { lastName: "Wang", Maria: 6, Yan: 6, Mohammed: 6, John: 5, Wei: 5 },
      { lastName: "Li", John: 6, Wei: 6, Maria: 5, Yan: 5, Mohammed: 5 },
      { lastName: "Zhang", Maria: 6, Yan: 6, Mohammed: 6, John: 5, Wei: 5 },
      { lastName: "Chen", Mohammed: 6, John: 6, Wei: 6, Maria: 5, Yan: 5 },
      { lastName: "Liu", Wei: 6, Maria: 6, Yan: 6, Mohammed: 5, John: 5 },
      { lastName: "Devi", Mohammed: 6, John: 6, Wei: 5, Maria: 5, Yan: 5 },
      { lastName: "Yang", Wei: 6, Maria: 6, Yan: 6, Mohammed: 5, John: 5 },
      { lastName: "Huang", Yan: 6, Mohammed: 6, John: 6, Wei: 5, Maria: 5 },
      { lastName: "Singh", John: 6, Wei: 6, Maria: 6, Yan: 5, Mohammed: 5 },
    ]);
  });

  it("Pivots with columns based on input data - async", async () => {
    const data = makeExampleData(1000);
    let classifierIdx = 0;
    const result = await accumulateAsync(data)
      .pivot({
        reducer: async (acc, datum, idx) => {
          if (idx % 100 === 0) await sleep(10);

          if (datum.mod[4] !== 0) return acc;

          if (datum.firstName in acc) ++acc[datum.firstName];
          else acc[datum.firstName] = 1;

          return acc;
        },
        initialValue: {} as Record<string, number>,
        classifier: async (d) => {
          if (classifierIdx++ % 33 === 0) await sleep(10);
          return d.lastName;
        },
        classificationName: "lastName",
      })
      .toArray();

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result).toEqual([
      { lastName: "Wang", Maria: 6, Yan: 6, Mohammed: 6, John: 5, Wei: 5 },
      { lastName: "Li", John: 6, Wei: 6, Maria: 5, Yan: 5, Mohammed: 5 },
      { lastName: "Zhang", Maria: 6, Yan: 6, Mohammed: 6, John: 5, Wei: 5 },
      { lastName: "Chen", Mohammed: 6, John: 6, Wei: 6, Maria: 5, Yan: 5 },
      { lastName: "Liu", Wei: 6, Maria: 6, Yan: 6, Mohammed: 5, John: 5 },
      { lastName: "Devi", Mohammed: 6, John: 6, Wei: 5, Maria: 5, Yan: 5 },
      { lastName: "Yang", Wei: 6, Maria: 6, Yan: 6, Mohammed: 5, John: 5 },
      { lastName: "Huang", Yan: 6, Mohammed: 6, John: 6, Wei: 5, Maria: 5 },
      { lastName: "Singh", John: 6, Wei: 6, Maria: 6, Yan: 5, Mohammed: 5 },
    ]);
  });
});
