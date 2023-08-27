import { Accumulator } from "../Accumulator";
import { Classifier } from "./Classifier";
import { PivotResult } from "./PivotResult";
import { getClassifications } from "./getClassifications";

// function getAccumulatorAndCurrentIndex<
//   Datum,
//   Throws extends boolean,
//   ReduceOutput
// >(
//   datum: Datum,
//   results: Map<string, Accumulator<Datum, Throws, ReduceOutput>>,
//   classification: { key: string },
//   initialValue: ReduceOutput | undefined
// ) {
//   const cur = results.get(classification.key);
//   if (!cur) {
//     // If initialValue is false, Datum must be of the same type as Result
//     // Per the call signatures of reduce()
//     if (initialValue === undefined) {
//       return { accumulator: datum as unknown as ReduceOutput, currentIndex: 1 };
//     } else {
//       return { accumulator: initialValue, currentIndex: 0 };
//     }
//   }
//   return {
//     accumulator: cur.result,
//     currentIndex: cur.currentIndex + 1,
//   };
// }

function storeClassification<Classification>(
  classification: { key: string; classification?: Classification },
  classifications: Map<string, Classification>
) {
  if (
    !classifications.has(classification.key) &&
    classification.classification !== undefined
  )
    classifications.set(classification.key, classification.classification);
}

export function getPivotFunctions<
  Datum,
  Throws extends boolean,
  ReduceOutput,
  Classification,
  ClassificationName extends string
>(
  classifier: Classifier<Datum, Classification>,
  classificationName: ClassificationName | undefined,
  makeAccumulator: () => Accumulator<Datum, boolean, ReduceOutput>,
  onError: (error: Error) => void
) {
  const accumulators = new Map<
    string,
    Accumulator<Datum, Throws, ReduceOutput>
  >();
  const classifications = new Map<string, Classification>();

  const appender = (datum: Datum) => {
    const classifierResult = classifier(datum);
    if (classifierResult instanceof Error) {
      onError(classifierResult);
      return;
    }

    for (const classification of getClassifications(classifierResult)) {
      storeClassification(classification, classifications);

      let acc = accumulators.get(classification.key);
      if (!acc) {
        acc = makeAccumulator();
        accumulators.set(classification.key, acc);
      }

      acc.append([datum]);
    }
  };

  const resolver = () => {
    const results = [];

    for (const [key, acc] of accumulators) {
      const result = acc.result();
      if (result instanceof Error) {
        onError(result);
        return [];
      }
      const [resultValue] = result;
      const classification = classifications.get(key);

      results.push({
        ...(classificationName ? { [classificationName]: key } : {}),
        ...classification,
        ...resultValue,
      } as PivotResult<ReduceOutput, Classification, ClassificationName>);
    }
    return results;
  };

  return { appender, resolver };
}

// export function getPivotFunctions<
//   Datum,
//   Throws extends boolean,
//   ReduceOutput,
//   Classification,
//   ClassificationName extends string = ""
// >(
//   classification: {
//     classifier: Classifier<Datum, Classification>;
//     classificationName?: ClassificationName;
//   },
//   reduction: {
//     reducer: Reducer<Datum, ReduceOutput>;
//     initialValue?: ReduceOutput;
//   },
//   throws: Throws,
//   onError: (error: Error) => void
// ) {
//   const { classifier, classificationName } = classification;
//   const { reducer, initialValue } = reduction;

//   const results = new Map<string, Accumulator<Datum, Throws, ReduceOutput>>();
//   const classifications = new Map<string, Classification>();

//   const appender = (datum: Datum) => {
//     const classifierResult = classifier(datum);
//     if (classifierResult instanceof Error) {
//       onError(classifierResult);
//       return;
//     }

//     for (const classification of getClassifications(classifierResult)) {
//       storeClassification(classification, classifications);

//       const { accumulator, currentIndex } = getAccumulatorAndCurrentIndex(
//         datum,
//         results,
//         classification,
//         initialValue
//       );

//       const result = reducer(accumulator, datum, currentIndex);
//       if (result instanceof Error) return result;

//       results.set(classification.key, { currentIndex, result });
//     }
//   };
// }

// for (const datum of data) {
//   const classifierResult = classifier(datum);
//   if (classifierResult instanceof Error) return classifierResult;

//   for (const classification of getClassifications(classifierResult)) {
//     storeClassification(classification, classifications);

//     const { accumulator, currentIndex } = getAccumulatorAndCurrentIndex(
//       datum,
//       results,
//       classification,
//       initialValue
//     );

//     const result = reducer(accumulator, datum, currentIndex);
//     if (result instanceof Error) return result;

//     results.set(classification.key, { currentIndex, result });
//   }
// }
// }
