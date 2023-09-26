import { AsyncAccumulator } from "./AsyncAccumulator";

export function accumulateAsync<Datum>(data?: Iterable<Datum>) {
  return new AsyncAccumulator(data ?? [], false);
}
