import type { ClassifierResult } from "./ClassifierResult";

export type Classifier<
  Datum,
  Classification,
  Async extends boolean
> = Async extends true
  ? (
      datum: Datum
    ) =>
      | ClassifierResult<Classification>
      | Error
      | Promise<ClassifierResult<Classification> | Error>
  : (datum: Datum) => ClassifierResult<Classification> | Error;
