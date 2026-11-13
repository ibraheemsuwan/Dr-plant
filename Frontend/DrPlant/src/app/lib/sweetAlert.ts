import Swal from "sweetalert2";

export type AppAlertKind = "error" | "warning" | "success" | "info";

const appSwalTheme = {
  background: "var(--color-card)",
  color: "var(--color-foreground)",
  customClass: {
    popup: "rounded-3xl border border-border shadow-2xl",
    title: "text-xl font-semibold",
    actions: "flex gap-3",
    confirmButton:
      "rounded-full bg-primary px-6 py-2 text-primary-foreground font-semibold",
    cancelButton:
      "rounded-full border border-border bg-card px-6 py-2 font-semibold text-foreground",
    footer: "text-xs text-muted-foreground border-0 mt-1",
  },
  buttonsStyling: false,
} as const;

export async function showAppAlert(params: {
  language: "ar" | "en";
  kind: AppAlertKind;
  title: string;
  text: string;
  hint?: string;
}) {
  const { language, kind, title, text, hint } = params;
  await Swal.fire({
    icon: kind,
    title,
    text,
    footer: hint ? `<span>${hint}</span>` : undefined,
    confirmButtonText: language === "ar" ? "حسنًا" : "OK",
    ...appSwalTheme,
  });
}

/** SweetAlert confirm (Yes/No). Returns true if user confirmed. */
export async function showAppConfirm(params: {
  language: "ar" | "en";
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  const { language, title, text, confirmText, cancelText } = params;
  const r = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText:
      confirmText ?? (language === "ar" ? "تأكيد" : "Confirm"),
    cancelButtonText: cancelText ?? (language === "ar" ? "إلغاء" : "Cancel"),
    ...appSwalTheme,
  });
  return Boolean(r.isConfirmed);
}
