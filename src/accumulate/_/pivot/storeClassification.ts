export function storeClassification<Classification>(
  classification: { key: string; classification?: Classification },
  classifications: Map<string, Classification>
) {
  if (
    !classifications.has(classification.key) &&
    classification.classification !== undefined
  )
    classifications.set(classification.key, classification.classification);
}
