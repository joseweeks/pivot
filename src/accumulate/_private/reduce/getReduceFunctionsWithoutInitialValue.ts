import { Reducer } from "./Reducer";
import { getReduceAppenderAndResolver } from "./getReduceAppenderAndResolver";

/**
 * Datum and Output are required to be the same type. This is enforced in the
 * overloads in the Accumulator class.
 */
export function getReduceFunctionsWithoutInitialValue<Datum, Output>(
  reducer: Reducer<Datum, Output>,
  onError: (err: Error) => void
) {
  const defer = (datum: Datum) => {
    const currentValue =
      typeof datum === "object" ? Object.assign({}, datum) : datum;
    const currentIndex = 1;
    return getReduceAppenderAndResolver(
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
