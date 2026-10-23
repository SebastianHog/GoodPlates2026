interface ToggleState {
  on: boolean;
  count: number;
}

// An on/off action on a post (like, bookmark, cooked)
export function usePostToggle(
  kind: "like" | "bookmark" | "cook",
  postId: () => string,
  initial: () => ToggleState,
  readResult: (result: Record<string, unknown>) => Partial<ToggleState>,
) {
  return useToggle(kind, () => `/api/posts/${postId()}/${kind}`, initial, readResult);
}

// An on/off action saved with PUT (on) and DELETE (off) to `url`. It updates right away, rolls back and says so if the
// server says no, asks logged-out visitors to log in (and brings them back), and only the latest click's answer counts.
export function useToggle(
  kind: "like" | "bookmark" | "cook" | "follow",
  url: () => string,
  initial: () => ToggleState,
  readResult: (result: Record<string, unknown>) => Partial<ToggleState>,
) {
  const { loggedIn } = useUserSession();
  const route = useRoute();
  const { t } = useI18n();
  const { show: showToast } = useToast();
  const on = ref(initial().on);
  const count = ref(initial().count);

  watch(initial, (value) => {
    on.value = value.on;
    count.value = value.count;
  });

  let latest = 0;

  async function toggle() {
    if (!loggedIn.value) {
      const login = `/login?redirect=${encodeURIComponent(route.fullPath)}`;
      showToast(t(`toast.${kind}Login`), { tone: "info", action: { label: t("toast.logIn"), to: login } });
      return;
    }

    const next = !on.value;
    const before = { on: on.value, count: count.value };
    on.value = next;
    count.value += next ? 1 : -1;

    const request = ++latest;
    try {
      const result = await $fetch<Record<string, unknown>>(url(), {
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
        showToast(t(`toast.${kind}Failed`));
      }
    }
  }

  return { on, count, toggle };
}
