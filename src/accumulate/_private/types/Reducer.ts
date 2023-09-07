export type Reducer<Datum, Result, Async extends boolean> = Async extends true
  ? (
      accumulator: Result,
      currentValue: Datum,
      currentIndex: number
    ) => Promise<Result | Error>
  : (
      accumulator: Result,
      currentValue: Datum,
      currentIndex: number
    ) => Result | Error;
