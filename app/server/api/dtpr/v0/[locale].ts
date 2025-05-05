const fileName = (_id: any) => {
  return _id.split(":").pop();
}

export default defineEventHandler(async event => {
  const locale = event.context.params?.locale || 'en';

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
    
    return {
      id: s.id,
      icon: s.icon,
      headline,
      category: s.category,
      description: s.description || fallback?.description,
      title: s.name || fallback?.name,
    }
  });
});