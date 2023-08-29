import { Mapper } from "./Mapper";
import { Sorter } from "./Sorter";
import { Filterer } from "./Filterer";
import { Classifier, PivotResult, getPivotFunctions } from "./pivot";
import {
  Reducer,
  getReduceFunctionsWithInitialValue,
  getReduceFunctionsWithoutInitialValue,
} from "./reduce";

// We are currently re-casting the generic type parameters of "this" whenever
// we receive updated type information from calls. This is in place of the
// alternative, which is to create a new Accumulator with a copy of the old
// ones data.
//
// This is done because the other approach does nothing at runtime but has
// a runtime cost. This approach does nothing at runtime.
function recastAccumulator<Datum, Throws extends boolean, Output>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orig: Accumulator<any, any, any>
) {
  return orig as Accumulator<Datum, Throws, Output>;
}

type AccumulatorResult<Throws extends boolean, Output> = Throws extends true
  ? Iterable<Output>
  : Iterable<Output> | Error;

type AccumulatorIterator<Throws extends boolean, Output> = Throws extends true
  ? Iterator<Output>
  : never;

type ArrayResult<Throws extends boolean, Output> = Throws extends true
  ? Output[]
  : Output[] | Error;

type Appender<Datum> = (datum: Datum) => void;
type Resolver<Output> = () => Iterable<Output>;
type Defer<Datum, Output> = (datum: Datum) => {
  appender: Appender<Datum>;
  resolver: Resolver<Output>;
};

// type UnArray<T> = T extends Array<infer U> ? U : T;
// type UnArrayOnly<T> = T extends Array<infer U> ? U : never;

export class Accumulator<Datum, Throws extends boolean, Output = Datum> {
  /** Append datum to current working list */
  private appender: Appender<Datum>;

  /**
   * Resolve current working list to value or values that becomes data for
   * next stage in pipeline
   */
  private resolver: Resolver<Output>;

  /**
   * Only set if appender and resolver can't be determined until first datum
   * provided. Called with first datum. Returns appender and resolver.
   */
  private defer?: Defer<Datum, Output>;

  private throws: boolean;
  private error?: Error;

  private getDefaultAppenderAndResolver(data: Iterable<Datum>) {
    const appended: Output[] = [];
    const appender = (datum: Datum) =>
      appended.push(datum as unknown as Output);
    const resolver = () => [
      ...(data as unknown as Iterable<Output>),
      ...appended,
    ];

    return { appender, resolver };
  }

  public constructor(data: Iterable<Datum>, throws: Throws) {
    // this.data = data;
    this.throws = throws;
    const { appender, resolver } = this.getDefaultAppenderAndResolver(data);
    this.appender = appender;
    this.resolver = resolver;
  }

  /**
   * This method updates the defer, appender, and resolver callbacks, then
   * pipes the output of the old resolver to the new appender.
   *
   * Clears this.defer if it is not specified on this call.
   */
  private pipeAndUpdateCallbacks({
    defer,
    appender,
    resolver,
  }: {
    defer?: Defer<Datum, Output>;
    appender?: Appender<Datum>;
    resolver?: Resolver<Output>;
  }) {
    this.defer = defer;

    const prev = this.resolver() as unknown as Iterable<Datum>;

    if (appender) this.appender = appender;
    if (resolver) this.resolver = resolver;

    this.append(prev);
  }

