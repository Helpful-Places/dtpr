const ALLOWED_ACTION_HOST = 'helpful-places.mailcoach.app';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, action, tags } = body;

  if (!email || !action) {
    throw createError({ statusCode: 400, statusMessage: 'Email and action are required' });
  }

  let hostname: string;
  try {
    ({ hostname } = new URL(action));
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action URL' });
  }
  if (hostname !== ALLOWED_ACTION_HOST) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action URL' });
  }

  const formData = new URLSearchParams();
  formData.append('email', email);
  if (tags) {
    formData.append('tags', tags);
  }

  try {
    await $fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Subscription service unavailable' });
  }

  return { success: true };
});
