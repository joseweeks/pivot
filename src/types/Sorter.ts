export type Sorter<Datum, Async extends boolean> = Async extends true
  ? (a: Datum, b: Datum) => Promise<number>
  : (a: Datum, b: Datum) => number;
