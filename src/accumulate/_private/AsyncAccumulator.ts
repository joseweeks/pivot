import { Accumulator } from "./Accumulator";
import { getAsyncPivotFunctions } from "./pivot";
import {
  getAsyncReduceFunctionsWithInitialValue,
  getAsyncReduceFunctionsWithoutInitialValue,
} from "./reduce";
import {
  AccumulatorResult,
  ArrayResult,
  Classifier,
  Filterer,
  Mapper,
  PivotResult,
  Reducer,
  Sorter,
} from "./types";
import { sleep } from "./util";

// We are currently re-casting the generic type parameters of "this" whenever
// we receive updated type information from calls. This is in place of the
// alternative, which is to create a new Accumulator with a copy of the old
// ones data.
//
// This is done because the other approach does nothing useful at runtime but has
// a runtime cost. This approach does nothing at all at runtime.
function recastAccumulator<
  Datum,
  Throws extends boolean,
  Async extends true,
  Output = Datum
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orig: AsyncAccumulator<any, any, any, any>
) {
  return orig as AsyncAccumulator<Datum, Throws, Async, Output>;
}

type Appender<Datum> = (datum: Datum) => void | Promise<void>;
type Resolver<Output> = () => Iterable<Output> | Promise<Iterable<Output>>;
type Defer<Datum, Output> = (datum: Datum) =>
  | {
      appender: Appender<Datum>;
      resolver: Resolver<Output>;
    }
  | Promise<{
      appender: Appender<Datum>;
      resolver: Resolver<Output>;
    }>;

const nop = () => {};

