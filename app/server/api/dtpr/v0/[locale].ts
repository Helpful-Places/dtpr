const fileName = (_id: any) => {
  return _id.split(":").pop();
}

export default defineEventHandler(async event => {
  const locale = event.context.params?.locale || 'en';

  // Get the base URL from environment variable or default to localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

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