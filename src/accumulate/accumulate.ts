import { SyncAccumulator } from "./_private";

export function accumulate<Datum>(data?: Iterable<Datum>) {
  return new SyncAccumulator(data ?? [], false);
}
