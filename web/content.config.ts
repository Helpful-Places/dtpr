import { defineContentConfig, defineCollection, property } from '@nuxt/content'
import { z } from 'zod'


const contentCard=z.object({
  type:z.literal("card"),
  heading:z.string().optional(),
  body:z.string().optional(),
  link:z.string().optional()
})


const heroSection=z.object({
  type:z.literal('Hero'),
  heading:z.string(),
  subHeading:z.string().optional(),
  horizontal: z.boolean().default(true),
  image:property(z.string()).editor({input:'media'}),
  darkVariant:z.boolean().default(false),
})

const twoColumns=z.object({
  type:z.literal('Two Columns'),
  headingLeft:z.string().optional(),
  bodyLeft:z.string().optional(),
  headingRight:z.string().optional(),
  bodyRight:z.string().optional(),
  image: property(z.string()).editor({input:'media'}).optional(),
  cards: z.array(contentCard).optional(),
  hasButton:z.boolean().default(false),
  buttonText: z.string().optional(),
  buttonLink:z.string().optional(),
  isDark: z.boolean().default(false),
  
})

const centeredContent=z.object({
  type:z.literal("Centered Content"),
  heading:z.string().optional(),
  body:z.string().optional(),
  image:property(z.string()).editor({input:'media'}).optional(),
  cards:z.array(contentCard).optional(),
  isDark: z.boolean().default(false),
  hasButton:z.boolean().default(false),
  buttonText:z.string().optional(),
  buttonLink:z.string().optional()
});


const marqueeItem=z.object({
  type:z.literal('Marquee Item'),
  heading:z.string().optional(),
  subHeading: z.string().optional(),
  image:property(z.string()).editor({input:'media'})
})

const marquee=z.object({
  type:z.literal('Marquee'),
  heading: z.string(),
  elements: z.array(marqueeItem),
  isDark: z.boolean().default(false)
});

const visionSection=z.object({
  type:z.literal("Vision Section"),
  heading: z.string(),
  body: z.string().optional(),
  src: property(z.string()).editor({input:'media'}).optional(),
  component:z.enum([
    'Algorithm Header',
    'Canvas Card',
    'Chat Footer',
    'Decision Letter',
    'Document Mark',
    'DTPR Canvas',
    'Hiring Notice'
  ])
})


export const pageElements=z.discriminatedUnion('type', [
  heroSection,
  centeredContent,
  twoColumns,
  contentCard,
  marqueeItem,
  marquee,
  visionSection
])


export default defineContentConfig({
  collections: {

    navElements: defineCollection({
      type: 'data',
      source:'navElements.yaml',
      schema: z.object({
        dtprLogo: property(z.string()).editor({ input: 'media' }),
        hpLogo: property(z.string()).editor({input:'media'}),
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
        sections:z.array(pageElements)
      }),
    }),

    privacy:defineCollection({
      type:'page',
      source: 'privacy.md'
    }),

    getStarted: defineCollection({
      type:'page',
      source:{
        include: 'get-started/**/*.{md,vue}', 
        prefix:'/get-started/'
      },
      schema:z.object({
        title:z.string(),
        order:z.number().optional(),
        section:z.string().optional()
      })
    }),
    
    

   
  }


})
