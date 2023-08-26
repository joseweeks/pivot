import { Reducer } from "./Reducer";
import { getReducedResultWithInitialValue } from "./getReducedResultWithInitialValue";
import { getReducedResultWithoutInitialValue } from "./getReducedResultWithoutInitialValue";

type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

// We are currently re-casting the generic type parameters of "this" whenever
// we receive updated type information from calls. This is in place of the
// alternative, which is to create a new Accumulator with a copy of the old
// ones data.
//
// This is done because the other approach does nothing at runtime but has
// a runtime cost. This approach does nothing at runtime.
function recastAccumulator<Datum, Throws extends boolean, Result>(
  orig: Accumulator<any, any, any>
) {
  return orig as Accumulator<Datum, Throws, Result>;
}

type AccumulatorResult<Throws extends boolean, Output> = Throws extends true
  ? Iterable<Output>
  : Iterable<Output> | Error;

type AccumulatorIterator<Throws extends boolean, Output> = Throws extends true
  ? Iterator<Output>
  : never;

export class Accumulator<Input, Throws extends boolean, Output = Input> {
  private input: Iterable<Input>;
  private output: Iterable<Output>;
  private throws: boolean;
  private error?: Error;

  public constructor(
    input: Iterable<Input>,
    throws: Throws,
    output?: Iterable<Output>
  ) {
    this.input = input;
    this.throws = throws;
    this.output = output ?? (input as unknown as Iterable<Output>);
  }

  // public classify<ThisClassification = string>(
  //   classifier: Classifier<Input, ThisClassification>
  // ) {
  //   const that = recastAccumulator<Input, ThisClassification, Output>(this);

  //   that.classifier = classifier;
  //   return that;
  // }

  public reduce<ThisOutput>(
    reducer: Reducer<Input, ThisOutput>,
    initialValue: ThisOutput
  ): Accumulator<Input, Throws, ThisOutput>;

  public reduce(
    reducer: Reducer<Input, Input>,
    initialValue?: undefined
  ): Accumulator<Input, Throws, Input>;

  public reduce<ThisOutput>(
    reducer: Reducer<Input, ThisOutput>,
    initialValue?: ThisOutput
  ) {
    const that = recastAccumulator<Input, Throws, ThisOutput>(this);

    const value =
      initialValue === undefined
        ? getReducedResultWithoutInitialValue(
            // These cast are enforced by the overloads above
            that.input as unknown as Iterable<ThisOutput>,
            that.throws,
            reducer as unknown as Reducer<ThisOutput, ThisOutput>
          )
        : getReducedResultWithInitialValue(
            that.input,
            that.throws,
            reducer,
            initialValue
          );

    if (value instanceof Error) that.error = value;
    else that.output = [value];

    return that;
  }

  public result(): AccumulatorResult<Throws, Output> {
    if (!this.throws && this.error)
      return this.error as AccumulatorResult<Throws, Output>;

    const iterator: Iterable<Output> = {
      [Symbol.iterator]: () => {
        return this.output[Symbol.iterator]();
      },
    };

    return iterator;
  }

  // This accumulator will only be iterable if Throws extends true.
  // If not, AccumulatorIterator's return type will be never.
  public [Symbol.iterator]() {
    return this.output[Symbol.iterator]() as AccumulatorIterator<
      Throws,
      Output
    >;
  }

  // private executeReduce2() {
  //   const resultsAndClassifications = getReducedResult(
  //     this.input,
  //     this.reducer,
  //     this.classifier,
  //     this.initalValue
  //   );
  //   if (resultsAndClassifications instanceof Error) {
  //     this.error = resultsAndClassifications;
  //     return;
  //   }

  //   const { results, classifications } = resultsAndClassifications;

  //   const parsed: {
  //     key: string;
  //     result: Output;
  //     classification?: Classification;
  //   }[] = [];

  //   for (const [key, val] of results.entries())
  //     parsed.push({
  //       key,
  //       result: val.result,
  //       classification: classifications.get(key),
  //     });

  //   return parsed;
  // }

  // public join<ClassificationName extends string = "">(
  //   classificationName?: ClassificationName
  // ) {
  //   if (this.error) return this.error;

  //   const resultsAndClassifications = getReducedResult(
  //     this.input,
  //     this.reducer,
  //     this.classifier,
  //     this.initalValue
  //   );
  //   if (resultsAndClassifications instanceof Error)
  //     return resultsAndClassifications;

  //   const { results, classifications } = resultsAndClassifications;

  //   type Joined = Expand<
  //     (ClassificationName extends ""
  //       ? unknown
  //       : { [key in ClassificationName]: string }) &
  //       (Classification extends string ? unknown : Classification) &
  //       Output
  //   >;

  //   const parsed: Joined[] = [];

  //   for (const [key, val] of results.entries()) {
  //     const r = {
  //       ...(classificationName ? { [classificationName]: key } : {}),
  //       ...classifications.get(key),
  //       ...val.result,
  //     } as Joined;

  //     parsed.push(r);
  //   }

  //   return parsed;
  // }
}
