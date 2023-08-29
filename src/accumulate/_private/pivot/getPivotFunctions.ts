import { Accumulator } from "../Accumulator";
import { Classifier } from "./Classifier";
import { append } from "./append";
import { getResolver } from "./getResolver";

export function getPivotFunctions<
  Datum,
  Throws extends boolean,
  ReduceOutput,
  Classification,
  ClassificationName extends string,
  ValueName extends string
>(
  classifier: Classifier<Datum, Classification>,
  classificationName: ClassificationName | undefined,
  valueName: ValueName | undefined,
  makeAccumulator: () => Accumulator<Datum, boolean, ReduceOutput>,
  onError: (error: Error) => void
) {
  const accumulators = new Map<
    string,
    Accumulator<Datum, Throws, ReduceOutput>
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
