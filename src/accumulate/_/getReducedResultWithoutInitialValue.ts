import { Reducer } from "./Reducer";
import { getReducedResult } from "./getReducedResult";

export function getReducedResultWithoutInitialValue<InputOutput>(
  data: Iterable<InputOutput>,
  throws: boolean,
  reducer: Reducer<InputOutput, InputOutput>
) {
  const iterator = data[Symbol.iterator]();
  const next = iterator.next();
  if (next.done) {
    const error = new Error("Unable to reduce(): No data or initialValue.");
    if (throws) throw error;
    return error;
  }

  const currentValue = next.value;
  const currentIndex = 1;

  return getReducedResult(
    iterator,
    throws,
    reducer,
    currentValue,
    currentIndex
  );
}
