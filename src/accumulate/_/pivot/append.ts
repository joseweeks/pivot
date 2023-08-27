import { Accumulator } from "../Accumulator";
import { Classifier } from "./Classifier";
import { getClassifications } from "./getClassifications";
import { getClassifierResult } from "./getClassifierResult";
import { storeClassification } from "./storeClassification";

export function append<
  Datum,
  Throws extends boolean,
  ReduceOutput,
  Classification
>(
  datum: Datum,
  accumulators: Map<string, Accumulator<Datum, Throws, ReduceOutput>>,
  classifications: Map<string, Classification>,
  classifier: Classifier<Datum, Classification>,
  makeAccumulator: () => Accumulator<Datum, boolean, ReduceOutput>,
  onError: (error: Error) => void
) {
  const classifierResult = getClassifierResult(datum, classifier);
  if (classifierResult instanceof Error) {
    onError(classifierResult);
    return;
  }

  for (const classification of getClassifications(classifierResult)) {
    storeClassification(classification, classifications);

    let acc = accumulators.get(classification.key);
    if (!acc) {
      acc = makeAccumulator();
      accumulators.set(classification.key, acc);
    }

    acc.append([datum]);
  }
}
