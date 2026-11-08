// A deleted account comes back from the server without a handle (and "?" as its name), so show it as "Deleted user"
export function isDeletedAuthor(author: { hiddenName?: string }): boolean {
  return author.hiddenName === "";
}

export function useAuthorName() {
  const { t } = useI18n();
  return (author: Pick<IAuthor, "displayName"> & { hiddenName?: string }) =>
    isDeletedAuthor(author) ? t("site.deletedUser") : author.displayName;
}
