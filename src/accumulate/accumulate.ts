import { Accumulator } from "./_private";

type ErrorHandling = "error" | "exception";
type AccumulateOptions = {
  /**
   * How to handle errors:
   *
   *   - error: Captures an Error object at the point of the error. Returns this error when result() is called.
   *   - exception: Throws an exception at the point that the exception or error occurred.
   *
   */
  errorHandling?: ErrorHandling;
};

export function accumulate<Datum, Throws extends true>(
  data: Iterable<Datum>,
  options: AccumulateOptions & { errorHandling: "exception" }
): Accumulator<Datum, Throws>;
export function accumulate<Datum, Throws extends false>(
  data: Iterable<Datum>,
  options: AccumulateOptions & { errorHandling: "error" }
): Accumulator<Datum, Throws>;
export function accumulate<Datum, Throws extends false>(
  data: Iterable<Datum>,
  options?: undefined
): Accumulator<Datum, Throws>;

export function accumulate<Datum, Throws extends boolean>(
  data: Iterable<Datum>,
  options: AccumulateOptions = {}
) {
  const { errorHandling } = options;
  const throws = errorHandling === "exception";

  return new Accumulator<Datum, Throws>(data, throws as Throws);
}
