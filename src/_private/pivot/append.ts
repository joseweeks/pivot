import type { Accumulator } from "../../Accumulator";
import type { Classifier } from "../../types/Classifier";
import { getClassifierResult } from "./getClassifierResult";
import { storeClassifierResultAndAppend } from "./storeClassifierResultAndAppend";

export function append<
  Datum,
  Throws extends boolean,
  Async extends false,
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
  const classifierResult = getClassifierResult(datum, classifier);
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
