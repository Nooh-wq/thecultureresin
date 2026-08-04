/** OCEANIC to Oceanic, WALL_ART to Wall art. Enum values are not for reading. */
export function prettyEnum(v: string): string {
  return v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
