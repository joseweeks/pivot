import { Classifier } from "./pivot/Classifier";
import { PivotResult } from "./pivot/PivotResult";
import { Reducer } from "./reduce/Reducer";
import { getPivotFunctions } from "./pivot/getPivotFunctions";
import { getReduceFunctionsWithInitialValue } from "./reduce/getReduceFunctionsWithInitialValue";
import { getReduceFunctionsWithoutInitialValue } from "./reduce/getReduceFunctionsWithoutInitialValue";

// We are currently re-casting the generic type parameters of "this" whenever
// we receive updated type information from calls. This is in place of the
// alternative, which is to create a new Accumulator with a copy of the old
// ones data.
//
// This is done because the other approach does nothing at runtime but has
// a runtime cost. This approach does nothing at runtime.
function recastAccumulator<Datum, Throws extends boolean, Output>(
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

// TODO flat, unflat, transpose, single

type Appender<Datum> = (datum: Datum) => void;
type Resolver<Output> = () => Iterable<Output>;
type Defer<Datum, Output> = (datum: Datum) => {
  appender: Appender<Datum>;
  resolver: Resolver<Output>;
};

export class Accumulator<Datum, Throws extends boolean, Output = Datum> {
  private appender: Appender<Datum>;
  private resolver: Resolver<Output>;
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

  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = ""
  >({
    classifier,
    classificationName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Datum, Classification>;
    classificationName?: ClassificationName;
    reducer: Reducer<Datum, ReduceOutput>;
    initialValue: ReduceOutput;
  }): Accumulator<
    Datum,
    Throws,
    PivotResult<ReduceOutput, Classification, ClassificationName>
  >;
  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = ""
  >({
    classifier,
    classificationName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Datum, Classification>;
    classificationName?: ClassificationName;
    reducer: Reducer<Datum, Datum>;
    initialValue?: undefined;
  }): Accumulator<
    Datum,
    Throws,
    PivotResult<Datum, Classification, ClassificationName>
  >;
  public pivot<
    ReduceOutput,
    Classification,
    ClassificationName extends string = ""
  >({
    classifier,
    classificationName,
    reducer,
    initialValue,
  }: {
    classifier: Classifier<Datum, Classification>;
    classificationName?: ClassificationName;
    reducer: Reducer<Datum, ReduceOutput>;
    initialValue?: ReduceOutput;
  }) {
    type PivotOutput = PivotResult<
      ReduceOutput,
      Classification,
      ClassificationName
    >;
    const that = recastAccumulator<Datum, Throws, PivotOutput>(this);
    if (that.error) return that;

    const makeAccumulator = () => {
      const accumulator = new Accumulator<Datum, Throws, ReduceOutput>(
        [],
        that.throws as Throws
      );

      if (initialValue) return accumulator.reduce(reducer, initialValue);
      // This cast is enforced by the overloads of this method
      return accumulator.reduce(reducer as unknown as Reducer<Datum, Datum>);
    };

    const onError = (err: Error) => {
      if (that.throws) throw Error;
      that.error = err;
    };

    const { appender, resolver } = getPivotFunctions(
      classifier,
      classificationName,
      makeAccumulator,
      onError
    );

    that.pipeAndUpdateCallbacks({ appender, resolver });

    return that;
  }

  public reduce<ThisOutput>(
    reducer: Reducer<Datum, ThisOutput>,
    initialValue: ThisOutput
  ): Accumulator<Datum, Throws, ThisOutput>;
  public reduce(reducer: Reducer<Datum, Datum>, initialValue?: undefined): this;
  public reduce<ThisOutput>(
    reducer: Reducer<Datum, ThisOutput>,
    initialValue?: ThisOutput
  ) {
    const that = recastAccumulator<Datum, Throws, ThisOutput>(this);
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

  // This accumulator will only be iterable if Throws extends true.
  // If not, AccumulatorIterator's return type will be never.
  public [Symbol.iterator]() {
    return this.resolver()[Symbol.iterator]() as AccumulatorIterator<
      Throws,
      Datum
    >;
  }
}
