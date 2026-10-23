// Grows (or shrinks) a textarea to fit its text, so long text never shows a scrollbar
export function fitToContent(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + 2}px`;
}
