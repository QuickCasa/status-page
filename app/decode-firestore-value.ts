import { asObject } from '../shared/read-json.ts'
import type { JsonObject, JsonValue } from '../shared/types.ts'

/**
 * Unwraps a value from a Firestore REST API document into plain JSON,
 * recursively. The API wraps every value in an object naming its type, such
 * as { "stringValue": "Website" }. Integers arrive as strings, so the API can
 * carry 64 bit numbers, and become numbers again here, because every integer
 * in a status document is a count or a timestamp. Anything else reads as
 * null.
 *
 * @param {JsonValue | undefined} value The wrapped value.
 * @returns {JsonValue} Plain JSON.
 */
function decodeFirestoreValue(value: JsonValue | undefined): JsonValue {
  const wrapped = asObject(value)

  if (!wrapped) {
    return null
  }

  const {
    arrayValue,
    booleanValue,
    doubleValue,
    integerValue,
    mapValue,
    stringValue,
  } = wrapped

  if (typeof stringValue === 'string') {
    return stringValue
  }

  if (typeof integerValue === 'string') {
    return Number(integerValue)
  }

  if (typeof doubleValue === 'number') {
    return doubleValue
  }

  if (typeof booleanValue === 'boolean') {
    return booleanValue
  }

  if (mapValue !== undefined) {
    const decoded: JsonObject = {}
    const fields = asObject(asObject(mapValue)?.fields) ?? {}

    for (const [key, field] of Object.entries(fields)) {
      decoded[key] = decodeFirestoreValue(field)
    }

    return decoded
  }

  if (arrayValue !== undefined) {
    const values = asObject(arrayValue)?.values
    return Array.isArray(values)
      ? values.map(item => decodeFirestoreValue(item))
      : []
  }

  return null
}

export { decodeFirestoreValue }
