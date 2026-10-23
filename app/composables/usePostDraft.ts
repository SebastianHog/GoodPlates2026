// What a draft remembers; time stays "" while the field is empty
export interface PostDraftContent extends Omit<PostInput, "totalTimeMinutes"> {
  totalTime: number | "";
}

const STORAGE_KEY = "goodplates:draft";

// An unfinished new post, kept in this browser's localStorage so it survives leaving the page
export function usePostDraft() {
  const savedAt = ref<Date | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function read(): PostDraftContent | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw) as PostDraftContent & { savedAt: string };
      savedAt.value = new Date(draft.savedAt);
      return draft;
    } catch {
      return null;
    }
  }

  // Saves a moment after the last change instead of on every keystroke
  function saveSoon(content: () => PostDraftContent) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const now = new Date();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...content(), savedAt: now.toISOString() }));
        savedAt.value = now;
      } catch {
        // Private windows can block storage; the form still works without drafts
      }
    }, 800);
  }

  function clear() {
    clearTimeout(timer);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear
    }
    savedAt.value = null;
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return { savedAt, read, saveSoon, clear };
}
