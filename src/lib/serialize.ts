// Utility to serialize data containing BigInt and Decimal values for JSON

// Recursively convert Prisma Decimal and BigInt values in an object tree
function convertValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(convertValue)
  if (typeof value === 'object') {
    // Check for Prisma Decimal - has s, e, d properties and toJSON method
    const obj = value as Record<string, unknown>
    if (
      's' in obj &&
      'e' in obj &&
      'd' in obj &&
      Array.isArray(obj.d) &&
      typeof (obj as { toJSON?: unknown }).toJSON === 'function'
    ) {
      return Number(obj.toString())
    }
    // Regular object - recursively convert
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) {
      result[key] = convertValue(val)
    }
    return result
  }
  return value
}

export function serializeData<T>(data: T): T {
  return convertValue(data) as T
}
