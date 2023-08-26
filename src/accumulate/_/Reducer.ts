export type Reducer<Datum, Result> = (
  accumulator: Result,
  currentValue: Datum,
  currentIndex: number
) => Result | Error;
