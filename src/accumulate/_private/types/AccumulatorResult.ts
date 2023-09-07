export type AccumulatorResult<
  Throws extends boolean,
  Async extends boolean,
  Output
> = Async extends true
  ? Promise<Throws extends true ? Iterable<Output> : Iterable<Output> | Error>
  : Throws extends true
  ? Iterable<Output>
  : Iterable<Output> | Error;
