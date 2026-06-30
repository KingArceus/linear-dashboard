export function roundUpTo3Decimals(value: number): number {
  return Math.ceil(value * 1000) / 1000;
}

export function formatPercentileDays(value: number): string {
  return `${roundUpTo3Decimals(value).toFixed(3)} days`;
}
