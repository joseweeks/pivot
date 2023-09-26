export type ArrayResult<
  Throws extends boolean,
  Async extends boolean,
  Output
> = Async extends true
  ? Promise<Throws extends true ? Output[] : Output[] | Error>
  : Throws extends true
  ? Output[]
  : Output[] | Error;
