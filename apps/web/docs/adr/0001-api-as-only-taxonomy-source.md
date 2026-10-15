# The DTPR API is the only taxonomy source, rendered by site-specific components

The taxonomy section reads every category, element, icon and translation from `api.dtpr.io` at request time through a cached server-side fetch, and renders it with components written in this repo. We chose this over depending on `@dtpr/ui` because the API is the part of DTPR that is kept current, the UI package may not be maintained, and a copied helper file in this repo had already drifted from the schema.

## Considered Options

- **Publish and depend on `@dtpr/ui`**: rejected because it adds a second thing that must track the schema, and its future is uncertain.
- **Vendor a copy of `@dtpr/ui`**: rejected because the earlier vendored `app/setup/dtpr.ts` drifted the same way.
- **Snapshot the taxonomy at build time**: rejected because beta schema versions change without a site deploy.

## Consequences

- No taxonomy text is stored or overridden in this repo. Weak category or element text is fixed in the schema.
- Anything the site needs that the API does not serve, such as translation status, is added to the API first.
- Datachain validation in the browser is a convenience; the API's validate endpoint is the authority.
