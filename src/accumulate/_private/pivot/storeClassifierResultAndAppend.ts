import { Accumulator } from "../Accumulator";
import { ClassifierResult } from "../types";
import { getClassifications } from "./getClassifications";
import { storeClassification } from "./storeClassification";

export function storeClassifierResultAndAppend<
  Datum,
  Throws extends boolean,
  Async extends boolean,
  ReduceOutput,
  Classification
>(
  datum: Datum,
  classifierResult: ClassifierResult<Classification>,
  accumulators: Map<string, Accumulator<Datum, Throws, Async, ReduceOutput>>,
  classifications: Map<string, Classification>,
  makeAccumulator: () => Accumulator<Datum, Throws, Async, ReduceOutput>
) {
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
