// Serves the archived Sidewalk Labs DTPR prototypes from one set of static
// assets (see scripts/build.sh). Each prototype keeps its own hostname and is
// served from that hostname's root, so its relative and root-relative paths
// behave exactly as they did when it was first published.
//
// Any other host (workers.dev, preview URLs, localhost) gets the landing page
// at / with each prototype under its own path.

const HOSTS = {
  "vision.dtpr.io": "/vision",
  "prototype.dtpr.io": "/interaction",
  "chatbot.dtpr.io": "/chatbot",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const prefix = HOSTS[url.hostname];
    if (!prefix) return env.ASSETS.fetch(request);

    url.pathname = prefix + url.pathname;
    const response = await env.ASSETS.fetch(new Request(url, request));

    // Asset handling redirects /x/index.html to /x/ and adds trailing slashes.
    // Its Location carries the internal prefix; strip it so the browser stays
    // on the prototype's own paths.
    const location = response.headers.get("Location");
    if (!location) return response;
    const target = new URL(location, url);
    if (target.pathname !== prefix && !target.pathname.startsWith(prefix + "/")) {
      return response;
    }
    target.pathname = target.pathname.slice(prefix.length) || "/";
    const headers = new Headers(response.headers);
    headers.set("Location", target.pathname + target.search + target.hash);
    return new Response(response.body, { status: response.status, headers });
  },
};
