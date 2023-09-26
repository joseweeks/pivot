import type { Accumulator } from "../../Accumulator";
import type { Classifier } from "../../types/Classifier";
import { appendAsync } from "./appendAsync";
import { getResolverAsync } from "./getResolverAsync";

export function getAsyncPivotFunctions<
  Datum,
  Throws extends boolean,
  Async extends true,
  ReduceOutput,
  Classification,
  ClassificationName extends string,
  ValueName extends string
>(
  classifier: Classifier<Datum, Classification, Async>,
  classificationName: ClassificationName | undefined,
  valueName: ValueName | undefined,
  makeAccumulator: () => Accumulator<Datum, Throws, Async, ReduceOutput>,
  onError: (error: Error) => void
) {
  const accumulators = new Map<
    string,
    Accumulator<Datum, Throws, Async, ReduceOutput>
  >();
  const classifications = new Map<string, Classification>();

  const appender = (datum: Datum) =>
    appendAsync(
      datum,
      accumulators,
      classifications,
      classifier,
      makeAccumulator,
      onError
    );

  const resolver = () =>
    getResolverAsync(
      accumulators,
      classifications,
      onError,
      classificationName,
      valueName
    );

  return { appender, resolver };
}
