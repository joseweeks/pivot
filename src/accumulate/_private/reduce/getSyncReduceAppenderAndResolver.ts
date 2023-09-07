import { wrapError } from "../util/wrapError";
import { Reducer } from "../types/Reducer";

export function getSyncReduceAppenderAndResolver<
  Datum,
  Output,
  Async extends false
>(
  reducer: Reducer<Datum, Output, Async>,
  currentValue: Output,
  currentIndex: number,
  onError: (error: Error) => void
) {
  const appender = (datum: Datum) => {
    try {
      const value = reducer(currentValue, datum, currentIndex++);
      if (value instanceof Error) {
        onError(value);
        return;
      }
      currentValue = value;
    } catch (err) {
      onError(wrapError(err));
      return;
    }
  };

  const resolver = () => [currentValue];

  return { appender, resolver };
}
