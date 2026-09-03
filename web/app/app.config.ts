export default defineAppConfig({
  ui: {
    pageHero: {  
      slots: {
        title: 'font-serif text-center italic font-semibold lg:text-5xl',
        description: 'font-sans text-center font-semibold lg:text-3xl',
        container: 'lg:px-30 h-100vh lg:py-5 md:py-1'
      },
      variants:{
        orientation:{
          horizontal:{
            title: 'lg:text-left',
            description: 'lg:text-left'
          }
        }
      }
    },
    pageSection:{
      slots:{
        title: 'font-sans lg:text-3xl text-center',
        container: 'lg:px-30'
      }
    },
    pageCard:{
      slots:{
        container:'shadow-lg',
        title:'font-sans text-3xl pb-5',
        description: 'font-sans text-default'
      },
    },
    page:{
      slots:{
        left:'lg:col-span-3 col-span-3',
        center: 'lg:col-span-7 col-span-7'
      }
    },
    contentNavigation:{
      slots:{
        linkTitle:'text-primary text-default font-sans '
      }
    }
  }
})