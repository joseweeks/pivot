// https://stackoverflow.com/questions/57683303/how-can-i-see-the-full-expanded-contract-of-a-typescript-type
type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? {
      [K in keyof O]: O[K];
    }
  : never;

export type PivotResult<
  Output,
  Classification,
  ClassificationName extends string = "",
  ValueName extends string = ""
> = Expand<
  (ClassificationName extends ""
    ? unknown
    : {
        [key in ClassificationName]: string;
      }) &
    (Classification extends string ? unknown : Classification) &
    (ValueName extends "" ? Output : { [key in ValueName]: Output })
>;
