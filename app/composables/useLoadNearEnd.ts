// Infinite scroll for a list: calls `load` when the last item scrolls into view, then watches the new last item
// once more have loaded. `load` must ignore calls while it's busy or has nothing more.
export function useLoadNearEnd(
  list: () => Element | null | undefined,
  count: () => number,
  load: () => unknown,
) {
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load();
    });

    // Watch the last item again whenever posts are added or the list is replaced
    watch(
      [list, count],
      ([element]) => {
        observer!.disconnect();
        const last = element?.lastElementChild;
        if (last) observer!.observe(last);
      },
      { immediate: true, flush: "post" },
    );
  });

  onBeforeUnmount(() => observer?.disconnect());
}
