export function wrapError(err: unknown) {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error();
}
