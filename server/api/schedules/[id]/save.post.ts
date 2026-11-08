// Saves the user's own editable copy of someone else's public schedule; answers with the copy's id
export default defineEventHandler(async (event): Promise<{ id: string }> => {
  const { user } = await requireUserSession(event);
  const result = await saveScheduleCopy(getRouterParam(event, "id")!, user.id);
  if (typeof result === "string") throw scheduleProblemError(result);
  return result;
});
