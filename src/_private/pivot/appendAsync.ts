import type { Accumulator } from "../../Accumulator";
import type { Classifier } from "../../types/Classifier";
import { getClassifierResultAsync } from "./getClassifierResultAsync";
import { storeClassifierResultAndAppend } from "./storeClassifierResultAndAppend";

export async function appendAsync<
  Datum,
  Throws extends boolean,
  Async extends true,
  ReduceOutput,
  Classification
>(
  datum: Datum,
  accumulators: Map<string, Accumulator<Datum, Throws, Async, ReduceOutput>>,
  classifications: Map<string, Classification>,
  classifier: Classifier<Datum, Classification, Async>,
  makeAccumulator: () => Accumulator<Datum, Throws, Async, ReduceOutput>,
  onError: (error: Error) => void
) {
  const classifierResult = await getClassifierResultAsync(datum, classifier);
  if (classifierResult instanceof Error) {
    onError(classifierResult);
    return;
  }

  storeClassifierResultAndAppend(
    datum,
    classifierResult,
    accumulators,
    classifications,
    makeAccumulator
  );
}
