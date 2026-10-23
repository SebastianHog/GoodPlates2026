// An on/off action on a post (like, bookmark, cooked)
export function usePostToggle(
  kind: PostMark,
  postId: () => string,
  initial: () => ToggleResult,
) {
  return useToggle(kind, () => `/api/posts/${postId()}/${kind}`, initial);
}

// An on/off action saved with PUT (on) and DELETE (off) to `url`. It updates right away, rolls back and says so if the
// server says no, asks logged-out visitors to log in (and brings them back), and only the latest click's answer counts.
export function useToggle(
  kind: PostMark | "follow",
  url: () => string,
  initial: () => ToggleResult,
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
      const result = await $fetch<ToggleResult>(url(), {
        method: next ? "PUT" : "DELETE",
      });
      if (request === latest) {
        on.value = result.on;
        count.value = result.count;
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
