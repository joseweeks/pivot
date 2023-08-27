import { Reducer } from "./Reducer";
import { getReduceAppenderAndResolver } from "./getReduceAppenderAndResolver";

export function getReduceFunctionsWithInitialValue<Datum, Output>(
  reducer: Reducer<Datum, Output>,
  initialValue: Output,
  onError: (err: Error) => void
) {
  const currentValue =
    typeof initialValue === "object"
      ? Object.assign({}, initialValue)
      : initialValue;
  const currentIndex = 0;

  return getReduceAppenderAndResolver(
    reducer,
    currentValue,
    currentIndex,
    onError
  );
}
