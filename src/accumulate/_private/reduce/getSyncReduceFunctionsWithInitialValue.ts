import { Reducer } from "../types/Reducer";
import { getSyncReduceAppenderAndResolver } from "./getSyncReduceAppenderAndResolver";

export function getSyncReduceFunctionsWithInitialValue<
  Datum,
  Output,
  Async extends false
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

  return getSyncReduceAppenderAndResolver(
    reducer,
    currentValue,
    currentIndex,
    onError
  );
}
