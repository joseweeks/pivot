import { describe, expect, test, it } from "@jest/globals";
import { accumulate } from "../src/accumulate";
import { makeExampleData } from "./util/makeExampleData";

describe("A simple pivot example", () => {
  it("stuff", () => {
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
});
