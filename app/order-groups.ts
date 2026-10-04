/**
 * Puts groups in display order: the order the config lists them in, then any
 * others in alphabetical order.
 *
 * @param {readonly string[]} present The groups that have targets.
 * @param {readonly string[]} preferred The config's order.
 * @returns {string[]} The groups, in order.
 */
function orderGroups(
  present: readonly string[],
  preferred: readonly string[],
): string[] {
  const unique = [...new Set(present)]
  const listed = preferred.filter(group => unique.includes(group))
  const others = unique
    .filter(group => !preferred.includes(group))
    .toSorted((first, second) => first.localeCompare(second))

  return [...new Set([...listed, ...others])]
}

export { orderGroups }
