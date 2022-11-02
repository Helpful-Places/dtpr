# Vision Microsite

Microsite giving 

## Build

This microsite builds to static HTML using Webpack. It is deployed in the `/public` folder of the Nuxt app in this repo at `/app`.

To build the site, in this folder run:

`yarn build`

This will package the site in `/app/public/vision`. Note that the build process does not package necessary assets, thus the directories `/app/public/vision/images` and `/app/public/vision/dtrp_icons` have to be manually updated.