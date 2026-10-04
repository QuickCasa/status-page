/**
 * The UTC day a moment falls on. History is kept by UTC day so the monitor
 * and every viewer, in any time zone, agree on which day a check belongs to.
 *
 * @param {number} timestamp The moment, in milliseconds since 1970.
 * @returns {string} The day, as YYYY-MM-DD.
 */
function toDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export { toDayKey }
