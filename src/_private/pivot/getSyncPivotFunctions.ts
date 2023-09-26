import type { Accumulator } from "../../Accumulator";
import type { Classifier } from "../../types/Classifier";
import { append } from "./append";
import { getResolver } from "./getResolver";

export function getSyncPivotFunctions<
  Datum,
  Throws extends boolean,
  Async extends false,
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
    append(
      datum,
      accumulators,
      classifications,
      classifier,
      makeAccumulator,
      onError
    );

  const resolver = () =>
    getResolver(
      accumulators,
      classifications,
      onError,
      classificationName,
      valueName
    );

  return { appender, resolver };
}