export class AsyncAccumulator<
  Datum,
  Throws extends boolean,
  Async extends true,
  Output = Datum
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

  private actions: (() => void | Promise<void>)[] = [];
  private processingActions = false;

  private getDefaultAppenderAndResolver(data: Iterable<Datum>) {
    const appended: Output[] = [];
    const appender = (datum: Datum) => {
      appended.push(datum as unknown as Output);
    };
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
   * If enableExceptions() has been called, the methods of this accumulator will
   * throw when an error is generated. If not, the accumulator is guaranteed not
   * to throw (even if the callbacks passed in do throw). Instead, the accumulator will
   * return an Error object representing the error. This error object will be returned only
   * on a call to one of the results-bearing methods such as result() and toArray().
   *
   * A note on Error handling. If exceptions have not been enabled, the accumulator itself
   * can not be treated as an iterable value. The result() method's return value
   * can be checked to see if it is an error. If it is not an error, then that result is
   * iterable.
   */
  public constructor(data: Iterable<Datum>, throws: Throws) {
    this.throws = throws;
    const { appender, resolver } = this.getDefaultAppenderAndResolver(data);
    this.appender = appender;
    this.resolver = resolver;
  }

  public enableExceptions(): Accumulator<Datum, true, Async, Output> {
    this.throws = true;
    return recastAccumulator<Datum, true, Async, Output>(this);
  }

  /**
   * Enqueue an action to be performed sequentially.
   *
   * *** THIS ACTION MUST NOT THROW ***
   */
  private enqueueAction(action: () => void | Promise<void>) {
    this.actions.push(action);
    if (this.processingActions) return;

    void this.executeActions();
  }

  private async executeActionsBlocking() {
    let timeout = 4;

    while (this.processingActions) {
      await sleep(timeout);
      timeout *= 2;
    }

    this.processingActions = true;

    while (this.actions.length > 0) {
      const fn = this.actions.shift();
      if (fn) await fn();
    }

    this.processingActions = false;
  }

  private async executeActions() {
    if (this.processingActions) return;

    this.processingActions = true;

    while (this.actions.length > 0) {
      const fn = this.actions.shift();
      if (fn) await fn();
    }

    this.processingActions = false;
  }

  /**
   * This method updates the defer, appender, and resolver callbacks, then
   * pipes the output of the old resolver to the new appender.
   *
   * Clears this.defer if it is not specified on this call.
   */
  private async pipeAndUpdateCallbacks({
    defer,
    appender,
    resolver,
  }: {
    defer?: Defer<Datum, Output>;
    appender?: Appender<Datum>;
    resolver?: Resolver<Output>;
  }) {
    this.defer = defer;

    const prev = (await this.resolver()) as unknown as Iterable<Datum>;

    if (appender) this.appender = appender;
    if (resolver) this.resolver = resolver;

    await this.appendAsync(prev);
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
  }): AsyncAccumulator<
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
  }): AsyncAccumulator<
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

    that.enqueueAction(async () => {
      const makeAccumulator = () => {
        const accumulator = new AsyncAccumulator<Output, Throws, Async, Output>(
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
        that.error = err;
        that.appender = () => {
          return;
        };
      };

      const { appender, resolver } = getAsyncPivotFunctions(
        classifier,
        classificationName,
        valueName,
        makeAccumulator,
        onError
      );

      await that.pipeAndUpdateCallbacks({ appender, resolver });
    });

    return that;
  }

  public reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput, Async>,
    initialValue: ThisOutput
  ): AsyncAccumulator<Output, Throws, Async, ThisOutput>;
  public reduce(
    reducer: Reducer<Output, Output, Async>,
    initialValue?: undefined
  ): AsyncAccumulator<Output, Throws, Async, Output>;
  public reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput, Async>,
    initialValue?: ThisOutput
  ) {
    const that = recastAccumulator<Output, Throws, Async, ThisOutput>(this);
    if (that.error) return that;

    that.enqueueAction(async () => {
      const onError = (err: Error) => {
        that.error = err;
        that.appender = nop;
      };

      const callbacks =
        initialValue === undefined
          ? getAsyncReduceFunctionsWithoutInitialValue(reducer, onError)
          : getAsyncReduceFunctionsWithInitialValue(
              reducer,
              initialValue,
              onError
            );
      await that.pipeAndUpdateCallbacks(callbacks);
    });

    return that;
  }

  public map<ThisOutput>(mapper: Mapper<Output, ThisOutput, Async>) {
    const that = recastAccumulator<Output, Throws, Async, ThisOutput>(this);
    if (that.error) return that;

    that.enqueueAction(async () => {
      const data: ThisOutput[] = [];
      let currentIndex = 0;

      const appender = async (datum: Output) => {
        const mapped = await mapper(datum, currentIndex++);
        data.push(mapped);
      };
      const resolver = () => data;

      await that.pipeAndUpdateCallbacks({ appender, resolver });
    });

    return that;
  }

  public sort(sorter: Sorter<Output, Async>) {
    const that = recastAccumulator<Output, Throws, Async, Output>(this);

    that.enqueueAction(async () => {
      const data: Output[] = [];

      // Simple insertion sort performed as items are added
      // This could be sped up with quicksort after a certain
      // number of elements.

      const appender = async (datum: Output) => {
        // First element added
        if (data.length === 0) {
          data.push(datum);
          return;
        }

        // Smaller than all elements, insert on far left
        const val = await sorter(datum, data[0]);
        if (val <= 0) {
          data.unshift(datum);
          return;
        }

        // Find first element larger than datum and insert to its left
        for (let i = 1; i < data.length; ++i) {
          const val = await sorter(datum, data[i]);
          if (val <= 0) {
            data.splice(i, 0, datum);
            return;
          }
        }

        // None larger found, insert at end
        data.push(datum);
      };
      const resolver = () => data;

      await that.pipeAndUpdateCallbacks({ appender, resolver });
    });

    return that;
  }

  public filter(filterer: Filterer<Output, Async>) {
    const that = recastAccumulator<Output, Throws, Async, Output>(this);

    that.enqueueAction(async () => {
      const data: Output[] = [];
      let currentIndex = 0;

      const appender = async (datum: Output) => {
        if (await filterer(datum, currentIndex++)) data.push(datum);
      };
      const resolver = () => data;

      await that.pipeAndUpdateCallbacks({ appender, resolver });
    });

    return that;
  }

  private async appendFirstDatumAndHandleDefer(datum: Datum) {
    if (this.defer) {
      const fns = await this.defer(datum);
      this.appender = fns.appender;
      this.resolver = fns.resolver;
      this.defer = undefined;
    } else {
      await this.appender(datum);
    }
  }

  private async appendAsync(data: Iterable<Datum>) {
    const iterator = data[Symbol.iterator]();
    const first = iterator.next();

    if (first.done) return;

    await this.appendFirstDatumAndHandleDefer(first.value);

    for (let cur = iterator.next(); !cur.done; cur = iterator.next())
      await this.appender(cur.value);
  }

  public append(data: Iterable<Datum>) {
    if (this.error) return this;

    this.enqueueAction(() => this.appendAsync(data));

    return this;
  }

  private async resultAsync() {
    await this.executeActionsBlocking();
    const result = await this.resolver();
    if (!this.throws && this.error)
      return this.error as AccumulatorResult<Throws, Async, Output>;
    if (this.error) throw this.error;

    return result;
  }

  private async toArrayAsync() {
    const result = await this.resultAsync();
    if (result instanceof Error) return result;

    // no-unsafe-any disagrees that this is redundant
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return [...(result as Iterable<Output>)];
  }

  public result() {
    return this.resultAsync() as AccumulatorResult<Throws, Async, Output>;
  }

  public toArray() {
    return this.toArrayAsync() as ArrayResult<Throws, Async, Output>;
  }
}
