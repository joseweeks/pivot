import { ClassifierResult } from "./ClassifierResult";

export type Classifier<
  Datum,
  Classification,
  Async extends boolean
> = Async extends true
  ? (datum: Datum) => Promise<ClassifierResult<Classification> | Error>
  : (datum: Datum) => ClassifierResult<Classification> | Error;
