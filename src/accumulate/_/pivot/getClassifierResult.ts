import { Classifier } from "./Classifier";

export function getClassifierResult<Datum, Classification>(
  datum: Datum,
  classifier: Classifier<Datum, Classification>
) {
  try {
    return classifier(datum);
  } catch (err: any) {
    if (err instanceof Error) return err;
    return new Error(err);
  }
}
