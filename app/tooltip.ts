const EDGE_GAP = 12
const LIFT = 10

/**
 * One floating tooltip for every day on the page, moved to whichever day is
 * pointed at. A tooltip element for each day would be 90 more elements on
 * every row.
 *
 * @param {HTMLElement} root The part of the page with the days.
 * @param {HTMLElement} tooltip The tooltip element.
 */
function setUpTooltip(root: HTMLElement, tooltip: HTMLElement): void {
  const hide = (): void => {
    tooltip.hidden = true
  }

  root.addEventListener('mouseover', mouseEvent => {
    const { target } = mouseEvent

    if (!(target instanceof HTMLElement) || target.dataset.tip === undefined) {
      hide()
      return
    }

    const box = target.getBoundingClientRect()

    tooltip.textContent = target.dataset.tip
    tooltip.hidden = false

    const left = Math.min(
      window.innerWidth - tooltip.offsetWidth - EDGE_GAP,
      Math.max(EDGE_GAP, box.left + box.width / 2 - tooltip.offsetWidth / 2),
    )

    tooltip.style.left = `${String(left + window.scrollX)}px`
    tooltip.style.top = `${String(box.top + window.scrollY - tooltip.offsetHeight - LIFT)}px`
  })

  root.addEventListener('mouseleave', hide)
  window.addEventListener('scroll', hide, { passive: true })
}

export { setUpTooltip }
