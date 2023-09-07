import { AsyncAccumulator } from "./_private";

export function accumulateAsync<Datum>(data?: Iterable<Datum>) {
  return new AsyncAccumulator(data ?? [], false);
}
