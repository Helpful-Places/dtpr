// The dot grid's rows sit at 12px + 24n from the top of the page. This nudges
// marked elements down, by under one grid unit, onto a row:
//   data-dot-rule            a 2px rule, centred on the row
//   data-dot-snap="selector" a block whose matching descendant starts on the row
// The offset is handed to CSS as --dot-snap so each element decides how to
// apply it.
const UNIT = 24
const ROW = 12
const RULE = 2

export function useDotGridSnap() {
    onMounted(() => {
        const paper = document.querySelector<HTMLElement>('.graph-paper')
        const main = document.querySelector<HTMLElement>('main')
        if (!paper || !main) return

        function snap() {
            const marked = document.querySelectorAll<HTMLElement>('[data-dot-rule], [data-dot-snap]')
            marked.forEach(el => el.style.removeProperty('--dot-snap'))
            const origin = paper!.getBoundingClientRect().top
            // Top to bottom: moving one element moves every one under it.
            marked.forEach((el) => {
                const selector = el.dataset.dotSnap
                const target = selector ? el.querySelector<HTMLElement>(selector) : el
                if (!target) return
                const line = target.getBoundingClientRect().top - origin + (selector ? 0 : RULE / 2)
                const past = (((line - ROW) % UNIT) + UNIT) % UNIT
                if (past > 0.25) el.style.setProperty('--dot-snap', `${UNIT - past}px`)
            })
        }

        const observer = new ResizeObserver(snap)
        observer.observe(main)
        onBeforeUnmount(() => observer.disconnect())
    })
}
