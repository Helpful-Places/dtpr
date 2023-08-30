const fileName = (_id: any) => {
  return _id.split(":").pop();
}

export default defineEventHandler(async event => {
  const locale = event.context.params.locale || 'en';
  const data = await $fetch('/api/_content/query', {
    method: 'GET'
  });

  const categories = {
    en: data.filter((s) => { 
      return s._id.includes(':en:') && s._id.includes(':categories:')
    }),
    fr: data.filter((s) => { 
      return s._id.includes(':fr:') && s._id.includes(':categories:')
    }),
    es:data.filter((s)=>{
      return s._id.includes(':es:') && 
    })

  }

  const json = { 
    en: data.filter((s) => { 
      return s._id.includes(':en:') && s._id.includes(':elements:')
    }),
    fr: data.filter((s) => { 
      return s._id.includes(':fr:') && s._id.includes(':elements:')
    })
  }

  return json[locale].map((s) => {
    const fallback = json.en.find(sym => fileName(sym._id) === fileName(s._id));
    
    let id = `${s.category}__${s.id || fallback.id}`;
    let icon = s.icon || fallback.icon;

    let headline = categories[locale].find(cat => cat.id === s.category)?.headline
    
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