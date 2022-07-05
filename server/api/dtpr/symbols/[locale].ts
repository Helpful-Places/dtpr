export default defineEventHandler(async event => {
  const data = await $fetch('/api/_content/query', {
    method: 'GET'
  });

  const en = data.filter((s) => { 
    return s._id.includes(':en:') && s._id.includes(':symbols:')
  });

  const fr = data.filter((s) => { 
    return s._id.includes(':fr:') && s._id.includes(':symbols:')
  });

  const json = { en, fr }

  return json[event.context.params.locale].map((s) => {
    const id = s.id || json.en.find(sym => sym._id).id;
    const icon = s.icon || json.en.find(sym => sym._id).icon;
    
    return {
      id,
      icon,
      name: s.name,
      category: s.category,
      description: s.description
    }
  });
});