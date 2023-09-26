import type { Reducer } from "../../types/Reducer";
import { getAsyncReduceAppenderAndResolver } from "./getAsyncReduceAppenderAndResolver";

export function getAsyncReduceFunctionsWithInitialValue<
  Datum,
  Output,
  Async extends true
>(
  reducer: Reducer<Datum, Output, Async>,
  initialValue: Output,
  onError: (err: Error) => void
) {
  const currentValue =
    typeof initialValue === "object"
      ? Object.assign({}, initialValue)
      : initialValue;
  const currentIndex = 0;

  return getAsyncReduceAppenderAndResolver(
    reducer,
    currentValue,
    currentIndex,
    onError
  );
}
