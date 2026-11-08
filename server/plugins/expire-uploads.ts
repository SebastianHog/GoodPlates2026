// Every hour, delete photos that were uploaded more than 12 hours ago but never published
const HOUR = 60 * 60 * 1000;

export default defineNitroPlugin((nitroApp) => {
  async function run() {
    try {
      await deleteExpiredUploads();
    } catch (error) {
      console.error("Could not delete expired uploads", error);
    }
  }

  // Soon after starting too, so restarts don't keep pushing the cleanup back
  const first = setTimeout(run, 60 * 1000);
  const timer = setInterval(run, HOUR);

  nitroApp.hooks.hook("close", () => {
    clearTimeout(first);
    clearInterval(timer);
  });
});
