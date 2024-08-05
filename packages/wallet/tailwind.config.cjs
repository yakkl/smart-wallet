/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')
// const colors = require('tailwindcss/colors')

// test
// function withOpacityValue(variable) {
//   return ({ opacityValue }) => {
//     if (opacityValue === undefined) {
//       return `rgb(var(${variable}))`
//     }
//     return `rgb(var(${variable}) / ${opacityValue})`
//   }
// }

module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts,css}', 
    // './node_modules/tw-elements/dist/js/**/*.js',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  theme: {   
    screens: {
      'xs': '391px',
      ...defaultTheme.screens
    },
    extend: {
      zIndex: {
        '100': '100'
      },
      dropShadow: {
        '3xl': '0 35px 35px rgba(0, 0, 0, 0.25)',
        '4xl': [
            '0 35px 35px rgba(0, 0, 0, 0.25)',
            '0 45px 65px rgba(0, 0, 0, 0.15)'
        ]
      },
      // colors: {
      //   transparent: 'transparent',
      //   current: 'currentColor',
      //   primary: colors.purple,
      //   secondary: colors.orange,
      //   social: colors.sky,
      //   description: colors.gray,
      //   warning: colors.yellow,
      //   danger: colors.red,
      //   success: colors.green,
      //   info: colors.purple/50,
      //   'deep-purple': '#370564',
        // test
        // primary: withOpacityValue('--color-primary'),
        // secondary: withOpacityValue('--color-secondary'),
      // },
      // backgroundColor: (theme) => ({
      //   ...theme('colors'),
      //   'primary-gradient-light-start': '#762c90',
      //   'primary-gradient-light-end': '#9f47c3',
      //   'secondary-gradient-light-start': '#2f80ed',
      //   'secondary-gradient-light-end': '#56aaff',
      //   'alternative-gradient-light-start': '#ff7979',
      //   'alternative-gradient-light-end': '#ffacb5',

      //   'primary-gradient-dark-start': '#4d1f6b',
      //   'primary-gradient-dark-end': '#7c3f9a',
      //   'secondary-gradient-dark-start': '#1e579b',
      //   'secondary-gradient-dark-end': '#3d7ed3',
      //   'alternative-gradient-dark-start': '#b34747',
      //   'alternative-gradient-dark-end': '#d66565',
      // }),
      // textColor: {
      //   'light': '#333333',
      //   'dark': '#f5f5f5',
      // },
      // gradientColorStops: (theme) => ({
      //   ...theme('colors'),
      //   'primary-light': '#762c90',
      //   'primary-dark': '#4d1f6b',
      //   'secondary-light': '#2f80ed',
      //   'secondary-dark': '#1e579b',
      //   'alternative-light': '#ff7979',
      //   'alternative-dark': '#b34747',
      // }),
      boxShadow: {
        input: "0px 7px 20px rgba(0, 0, 0, 0.03)",
        pricing: "0px 39px 23px -27px rgba(0, 0, 0, 0.04)",
        "switch-1": "0px 0px 5px rgba(0, 0, 0, 0.15)",
        "testimonial-4": "0px 60px 120px -20px #EBEFFD",
        "testimonial-5": "0px 10px 39px rgba(92, 115, 160, 0.08)",
        "contact-3": "0px 4px 28px rgba(0, 0, 0, 0.08)",
        "contact-6": "0px 2px 4px rgba(0, 0, 0, 0.05)",
        card: "0px 1px 3px rgba(0, 0, 0, 0.12)",
        "card-2": "0px 1px 10px -2px rgba(0, 0, 0, 0.15)",
      },
      
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },

      // typography: ({ theme }) => ({
      //   primary: {
      //     css: {
      //       '--tw-prose-body': theme('colors.purple[800]'),
      //       '--tw-prose-headings': theme('colors.purple[900]'),
      //       '--tw-prose-lead': theme('colors.purple[700]'),
      //       '--tw-prose-links': theme('colors.purple[900]'),
      //       '--tw-prose-bold': theme('colors.purple[900]'),
      //       '--tw-prose-counters': theme('colors.purple[600]'),
      //       '--tw-prose-bullets': theme('colors.purple[400]'),
      //       '--tw-prose-hr': theme('colors.purple[300]'),
      //       '--tw-prose-quotes': theme('colors.purple[900]'),
      //       '--tw-prose-quote-borders': theme('colors.purple[300]'),
      //       '--tw-prose-captions': theme('colors.purple[700]'),
      //       '--tw-prose-code': theme('colors.purple[900]'),
      //       '--tw-prose-pre-code': theme('colors.purple[100]'),
      //       '--tw-prose-pre-bg': theme('colors.purple[900]'),
      //       '--tw-prose-th-borders': theme('colors.purple[300]'),
      //       '--tw-prose-td-borders': theme('colors.purple[200]'),
      //       '--tw-prose-invert-body': theme('colors.purple[200]'),
      //       '--tw-prose-invert-headings': theme('colors.white'),
      //       '--tw-prose-invert-lead': theme('colors.purple[300]'),
      //       '--tw-prose-invert-links': theme('colors.white'),
      //       '--tw-prose-invert-bold': theme('colors.white'),
      //       '--tw-prose-invert-counters': theme('colors.purple[400]'),
      //       '--tw-prose-invert-bullets': theme('colors.purple[600]'),
      //       '--tw-prose-invert-hr': theme('colors.purple[700]'),
      //       '--tw-prose-invert-quotes': theme('colors.purple[100]'),
      //       '--tw-prose-invert-quote-borders': theme('colors.purple[700]'),
      //       '--tw-prose-invert-captions': theme('colors.purple[400]'),
      //       '--tw-prose-invert-code': theme('colors.white'),
      //       '--tw-prose-invert-pre-code': theme('colors.purple[300]'),
      //       '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
      //       '--tw-prose-invert-th-borders': theme('colors.purple[600]'),
      //       '--tw-prose-invert-td-borders': theme('colors.purple[700]'),
      //     },
      //   },
      // })
    }
},
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // require('tw-elements/dist/plugin'),
    require("daisyui"),
    require('tailwindcss-dotted-background'),
    require('flowbite/plugin'),
  ],
  daisyui: {
    styled: true,
    // themes: true,
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: "",
    darkTheme: "yakkl",
    themes: [
      {
        yakkl: {
          "primary": "#6d28d9",
          "secondary": "#6366f1",
          "accent": "#1FB2A5",
          "neutral": "#191D24",
          "base-100": "#2A303C",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        },
      },
      "light", "dark", "corporate", "luxury", "dracula", "business",
    ],
  }
}
