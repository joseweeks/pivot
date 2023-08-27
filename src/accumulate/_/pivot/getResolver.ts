import { Accumulator } from "../Accumulator";
import { PivotResult } from "./PivotResult";

export function getResolver<
  Datum,
  Throws extends boolean,
  ReduceOutput,
  Classification,
  ClassificationName extends string,
  ValueName extends string
>(
  accumulators: Map<string, Accumulator<Datum, Throws, ReduceOutput>>,
  classifications: Map<string, Classification>,
  onError: (error: Error) => void,
  classificationName?: ClassificationName,
  valueName?: ValueName
) {
  const results = [];

  for (const [key, acc] of accumulators) {
    const result = acc.result();
    if (result instanceof Error) {
      onError(result);
      return [];
    }

    const [resultValue] = result;
    const classification = classifications.get(key);

    results.push({
      ...(classificationName ? { [classificationName]: key } : {}),
      ...classification,
      ...(valueName ? { [valueName]: resultValue } : resultValue),
    } as PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>);
  }
  return results;
}
