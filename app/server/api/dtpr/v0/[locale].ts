const fileName = (_id: any) => {
  return _id.split(":").pop();
}

export default defineEventHandler(async event => {
  const locale = event.context.params?.locale || 'en';

  // Get the host from the request headers
  const host = getHeader(event, 'host');
  const protocol = getHeader(event, 'x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const elements = await queryCollection(event, 'v0_elements')
    .where('_locale', '=', locale)
    .all();
  const englishElements = await queryCollection(event, 'v0_elements')
    .where('_locale', '=', 'en')
    .all();
  const categories = await queryCollection(event, 'v0_categories')
    .all();

  return elements.map((s) => {
    const fallback = englishElements.find(en => en.id === s.id);
    const headline = categories.find(cat => cat.id === s.category)?.headline
    
    // Extract the filename from the full path
    const filename = s.id.split('/').pop()?.replace('.md', '') || s.id;
    
    // The filename already contains the category__element format
    // So we use it directly as the API id
    const apiId = filename;
    
    // Generate complete URL for icon
    const iconUrl = s.icon ? `${baseUrl}${s.icon}` : s.icon;
    
    return {
      id: apiId,
      icon: iconUrl,
      headline,
      category: s.category,
      description: s.description || fallback?.description,
      title: s.name || fallback?.name,
    }
  });
});