import { Accumulator } from "./Accumulator";
import { getSyncPivotFunctions } from "./pivot";
import {
  getSyncReduceFunctionsWithInitialValue,
  getSyncReduceFunctionsWithoutInitialValue,
} from "./reduce";
import {
  AccumulatorIterator,
  AccumulatorResult,
  ArrayResult,
  Classifier,
  Filterer,
  Mapper,
  PivotResult,
  Reducer,
  Sorter,
} from "./types";

// We are currently re-casting the generic type parameters of "this" whenever
// we receive updated type information from calls. This is in place of the
// alternative, which is to create a new Accumulator with a copy of the old
// ones data.
//
// This is done because the other approach does nothing at runtime but has
// a runtime cost. This approach does nothing at runtime.
function recastAccumulator<
  Datum,
  Throws extends boolean,
  Async extends false,
  Output
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orig: SyncAccumulator<any, any, any, any>
) {
  return orig as SyncAccumulator<Datum, Throws, Async, Output>;
}

type Appender<Datum> = (datum: Datum) => void;
type Resolver<Output> = () => Iterable<Output>;
type Defer<Datum, Output> = (datum: Datum) => {
  appender: Appender<Datum>;
  resolver: Resolver<Output>;
};

// type UnArray<T> = T extends Array<infer U> ? U : T;
// type UnArrayOnly<T> = T extends Array<infer U> ? U : never;

export class SyncAccumulator<
  Datum,
  Throws extends boolean,
  Async extends false,
  Output
> implements Accumulator<Datum, Throws, Async, Output>
{
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

  /**
   * Create a new accumulator and feeds "data" into the accumulator pipeline. This data will
   * fed into the next TRANSFORM method that is called, or be returned by the next RESULTS
   * method that is called.
   *
   * It is acceptable for "data" to be an empty Iterable.
   *
   * If "throws" is true, the methods of this accumulator will
   * throw when an error is generated. If throws is false, the accumulator is guaranteed not
   * to throw (even if the callbacks passed in do throw). Instead, the accumulator will
   * return an Error object representing the error. This error object will be returned only
   * on a call to one of the results-bearing methods such as result() and toArray().
   *
   * A note on Error handling. If "throws" is false, the accumulator can not be treated
   * as an iterable value. The result() method's return value can be checked to see if it
   * is an error. If it is not an error, then it can be treated as iterable.
   */
  public constructor(data: Iterable<Datum>, throws: Throws) {
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
    classifier: Classifier<Output, Classification, Async>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, ReduceOutput, Async>;
    initialValue: ReduceOutput;
  }): SyncAccumulator<
    Output,
    Throws,
    Async,
    PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>
  >;
  public pivot<
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
    classifier: Classifier<Output, Classification, Async>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, Output, Async>;
    initialValue?: undefined;
  }): SyncAccumulator<
    Output,
    Throws,
    Async,
    PivotResult<Output, Classification, ClassificationName, ValueName>
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
    classifier: Classifier<Output, Classification, Async>;
    classificationName?: ClassificationName;
    valueName?: ValueName;
    reducer: Reducer<Output, ReduceOutput, Async>;
    initialValue?: ReduceOutput;
  }) {
    type PivotOutput = PivotResult<
      ReduceOutput,
      Classification,
      ClassificationName,
      ValueName
    >;

    const that = recastAccumulator<Output, Throws, Async, PivotOutput>(this);
    if (that.error) return that;

    const makeAccumulator = () => {
      const accumulator = new SyncAccumulator<Output, Throws, Async, Output>(
        [],
        that.throws as Throws
      );

      if (initialValue) return accumulator.reduce(reducer, initialValue);

      // Typecast enforced by method overload
      const reducerWithNoInitialValue = reducer as unknown as Reducer<
        Output,
        Output,
        Async
      >;

      // Typecast enforced by method overload
      const acc = accumulator.reduce(reducerWithNoInitialValue);
      // Typecast enforced by method overload
      return recastAccumulator<Output, Throws, Async, ReduceOutput>(acc);
    };

    const onError = (err: Error) => {
      if (that.throws) throw Error;
      that.error = err;
    };

    const { appender, resolver } = getSyncPivotFunctions(
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
    reducer: Reducer<Output, ThisOutput, Async>,
    initialValue: ThisOutput
  ): SyncAccumulator<Output, Throws, Async, ThisOutput>;
  public reduce(
    reducer: Reducer<Output, Output, Async>,
    initialValue?: undefined
  ): SyncAccumulator<Output, Throws, Async, Output>;
  public reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput, Async>,
    initialValue?: ThisOutput
  ) {
    const that = recastAccumulator<Output, Throws, Async, ThisOutput>(this);
    if (that.error) return that;

    const onError = (err: Error) => {
      if (that.throws) throw Error;
      that.error = err;
    };

    const callbacks =
      initialValue === undefined
        ? getSyncReduceFunctionsWithoutInitialValue(reducer, onError)
        : getSyncReduceFunctionsWithInitialValue(
            reducer,
            initialValue,
            onError
          );

    that.pipeAndUpdateCallbacks(callbacks);

    return that;
  }

  public map<ThisOutput>(mapper: Mapper<Output, ThisOutput, Async>) {
    const that = recastAccumulator<Output, Throws, Async, ThisOutput>(this);
    if (that.error) return that;

    const data: ThisOutput[] = [];
    let currentIndex = 0;

    const appender = (datum: Output) =>
      data.push(mapper(datum, currentIndex++));
    const resolver = () => data;

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public sort(sorter: Sorter<Output, Async>) {
    const that = recastAccumulator<Output, Throws, Async, Output>(this);

    const data: Output[] = [];

    const appender = (datum: Output) => data.push(datum);
    const resolver = () => data.sort(sorter);

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public filter(filterer: Filterer<Output, Async>) {
    const that = recastAccumulator<Output, Throws, Async, Output>(this);

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

  public result(): AccumulatorResult<Throws, Async, Output> {
    const resolved = this.resolver();

    if (!this.throws && this.error)
      return this.error as AccumulatorResult<Throws, Async, Output>;
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

    return iterator as AccumulatorResult<Throws, Async, Output>;
  }

  public toArray(): ArrayResult<Throws, Async, Output> {
    if (!this.throws && this.error)
      return this.error as ArrayResult<Throws, Async, Output>;
    if (this.error)
      throw new Error(
        "Error set although errors expected to be thrown. This is a programming error. Original Error: " +
          this.error.message
      );

    return [...this.resolver()] as ArrayResult<Throws, Async, Output>;
  }

  /**
   * This is a RESULT method and forms the end of the accumulator pipeline.
   *
   * If the "throws" parameter of the accumulator was specifed as true, this
   * method will return an Iterator representing the result of the final step in the
   * accumulator pipeline.
   *
   * If the "throws" parameter was false, this method does not meet the requirements of
   * the Iterable interface and can't be treated as iterable.
   */
  [Symbol.iterator](): AccumulatorIterator<Throws, Async, Datum>;

  public [Symbol.iterator]() {
    return this.resolver()[Symbol.iterator]() as AccumulatorIterator<
      Throws,
      Async,
      Datum
    >;
  }
}
