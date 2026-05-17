const ALLOWED_ACTION_HOST = 'helpful-places.mailcoach.app';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, action, tags } = body;

  if (!email || !action) {
    throw createError({ statusCode: 400, statusMessage: 'Email and action are required' });
  }

  const { hostname } = new URL(action);
  if (hostname !== ALLOWED_ACTION_HOST) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action URL' });
  }

  const formData = new URLSearchParams();
  formData.append('email', email);
  if (tags) {
    formData.append('tags', tags);
  }

  await $fetch(action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  return { success: true };
});
