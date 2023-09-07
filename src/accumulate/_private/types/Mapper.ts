export type Mapper<Datum, Result, Async extends boolean> = Async extends true
  ? (element: Datum, index: number) => Promise<Result>
  : (element: Datum, index: number) => Result;
