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

export interface Accumulator<
  Datum,
  Throws extends boolean,
  Async extends boolean,
  Output = Datum
> {
  /**
   * If this method is not called, none of the accumulator methods will throw. If it is called, then
   * exceptions may be thrown as follows:
   *
   * 1) For synchronous code, exceptions may be thrown by any method of the accumulator. In most
   *    cases, this will happen at the time that the error was generated, halting further processing.
   * 2) For async code, exceptions will be captured at the point of the error and only thrown once
   *    a RESULT method is called.
   */
  enableExceptions(): Accumulator<Datum, true, Async, Output>;

  /**
   * This is a TRANSFORM method, forming a discrete step in the accumulator pipeline. Transforms
   * any existing data in the pipeline, as well as any further data added by append(), until
   * another TRANSFORM method is encountered or a RESULTS method is called.
   *
   * Pivot:
   *
   * As data is fed into the pivot, each datum is classified into one or more
   * classifications. Each classification corresponds to an indepedent reducer.
   * When the pivot is resolved, it produces an iterable list of objects
   * representing the outputs of each of these reducers. This output is constructed
   * with a final transform that combines the result of the reducer spread into an
   * object, along with other data as described below.
   *
   * Classification can be either a string value (which is treated as the key), or a
   * { key: string, classification: Classification } object. If the { classification: Classification }
   * is defined, then for each classification, this value is spread into each corresponding result object.
   *
   * If classificationName is specified, then { [classificationName]: key } is included in each applicable
   * result object.
   *
   * If valueName is specified, the entire currentValue object is included in the applicable result
   * object as { [valueName]: currentValue }.
   */
  pivot<
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
  }): Accumulator<
    Output,
    Throws,
    Async,
    PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>
  >;
  pivot<
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
    reducer: Reducer<Output, Output, Async>;
    initialValue?: undefined;
  }): Accumulator<
    Output,
    Throws,
    Async,
    PivotResult<ReduceOutput, Classification, ClassificationName, ValueName>
  >;

  /**
   * This is a TRANSFORM method, forming a discrete step in the accumulator pipeline. Transforms
   * any existing data in the pipeline, as well as any further data added by append(), until
   * another TRANSFORM method is encountered or a RESULTS method is called.
   *
   * Reduce:
   *
   * Perform a reduce that is the functional equivalent of Array.reduce.
   */
  reduce<ThisOutput>(
    reducer: Reducer<Output, ThisOutput, Async>,
    initialValue: ThisOutput
  ): Accumulator<Output, Throws, Async, ThisOutput>;
  reduce(
    reducer: Reducer<Output, Output, Async>,
    initialValue?: undefined
  ): Accumulator<Output, Throws, Async, Output>;

  /**
   * This is a TRANSFORM method, forming a discrete step in the accumulator pipeline. Transforms
   * any existing data in the pipeline, as well as any further data added by append(), until
   * another TRANSFORM method is encountered or a RESULTS method is called.
   *
   * Reduce:
   *
   * Perform a mapping that is the functional equivalent of Array.map.
   */
  map<ThisOutput>(
    mapper: Mapper<Output, ThisOutput, Async>
  ): Accumulator<Output, Throws, Async, ThisOutput>;

  /**
   * This is a TRANSFORM method, forming a discrete step in the accumulator pipeline. Transforms
   * any existing data in the pipeline, as well as any further data added by append(), until
   * another TRANSFORM method is encountered or a RESULTS method is called.
   *
   * Reduce:
   *
   * Perform a sort that is the functional equivalent of Array.sort.
   */
  sort(
    sorter: Sorter<Output, Async>
  ): Accumulator<Output, Throws, Async, Output>;

  /**
   * This is a TRANSFORM method, forming a discrete step in the accumulator pipeline. Transforms
   * any existing data in the pipeline, as well as any further data added by append(), until
   * another TRANSFORM method is encountered or a RESULTS method is called.
   *
   * Reduce:
   *
   * Perform a filter that is the functional equivalent of Array.filter.
   */
  filter(
    filterer: Filterer<Output, Async>
  ): Accumulator<Output, Throws, Async, Output>;

  /**
   * Appends an additional Iterable to the input side of the
   * accumulator pipeline. This data is fed into the current TRANSFORM method. This allows
   * data to be continually fed into the accumulator as it becomes available.
   *
   * @example
   *
   *   // The following two statements produce the same result.
   *
   *   // Specify data in constructor
   *   const result1 = new Accumulator([1,2,3]).map(a => a + 1).result();
   *
   *   // Append data after construction
   *   const result2 = new Accumulator([] as number[]).append([1,2,3]).map(a => a + 1).result();
   */
  append(data: Iterable<Datum>): this;

  /**
   * This is a RESULT method and forms the end of the accumulator pipeline.
   *
   * Returns an Iterable representing the result of the final step in the
   * accumulator pipeline.
   */
  result(): AccumulatorResult<Throws, Async, Output>;

  /**
   * This is a RESULT method and forms the end of the accumulator pipeline.
   *
   * Returns an Array of type Output[] representing the result of the final step in the
   * accumulator pipeline.
   */
  toArray(): ArrayResult<Throws, Async, Output>;

  // [Symbol.asyncIterator](): AccumulatorAsyncIterator<Throws, Async, Datum>;
}
