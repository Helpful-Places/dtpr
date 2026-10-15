// A link can open in the Developer view (`?dev=1`) or close it (`?dev=0`).
export default defineNuxtRouteMiddleware((to) => {
  if (to.query.dev === '1') useDeveloperView().value = true
  else if (to.query.dev === '0') useDeveloperView().value = false
})
