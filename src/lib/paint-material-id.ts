/** Stable DOM / hash id for a paint color in materials lists. */
export function paintMaterialId(name: string): string {
  return `paint:${name.trim().toLowerCase()}`;
}
