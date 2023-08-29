import { ClassifierResult } from "./ClassifierResult";

export type Classifier<Datum, Classification> = (
  datum: Datum
) => ClassifierResult<Classification> | Error;
