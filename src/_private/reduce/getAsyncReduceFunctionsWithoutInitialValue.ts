import type { Reducer } from "../../types/Reducer";
import { getAsyncReduceAppenderAndResolver } from "./getAsyncReduceAppenderAndResolver";

/**
 * Datum and Output are required to be the same type. This is enforced in the
 * overloads in the Accumulator class.
 */
export function getAsyncReduceFunctionsWithoutInitialValue<
  Datum,
  Output,
  Async extends true
>(reducer: Reducer<Datum, Output, Async>, onError: (err: Error) => void) {
  const defer = (datum: Datum) => {
    const currentValue =
      typeof datum === "object" ? Object.assign({}, datum) : datum;
    const currentIndex = 1;
    return getAsyncReduceAppenderAndResolver(
      reducer,
      currentValue as unknown as Output,
      currentIndex,
      onError
    );
  };

  return {
    defer,
    resolver: () => {
      onError(new Error("Unable to reduce(): No data or initialValue."));
      return [];
    },
  };
}
