import { Classifier } from "./Classifier";
import { wrapError } from "../util/wrapError";

export function getClassifierResult<Datum, Classification>(
  datum: Datum,
  classifier: Classifier<Datum, Classification>
) {
  try {
    return classifier(datum);
  } catch (err) {
    return wrapError(err);
  }
}
