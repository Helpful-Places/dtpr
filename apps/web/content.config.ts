import { defineContentConfig, defineCollection, property } from '@nuxt/content'
import { z } from 'zod'


export const elementTypes = [
  'Hero',
  'Two Columns',
  'Centered Content',
  'Marquee',
  'Vision Section',
  'Deployments Explorer',
  'Community Tracks',
  'Ways In',
  'Audiences',
  'Newsletter',
  'Split Content',
  'Media Cards',
  'Contact',
  'Datachain Rows',
  'Icon Anatomy',
  'Question List',
  'Example List'
] as const
 
export type ElementType = (typeof elementTypes)[number]

const contentCard=z.object({
  type:z.literal("card"),
  heading:z.string().optional(),
  subHeading: property(z.string().optional()).editor({ input: 'textarea' }),
  link:z.string().optional(),
  icon: property(z.string().optional()).editor({
    label:"Icon",
    description:"For Ways In and Audiences sections, one of: users, landmark, pencil-ruler, signpost, code-xml, book-open, list-tree, shapes"
  }),
  linkText: property(z.string().optional()).editor({
    label:"Link Text",
    description:"For Ways In and Media Cards sections, the label on the card's button"
  }),
  image: property(z.string().optional()).editor({
    input: 'media',
    description:"For Media Cards sections, the picture at the top of the card. For Example List sections, the example shown for this option"
  }),
  imageAlt: z.string().optional(),
  caption: property(z.string().optional()).editor({
    label:"Example Caption",
    description:"For Example List sections, the line under the example, e.g. 'Long Beach's Digital Rights Platform'"
  }),
  captionLink: property(z.string().optional()).editor({
    label:"Example Link",
    description:"For Example List sections, where the caption links to, such as the deployment's site"
  }),
  imageFit: property(z.string().optional()).editor({
    label:"Image Fit",
    description:"For Media Cards sections: 'cover' fills the frame (photos), 'contain' fits the whole image on white (logos)"
  })
})

const marqueeItem=z.object({
  type:z.literal('Marquee Item'),
  heading:z.string().optional(),
  subHeading: z.string().optional(),
  image:property(z.string()).editor({input:'media'})
})

const longText = property(z.string()).editor({ input: 'textarea' })

