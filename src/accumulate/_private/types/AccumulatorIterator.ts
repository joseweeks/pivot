export type AccumulatorIterator<
  Throws extends boolean,
  Async extends boolean,
  Output
> = Throws extends true
  ? Async extends false
    ? Iterator<Output>
    : never
  : never;
