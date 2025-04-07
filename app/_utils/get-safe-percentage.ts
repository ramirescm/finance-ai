export function getSafePercentage(value: number | undefined | null): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }

  return value;
}
