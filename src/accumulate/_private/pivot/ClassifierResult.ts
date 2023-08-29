import { SpecifiedClassification } from "./SpecifiedClassification";

export type ClassifierResult<Classification> =
  | string
  | string[]
  | SpecifiedClassification<Classification>
  | SpecifiedClassification<Classification>[];
