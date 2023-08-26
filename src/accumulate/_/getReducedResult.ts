import { Reducer } from "./Reducer";

export function getReducedResult<Input, Output>(
  iterator: Iterator<Input>,
  throws: boolean,
  reducer: Reducer<Input, Output>,
  currentValue: Output,
  currentIndex: number
) {
  try {
    for (let cur = iterator.next(); !cur.done; cur = iterator.next()) {
      const value = reducer(currentValue, cur.value, currentIndex++);
      if (value instanceof Error) {
        if (throws) throw value;
        return value;
      }
      currentValue = value;
    }

    return currentValue;
  } catch (err) {
    if (throws) throw err;
    if (err instanceof Error) return err;
    return new Error(err);
  }
}
