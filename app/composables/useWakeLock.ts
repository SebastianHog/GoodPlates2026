// Keeps the screen on while the page is open. The lock is lost when the tab is hidden, so ask again when it's back
export function useWakeLock() {
  let lock: WakeLockSentinel | null = null;

  async function request() {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    try {
      lock = await navigator.wakeLock.request("screen");
    } catch {}
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible" && (!lock || lock.released)) request();
  }

  onMounted(() => {
    request();
    document.addEventListener("visibilitychange", onVisibilityChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    lock?.release();
    lock = null;
  });
}
