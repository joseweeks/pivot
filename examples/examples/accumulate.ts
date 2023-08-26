export default "";
// import { accumulate } from "../../src/accumulate";
// import { makeExampleData } from "../../tests/util/makeExampleData";

// interface GenericAccumulator<Datum, Classification> {
//   classify(classifier: Classifier<Datum, Classification>): void;
// }

// class Accumulator<Datum, Classification> {
//   private data: Iterable<Datum>;
//   private classifier: Classifier<Datum, Classification>;

//   public constructor(
//     data: Iterable<Datum>,
//     classifier: Classifier<Datum, Classification>
//   ) {
//     this.data = data;
//     this.classifier = classifier;
//   }
// }
// export function showAccumulate() {
//   const data = makeExampleData(100_000);

//   const accumulated = accumulate(data)
//     .classify((d) => ({
//       key: `${d.firstName}:${d.color}`,
//       classification: {
//         firstName: d.firstName,
//         color: d.color,
//       },
//     }))
//     .reduce(
//       (result, datum) => ({
//         count: result.count + 1,
//         sum: result.sum + datum.index,
//         min: isNaN(result.min)
//           ? datum.index
//           : Math.min(result.min, datum.index),
//         max: isNaN(result.max)
//           ? datum.index
//           : Math.max(result.max, datum.index),
//       }),
//       { count: 0, sum: 0, min: NaN, max: NaN }
//     )
//     .join();

//   if (accumulated instanceof Error) throw accumulated;

//   console.table(accumulated);
// }
