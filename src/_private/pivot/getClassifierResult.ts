import type { Classifier } from "../../types/Classifier";
import { wrapError } from "../util/wrapError";

export function getClassifierResult<Datum, Classification, Async extends false>(
  datum: Datum,
  classifier: Classifier<Datum, Classification, Async>
) {
  try {
    return classifier(datum);
  } catch (err) {
    return wrapError(err);
  }
}
