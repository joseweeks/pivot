import { wrapError } from "../util/wrapError";
import type { Reducer } from "../../types/Reducer";

export function getAsyncReduceAppenderAndResolver<
  Datum,
  Output,
  Async extends true
>(
  reducer: Reducer<Datum, Output, Async>,
  currentValue: Output,
  currentIndex: number,
  onError: (error: Error) => void
) {
  const appender = async (datum: Datum) => {
    try {
      const value = await reducer(currentValue, datum, currentIndex++);
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