// Fields every home.yaml section shares
const homeSection = z.object({
  heading: z.string(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
})

export const pageElements=z.object({
  type: property(z.enum(elementTypes)).editor({
    label:"Element Type",
    description: "Which Element Type This Will Display As"
  }),

  eyebrow: property(z.string().optional()).editor({
    label:"Eyebrow",
    description:"For Hero sections, a short label above the heading, e.g. 'Getting started'"
  }),
  heading:z.string().optional(),
  anchor: property(z.string().optional()).editor({
    label:"Anchor",
    description:"Lets other pages link straight to this section, e.g. 'ways-to-deploy' makes /get-started#ways-to-deploy. Lowercase words and hyphens"
  }),
  subHeading: property(z.string()).editor({ input: 'textarea' }),
  body: property(z.string().optional()).editor({
    label:"Body",
    input:'textarea',
    description:"For Datachain Rows, Icon Anatomy and Question List sections, running text in markdown"
  }),
  // isDark: z.boolean().default(false),
  image: property(z.string().optional()).editor({ input: 'media' }),
  imageAlt: property(z.string().optional()).editor({
    label:"Image Alt Text",
    description: "Describes the image for screen readers and search engines. Leave empty if the image is decorative"
  }),
  body: property(z.string().optional()).editor({
    label:"Body",
    input:'textarea',
    description:"For Split Content sections, the text beside the image. Supports bold and blank-line paragraph breaks. For Newsletter sections, the text above the email field"
  }),
  caption: property(z.string().optional()).editor({
    label:"Image Caption",
    description:"For Split Content sections, a line under the image"
  }),
  headingRight: property(z.string().optional()).editor({
    label:"Right Heading",
    description: "For Two Columns sections , the right most heading"
  }),
  bodyRight: property(z.string().optional()).editor({
    label:"Right Body",
    input:'textarea',
    description:"For Two Columns sections, the right most body content"
  }),
  orientation: property(z.string().default('horizontal')).editor({
  label:"Element Orientation",
  description:"Accepts 'horizontal' or 'vertical'"
}),
  cards: property(z.array(contentCard).optional()).editor({
    label:"Cards",
    description: "For Two Columns, Centered Content, Ways In, Audiences or Example List sections, you can add element cards here"
  }),
  hasButton: z.boolean().default(false),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  secondaryButtonText: property(z.string().optional()).editor({
    label:"Second Button Text",
    description:"For Hero, Datachain Rows, Icon Anatomy and Question List sections, an optional second button shown beside the first"
  }),
  secondaryButtonLink: z.string().optional(),
  steward: property(z.boolean().optional()).editor({
    label:"Steward line",
    description:"For Hero sections, shows 'An open standard stewarded by Helpful Places' under the buttons"
  }),
  animatedLayers: property(z.boolean().optional()).editor({
    label:"Animated City Layers",
    description:"For Hero sections, shows the animated city layers in place of an image. Image Alt describes it to screen readers"
  }),
  marqueeElements: property(z.array(marqueeItem).optional()).editor({
    label:"Marquee Items",
    description:"For Marquee sections, add individual marquee items"
  }),
  visionComponent: property(z.enum([
    'Algorithm Header',
    'Canvas Card',
    'Chat Footer',
    'Decision Letter',
    'Document Mark',
    'DTPR Canvas',
    'Hiring Notice'
  ]).optional()).editor({
    label:"Vision Components",
    description:"Prototypes to be used in the DTPR Vision Section"
  }),
  src: property(z.string().optional()).editor({
    input:'media',
    label: "Prototype Source",
    description: "For prototype's that require source data such as a datachain json file"
  }),
  datachains: property(z.array(z.object({
    src: property(z.string()).editor({
      input:'media',
      label:"Datachain File",
      description:"Path of a datachain in public/data, e.g. /data/nypd-facial-recognition.datachain.json"
    }),
    label: z.string(),
  })).optional()).editor({
    label:"Datachains",
    description:"For Datachain Rows sections, the two systems shown side by side"
  }),
  categories: property(z.array(z.string()).optional()).editor({
    label:"Category Ids",
    description:"For Datachain Rows sections, the categories to show, by API id, e.g. purpose, accountable, affected"
  }),
  elementId: property(z.string().optional()).editor({
    label:"Element Id",
    description:"For Icon Anatomy sections, the element whose icon is taken apart, by API id, e.g. input_about_behaviour"
  }),
  schemaVersion: property(z.string().optional()).editor({
    label:"Schema Version",
    description:"For Icon Anatomy sections, the schema version to read the element from. Leave empty for the current one"
  }),
  items: property(z.array(z.string()).optional()).editor({
    label:"Items",
    description:"For Question List sections, the questions in order"
  }),

  

})


// const heroSection=z.object({
//   type:z.literal('Hero'),
//   heading:z.string(),
//   subHeading: property(z.string().optional()).editor({ input: 'textarea' })
//   horizontal: z.boolean().default(true),
//   image:property(z.string()).editor({input:'media'}),
//   darkVariant:z.boolean().default(false),
// })

// const twoColumns=z.object({
//   type:z.literal('Two Columns'),
//   headingLeft:z.string().optional(),
//   bodyLeft:z.string().optional(),
//   headingRight:z.string().optional(),
//   bodyRight:z.string().optional(),
//   image: property(z.string()).editor({input:'media'}).optional(),
//   cards: z.array(contentCard).optional(),
//   hasButton:z.boolean().default(false),
//   buttonText: z.string().optional(),
//   buttonLink:z.string().optional(),
//   isDark: z.boolean().default(false),
  
// })

// const centeredContent=z.object({
//   type:z.literal("Centered Content"),
//   heading:z.string().optional(),
//   subHeading: property(z.string().optional()).editor({ input: 'textarea' })
//   image:property(z.string()).editor({input:'media'}).optional(),
//   cards:z.array(contentCard).optional(),
//   isDark: z.boolean().default(false),
//   hasButton:z.boolean().default(false),
//   buttonText:z.string().optional(),
//   buttonLink:z.string().optional()
// });




// const marquee=z.object({
//   type:z.literal('Marquee'),
//   heading: z.string(),
//   elements: z.array(marqueeItem),
//   isDark: z.boolean().default(false)
// });

// const visionSection=z.object({
//   type:z.literal("Vision Section"),
//   heading: z.string(),
//   subHeading: z.string().optional(),
//   src: property(z.string()).editor({input:'media'}).optional(),
//   component:z.enum([
//     'Algorithm Header',
//     'Canvas Card',
//     'Chat Footer',
//     'Decision Letter',
//     'Document Mark',
//     'DTPR Canvas',
//     'Hiring Notice'
//   ])
// })


// export const pageElements=z.discriminatedUnion('type', [
 
//   centeredContent,
//   heroSection,
//   twoColumns,
//   contentCard,
//   marqueeItem,
//   marquee,
//   visionSection
// ])






export default defineContentConfig({
  collections: {

    navElements: defineCollection({
      type: 'data',
      source:'navElements.yaml',
      schema: z.object({
        dtprLogo: property(z.string()).editor({ input: 'media' }),
        hpLogo: property(z.string()).editor({input:'media'}),
        docs: property(z.object({
          label: z.string(),
          addText: z.string().optional(),
          url: z.string(),
          sections: z.array(z.object({
            label: z.string(),
            addText: z.string().optional(),
            url: z.string(),
            icon: z.string().optional()
          })).optional()
        }).optional()).editor({
          label: "Docs button",
          description: "The button at the top right of every page that leads to the docs. Sections fill its dropdown; an icon is a Lucide name such as signpost."
        }),
        links: z.array(z.object({
          label:z.string(),
          addText:z.string(),
          url:z.string()
        }))
      }),
    }),


    pages:defineCollection({
      type:'page',
      source:{
        include: 'pages/*.yaml',
        prefix: '/'
      },
      schema:z.object({
        title:z.string(),
        description: property(z.string().optional()).editor({
          input:'textarea',
          description: "Shown in search results and link previews. Aim for under 160 characters"
        }),
        sections:z.array(pageElements)
      }),
    }),

    // Copy for the home page's Community Tracks and Deployments Explorer sections
    home: defineCollection({
      type: 'data',
      source: 'home.yaml',
      schema: z.object({
        footprint: homeSection.extend({ subHeading: longText }),
        engage: homeSection.extend({
          subHeading: property(z.string().optional()).editor({ input: 'textarea' }),
          image: property(z.string()).editor({ input: 'media' }),
          imageAlt: z.string().optional(),
          captionHeading: z.string(),
          captionBody: longText,
          tracks: z.array(z.object({
            heading: z.string(),
            body: longText,
            linkText: property(z.string()).editor({
              label: "Learn Link Text",
              description: "Where this persona starts, usually a section of Get Started"
            }),
            link: z.string(),
            involveText: property(z.string().optional()).editor({
              label: "Get Involved Link Text",
              description: "How this persona can take part: the newsletter, GitHub, email or the Get Involved page"
            }),
            involveLink: z.string().optional(),
          })),
          allText: z.string(),
          allLink: z.string(),
        }),
      }),
    }),

    privacy:defineCollection({
      type:'page',
      source: 'privacy.md'
    }),

    // Deployments, awards, press and reports power the DTPR In The World page.
    // Press, reports and awards link to deployments by file name (e.g. "sopa").
    deployments: defineCollection({
      type: 'data',
      source: 'deployments/**',
      schema: z.object({
        name: z.string(),
        description: z.string().optional(),
        city: z.string(),
        mapLabel: z.string().optional(),
        country: z.string(),
        flag: z.string().optional(),
        url: z.string().optional(),
        logoPath: property(z.string().default('/svgs/dtpr.svg')).editor({ input: 'media' }),
        featured: z.boolean().default(false),
        hidden: z.boolean().default(false),
        pressReleaseUrl: z.string().optional(),
        projectWebsiteUrl: z.string().optional(),
        caseStudyUrl: z.string().optional(),
        deviceCount: z.number().int().optional(),
        algorithmCount: z.number().int().optional(),
        latitude: z.number(),
        longitude: z.number(),
      }),
    }),

    awards: defineCollection({
      type: 'data',
      source: 'awards/**',
      schema: z.object({
        title: z.string(),
        organization: z.string(),
        year: z.number().int(),
        description: z.string(),
        url: z.string().optional(),
        imagePath: property(z.string()).editor({ input: 'media' }),
        featured: z.boolean().default(false),
        deployments: z.array(z.string()).default([]),
      }),
    }),

    press: defineCollection({
      type: 'page',
      source: 'press/**',
      schema: z.object({
        title: z.string(),
        publication: z.string(),
        publishedAt: z.string(),
        url: z.string(),
        imageUrl: property(z.string().optional()).editor({ input: 'media' }),
        featured: z.boolean().default(false),
        deployments: z.array(z.string()).default([]),
      }),
    }),

    reports: defineCollection({
      type: 'page',
      source: 'reports/**',
      schema: z.object({
        title: z.string(),
        author: z.string().optional(),
        organization: z.string().optional(),
        publishedAt: z.string(),
        url: z.string().optional(),
        pdfUrl: z.string().optional(),
        imageUrl: property(z.string().optional()).editor({ input: 'media' }),
        featured: z.boolean().default(false),
        deployments: z.array(z.string()).default([]),
      }),
    }),

    // The taxonomy itself comes from the DTPR API. This holds the copy around it:
    // the intro on /taxonomy and the concepts page.
    taxonomy: defineCollection({
      type: 'page',
      source: {
        include: 'taxonomy/*.md',
        prefix: '/taxonomy'
      },
      schema: z.object({
        title: z.string(),
        heading: property(z.string().optional()).editor({
          label: "Hero heading",
          description: "The sentence in the hero. The title stays the page name, shown as the eyebrow"
        }),
        description: property(z.string().optional()).editor({ input: 'textarea' })
      })
    }),

    // Deployer and developer docs, plus the Concepts page both trees share.
    // Filename prefixes set the order.
    docs: defineCollection({
      type:'page',
      source:{
        include: 'docs/**/*.{md,yml}',
        prefix:'/docs'
      },
      schema:z.object({
        title:z.string(),
        description:z.string().optional()
      })
    }),
    
    

   
  }


})
