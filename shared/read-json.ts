import type { JsonObject, JsonValue } from './types.ts'

/**
 * Narrows a JSON value to an object.
 *
 * @param {JsonValue | undefined} value The value.
 * @returns {JsonObject | undefined} The object, or undefined when the value isn't one.
 */
function asObject(value: JsonValue | undefined): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : undefined
}

/**
 * Reads a string field.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @returns {string} The value, or an empty string when it isn't a string.
 */
function readString(source: JsonObject, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Reads a number field.
 *
 * @param {JsonObject} source The object to read from.
 * @param {string} key The field.
 * @returns {number} The value, or 0 when it isn't a finite number.
 */
function readNumber(source: JsonObject, key: string): number {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export { asObject, readNumber, readString }
