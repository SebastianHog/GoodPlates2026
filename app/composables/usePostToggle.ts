interface ToggleState {
  on: boolean;
  count: number;
}

// An on/off action on a post (like, bookmark). It updates right away, rolls back if the
// server says no, sends logged-out visitors to /login, and only the latest click's answer counts.
export function usePostToggle(
  kind: "like" | "bookmark",
  postId: () => string,
  initial: () => ToggleState,
  readResult: (result: Record<string, unknown>) => Partial<ToggleState>,
) {
  const { loggedIn } = useUserSession();
  const on = ref(initial().on);
  const count = ref(initial().count);

  watch(initial, (value) => {
    on.value = value.on;
    count.value = value.count;
  });

  let latest = 0;

  async function toggle() {
    if (!loggedIn.value) {
      await navigateTo("/login");
      return;
    }

    const next = !on.value;
    const before = { on: on.value, count: count.value };
    on.value = next;
    count.value += next ? 1 : -1;

    const request = ++latest;
    try {
      const result = await $fetch<Record<string, unknown>>(`/api/posts/${postId()}/${kind}`, {
        method: next ? "PUT" : "DELETE",
      });
      if (request === latest) {
        const { on: confirmed, count: confirmedCount } = readResult(result);
        if (confirmed !== undefined) on.value = confirmed;
        if (confirmedCount !== undefined) count.value = confirmedCount;
      }
    } catch {
      if (request === latest) {
        on.value = before.on;
        count.value = before.count;
      }
    }
  }

  return { on, count, toggle };
}
