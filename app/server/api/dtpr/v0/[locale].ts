const fileName = (_id: any) => {
  return _id.split(":").pop();
}

export default defineEventHandler(async event => {  
  const locale = event.context.params?.locale || 'en';

  const elements = await $fetch('/api/_content/query', {
    method: 'GET',
    query: {
      _params: {
        where: {
          _type: 'element',
          _locale: locale,
        }
      }
    }
  });

  const categories = await $fetch('/api/_content/query', {
    method: 'GET',
    query: {
      _params: {
        where: {
          _type: 'category',
          _locale: locale,
        }
      }
    }
  });

  const englishElements = await $fetch('/api/_content/query', {
    method: 'GET',
    query: {
      _params: {
        where: {
          _type: 'element',
          _locale: 'en',
        }
      }
    }
  });

  return elements.map((s) => {
    const fallback = englishElements.find(sym => fileName(sym._id) === fileName(s._id));
    
    let id = `${s.category}__${s.id || fallback.id}`;
    let icon = s.icon || fallback.icon;

    let headline = categories.find(cat => cat.id === s.category)?.headline
    
    return {
      id,
      icon,
      headline,
      category: s.category,
      description: s.description,
      title: s.name,
    }
  });
});