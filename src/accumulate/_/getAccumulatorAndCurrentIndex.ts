export function getAccumulatorAndCurrentIndex<Datum, Result>(
  datum: Datum,
  results: Map<string, { currentIndex: number; result: Result }>,
  classification: { key: string },
  initialValue: Result | undefined
) {
  const cur = results.get(classification.key);
  if (!cur) {
    // If initialValue is false, Datum must be of the same type as Result
    // Per the call signatures of reduce()
    if (initialValue === undefined) {
      return { accumulator: datum as unknown as Result, currentIndex: 1 };
    } else {
      return { accumulator: initialValue, currentIndex: 0 };
    }
  }
  return {
    accumulator: cur.result,
    currentIndex: cur.currentIndex + 1,
  };
}
