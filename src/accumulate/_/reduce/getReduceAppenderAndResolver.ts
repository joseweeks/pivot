import { Reducer } from "./Reducer";

export function getReduceAppenderAndResolver<Datum, Output>(
  reducer: Reducer<Datum, Output>,
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
    } catch (err: any) {
      if (err instanceof Error) onError(err);
      else onError(new Error(err));
      return;
    }
  };

  const resolver = () => [currentValue];

  return { appender, resolver };
}
