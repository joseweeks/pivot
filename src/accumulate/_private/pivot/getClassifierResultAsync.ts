import { Classifier } from "../types/Classifier";
import { wrapError } from "../util/wrapError";

export async function getClassifierResultAsync<
  Datum,
  Classification,
  Async extends true
>(datum: Datum, classifier: Classifier<Datum, Classification, Async>) {
  try {
    return await classifier(datum);
  } catch (err) {
    return wrapError(err);
  }
}
