import { Reducer } from "./Reducer";
import { getReducedResult } from "./getReducedResult";

export function getReducedResultWithInitialValue<
  Input,
  Throws extends boolean,
  Output
>(
  data: Iterable<Input>,
  throws: Throws,
  reducer: Reducer<Input, Output>,
  initialValue: Output
) {
  const iterator = data[Symbol.iterator]();
  const currentValue = initialValue;
  const currentIndex = 0;

  return getReducedResult(
    iterator,
    throws,
    reducer,
    currentValue,
    currentIndex
  );
}
