export type AccumulatorAsyncIterator<
  Throws extends boolean,
  Async extends boolean,
  Output
> = Throws extends true
  ? Async extends true
    ? AsyncIterator<Output>
    : never
  : never;
