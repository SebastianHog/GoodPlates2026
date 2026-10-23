// if user is logged in, sent to startpage
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();
  if (loggedIn.value) {
    return navigateTo("/");
  }
});
