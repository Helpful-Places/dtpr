export default defineEventHandler(async event => {
  const data = await $fetch('/api/_content/query', {
    method: 'GET'
  });

  const en = data.filter((s) => { 
    return s._id.includes(':en:') && s._id.includes(':categories:')
  });

  const fr = data.filter((s) => { 
    return s._id.includes(':fr:') && s._id.includes(':categories:')
  });

  const json = { en, fr }

  return json[event.context.params.locale].map((s) => {
    const id = s.id || json.en.find(sym => sym._id).id;
    
    return {
      id,
      name: s.name,
      headline: s.headline
    }
  });
});