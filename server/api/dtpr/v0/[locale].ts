export default defineEventHandler(async event => {
  const locale = event.context.params.locale;
  const data = await $fetch('/api/_content/query', {
    method: 'GET'
  });

  const categories = {
    en: data.filter((s) => { 
      return s._id.includes(':en:') && s._id.includes(':categories:')
    }),
    fr: data.filter((s) => { 
      return s._id.includes(':fr:') && s._id.includes(':categories:')
    })
  }

  const json = { 
    en: data.filter((s) => { 
      return s._id.includes(':en:') && s._id.includes(':symbols:')
    }),
    fr: data.filter((s) => { 
      return s._id.includes(':fr:') && s._id.includes(':symbols:')
    })
  }



  return json[locale].map((s) => {
    const id = `${s.category}__${s.id || json.en.find(sym => sym._id).id}`;
    const icon = s.icon || json.en.find(sym => sym._id).icon;
    const headline = categories[locale].find(cat => cat.id === s.category).headline
    
    return {
      id,
      category: s.category,
      description: s.description,
      headline,
      icon,
      title: s.name,
    }
  });
});