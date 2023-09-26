import { SyncAccumulator } from "./SyncAccumulator";

export function accumulate<Datum>(data?: Iterable<Datum>) {
  return new SyncAccumulator(data ?? [], false);
}
