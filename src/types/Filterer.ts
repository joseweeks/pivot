export type Filterer<Datum, Async extends boolean> = Async extends true
  ? (element: Datum, index: number) => Promise<boolean>
  : (element: Datum, index: number) => boolean;
