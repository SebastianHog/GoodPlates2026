interface ToastAction {
  label: string;
  to: string;
}

interface Toast {
  id: number;
  message: string;
  // "error" when something failed, "info" for a nudge such as "log in to like"
  tone: "error" | "info";
  action?: ToastAction;
}

// One short message at a time, shown by <app-toast> in the layout. A new message replaces the old one.
export function useToast() {
  const toast = useState<Toast | null>("toast", () => null);

  function show(message: string, options: { tone?: Toast["tone"]; action?: ToastAction } = {}) {
    toast.value = { id: Date.now(), message, tone: options.tone ?? "error", action: options.action };
  }

  function dismiss() {
    toast.value = null;
  }

  return { toast, show, dismiss };
}