  /**
   * Performs a pivot as follows:
   *
   * As data is input into the pivot, each datum is classified into one or more
   * classifications. Each classification corresponds to a separate reducer
   * currentValue. When the pivot is resolved, it produces an iterable list of objects
   * representing each of these currentValues. These values are spread into the result
   * object, along with other data as described below.
   *
   * Classification can be either a string value (which is treated as the key), or a
   * { key: string, classification: Classification } object. If the { classification: Classification }
   * is defined, then this value is included in each applicable result object for that classification.
   * If classificationName is specified, then { [classificationName]: key } is included in each applicable
   * result object.
   *
   * If valueName is specified, the entire currentValue object is included in the applicable result
   * object as { [valueName]: currentValue }.
   */

  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = "",
    ValueName extends string = ""
  >({
    classifier,
    classificationName,
    valueName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Output, Classification>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, ReduceOutput>;
    initialValue: ReduceOutput;
  }): Accumulator<
    Output,
    Throws,
    PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>
  >;
  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = "",
    ValueName extends string = ""
  >({
    classifier,
    classificationName,
    valueName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Output, Classification>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, Output>;
    initialValue?: undefined;
  }): Accumulator<
    Output,
    Throws,
    PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>
  >;
  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = "",
    ValueName extends string = ""
  >({
    classifier,
    classificationName,
    valueName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Output, Classification>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, ReduceOutput>;
    initialValue?: ReduceOutput;
  }) {
    type PivotOutput = PivotResult<
      ReduceOutput,
      Classification,
      ClassificationName,
      ValueName
    >;

    const that = recastAccumulator<Output, Throws, PivotOutput>(this);
    if (that.error) return that;

    const makeAccumulator = () => {
      const accumulator = new Accumulator<Output, Throws>(
        [],
        that.throws as Throws
      );

      if (initialValue)
        return accumulator.reduce<ReduceOutput>(reducer, initialValue);

      // This cast is enforced by the overloads of this method
      return accumulator.reduce(
        reducer as unknown as Reducer<Output, Output>
      ) as unknown as Accumulator<Output, Throws, ReduceOutput>;
    };

    const onError = (err: Error) => {
      if (that.throws) throw Error;
      that.error = err;
    };

    const { appender, resolver } = getPivotFunctions(
      classifier,
      classificationName,
      valueName,
      makeAccumulator,
      onError
    );

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput>,
    initialValue: ThisOutput
  ): Accumulator<Output, Throws, ThisOutput>;
  public reduce(
    reducer: Reducer<Output, Output>,
    initialValue?: undefined
  ): Accumulator<Output, Throws, Output>;
  public reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput>,
    initialValue?: ThisOutput
  ) {
    const that = recastAccumulator<Output, Throws, ThisOutput>(this);
    if (that.error) return that;

    const onError = (err: Error) => {
      if (that.throws) throw Error;
      that.error = err;
    };

    const callbacks =
      initialValue === undefined
        ? getReduceFunctionsWithoutInitialValue(reducer, onError)
        : getReduceFunctionsWithInitialValue(reducer, initialValue, onError);

    that.pipeAndUpdateCallbacks(callbacks);

    return that;
  }

  public map<ThisOutput>(mapper: Mapper<Output, ThisOutput>) {
    const that = recastAccumulator<Output, Throws, ThisOutput>(this);
    if (that.error) return that;

    const data: ThisOutput[] = [];
    let currentIndex = 0;

    const appender = (datum: Output) =>
      data.push(mapper(datum, currentIndex++));
    const resolver = () => data;

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public sort(sorter: Sorter<Output>) {
    const that = recastAccumulator<Output, Throws, Output>(this);

    const data: Output[] = [];

    const appender = (datum: Output) => data.push(datum);
    const resolver = () => data.sort(sorter);

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public filter(filterer: Filterer<Output>) {
    const that = recastAccumulator<Output, Throws, Output>(this);

    const data: Output[] = [];
    let currentIndex = 0;

    const appender = (datum: Output) => {
      if (filterer(datum, currentIndex++)) data.push(datum);
    };
    const resolver = () => data;

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  private appendFirstDatumAndHandleDefer(datum: Datum) {
    if (this.defer) {
      const fns = this.defer(datum);
      this.appender = fns.appender;
      this.resolver = fns.resolver;
      this.defer = undefined;
    } else {
      this.appender(datum);
    }
  }

  public append(data: Iterable<Datum>) {
    if (this.error) return this;

    const iterator = data[Symbol.iterator]();
    const first = iterator.next();

    if (first.done) return this;

    this.appendFirstDatumAndHandleDefer(first.value);

    for (let cur = iterator.next(); !cur.done; cur = iterator.next()) {
      this.appender(cur.value);
    }

    return this;
  }

  public result(): AccumulatorResult<Throws, Output> {
    const resolved = this.resolver();

    if (!this.throws && this.error)
      return this.error as AccumulatorResult<Throws, Output>;
    if (this.error)
      throw new Error(
        "Error set although errors expected to be thrown. This is a programming error. Original Error: " +
          this.error.message
      );

    const iterator: Iterable<Output> = {
      [Symbol.iterator]: () => {
        return resolved[Symbol.iterator]();
      },
    };

    return iterator;
  }

  public toArray(): ArrayResult<Throws, Output> {
    if (!this.throws && this.error)
      return this.error as ArrayResult<Throws, Output>;
    if (this.error)
      throw new Error(
        "Error set although errors expected to be thrown. This is a programming error. Original Error: " +
          this.error.message
      );

    return [...this.resolver()];
  }

  // This accumulator will only be iterable if Throws extends true.
  // If not, AccumulatorIterator's return type will be never.
  public [Symbol.iterator]() {
    return this.resolver()[Symbol.iterator]() as AccumulatorIterator<
      Throws,
      Datum
    >;
  }
}
