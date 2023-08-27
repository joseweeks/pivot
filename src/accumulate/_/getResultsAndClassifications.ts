export default "";
// import { Reducer } from "./Reducer";
// import { Classifier } from "./Classifier";
// import { getClassifications } from "./getClassifications";
// import { getAccumulatorAndCurrentIndex } from "./getAccumulatorAndCurrentIndex";

// export function getResultsAndClassifications<Datum, Classification, Result>(
//   data: Iterable<Datum>,
//   reducer: Reducer<Datum, Result> | undefined,
//   classifier: Classifier<Datum, Classification> | undefined,
//   initialValue: Result | undefined
// ) {
//   if (!reducer)
//     return new Error("Unable to get results without reducer function.");

//   const results = new Map<string, { currentIndex: number; result: Result }>();
//   const classifications = new Map<string, Classification>();

//   if (classifier) {
//     for (const datum of data) {
//       const classifierResult = classifier(datum);
//       if (classifierResult instanceof Error) return classifierResult;

//       for (const classification of getClassifications(classifierResult)) {
//         if (
//           !classifications.has(classification.key) &&
//           classification.classification !== undefined
//         )
//           classifications.set(
//             classification.key,
//             classification.classification
//           );

//         const { accumulator, currentIndex } = getAccumulatorAndCurrentIndex(
//           datum,
//           results,
//           classification,
//           initialValue
//         );

//         const result = reducer(accumulator, datum, currentIndex);
//         if (result instanceof Error) return result;

//         results.set(classification.key, { currentIndex, result });
//       }
//     }
//   }

//   return { results, classifications };
// }
