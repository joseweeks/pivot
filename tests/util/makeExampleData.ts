const colors = ["red", "green", "blue", "yellow", "brown", "orange", "purple"];
const firstNames = [
  "Maria",
  "Nushi",
  "Mohammed",
  "Jose",
  "Wei",
  "Ahmed",
  "Yan",
  "Ali",
  "John",
  "David",
];
const lastNames = [
  "Wang",
  "Li",
  "Zhang",
  "Chen",
  "Liu",
  "Devi",
  "Yang",
  "Huang",
  "Singh",
];

export function makeExampleData(records: number) {
  return [...Array(records).keys()].map((i) => ({
    color: colors[i % colors.length],
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    index: i,
    mod: [
      NaN,
      i % 1,
      i % 2,
      i % 3,
      i % 4,
      i % 5,
      i % 6,
      i % 7,
      i % 8,
      i % 9,
    ] as const,
  }));
}
