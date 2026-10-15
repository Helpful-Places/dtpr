export default defineAppConfig({
  ui: {
    // Docs images are photographs and diagrams, not banners: keep them to a
    // readable height and centre them in the column.
    prose: {
      img: {
        slots: {
          base: 'mx-auto max-h-[36rem] rounded-md border border-rule'
        },
        // Nuxt UI stretches unsized images to the column; let them keep their ratio.
        variants: {
          width: { false: 'max-w-full w-auto' }
        }
      }
    },
    button: {
      slots: {
        base: 'rounded-sm font-bold'
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'hover:bg-secondary active:bg-secondary'
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'bg-white ring-rule hover:bg-primary-50 hover:text-secondary hover:ring-secondary active:bg-primary-50'
        }
      ]
    },
    pageHero: {
      slots: {
        title: 'font-serif text-left italic font-normal tracking-normal text-4xl sm:text-[2.75rem] lg:text-[2.75rem] leading-[48px] text-balance',
        description: 'font-sans text-left font-normal text-lg sm:text-lg lg:text-lg leading-[24px] max-w-3xl text-pretty',
        container: 'py-12 sm:py-12 lg:py-12 gap-12 sm:gap-y-12',
        footer: 'mt-12',
        links: 'justify-start',
        // The eyebrow is a label, on one 24px grid line above the headline.
        headline: 'mb-0 text-xs leading-[24px] uppercase tracking-wider'
      },
      // Heroes are left-aligned whatever their orientation.
      variants: {
        orientation: {
          vertical: { headline: 'justify-start', wrapper: 'text-left', links: 'justify-start' }
        }
      }
    },
    pageSection:{
      slots:{
        title: 'font-sans text-left font-semibold tracking-normal text-3xl sm:text-4xl lg:text-4xl text-balance',
        container: 'section-pad'
      }
    },
    pageCard:{
      slots:{
        root:'rounded-md shadow-sm',
        spotlight:'bg-white/90',
        container:'p-5 sm:p-6',
        title:'font-sans text-xl font-semibold text-balance pb-1',
        description: 'font-sans text-base text-default'
      },
      variants:{
        variant:{
          outline:{
            root:'bg-white ring-rule'
          }
        },
        highlight:{
          true:{
            root:'ring'
          }
        }
      }
    },
    page:{
      slots:{
        left:'lg:col-span-3 col-span-3',
        center: 'lg:col-span-7 col-span-7'
      }
    },
    contentNavigation:{
      slots:{
        trigger:'font-semibold text-highlighted',
        listWithChildren:'ms-2.5 border-s border-rule'
      }
    }
  }
})
