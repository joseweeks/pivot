import { Accumulator } from "../Accumulator";
import { PivotResult } from "../types/PivotResult";

export async function getResolverAsync<
  Datum,
  Throws extends boolean,
  Async extends true,
  ReduceOutput,
  Classification,
  ClassificationName extends string,
  ValueName extends string
>(
  accumulators: Map<string, Accumulator<Datum, Throws, Async, ReduceOutput>>,
  classifications: Map<string, Classification>,
  onError: (error: Error) => void,
  classificationName?: ClassificationName,
  valueName?: ValueName
) {
  const results = [];

  for (const [key, acc] of accumulators) {
    const result = await acc.result();
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
