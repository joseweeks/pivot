import type { ClassifierResult } from "../../types/ClassifierResult";
import type { SpecifiedClassification } from "../../types/SpecifiedClassification";

export function getClassifications<Classification>(
  result: ClassifierResult<Classification>
): { key: string; classification?: Classification }[] {
  if (typeof result === "string") return [{ key: result }];
  if (Array.isArray(result)) {
    if (result.length < 0) return [];
    if (typeof result[0] === "string")
      return (result as string[]).map((key) => ({ key }));
    return result as SpecifiedClassification<Classification>[];
  }
  return [result];
}
