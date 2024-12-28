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
      colors: {
        // Backgrounds
        'modal-bg-light': '#f9fafb',
        'modal-bg-dark': '#1f2937',
        'surface-light': '#ffffff',
        'surface-dark': '#2d3748',

        // Primary colors for text (titles)
        'primary-light': '#111827',  // Dark gray (almost black) for light mode
        'primary-dark': '#E5E7EB',   // Light gray for dark mode

        // Secondary colors for text (subtitles/descriptions)
        'secondary-light': '#4B5563',  // Medium gray for light mode
        'secondary-dark': '#9CA3AF',   // Light gray for dark mode

        // Neutral background (for dividers and less emphasized elements)
        'neutral-light': '#f3f4f6',  // Light gray for light mode
        'neutral-dark': '#1f2937',   // Dark gray for dark mode

        // Text and input colors
        'input-bg-light': '#FFFFFF',
        'input-bg-dark': '#374151',
        'input-text-light': '#111827',
        'input-text-dark': '#E5E7EB',
        'input-placeholder-light': '#9CA3AF',
        'input-placeholder-dark': '#6B7280',

        // Borders for inputs or dividers
        'input-border-light': '#D1D5DB',
        'input-border-dark': '#4B5563',
        'input-focused-border-light': '#6D28D9',
        'input-focused-border-dark': '#8B5CF6',
      },
        // 'modal-bg-light': '#f9fafb',
        // 'modal-bg-dark': '#1f2937',
        // 'primary-light': '#6d28d9',
        // 'primary-dark': '#8b5cf6',
        // 'secondary-light': '#6366f1',
        // 'secondary-dark': '#818cf8',
        // 'accent-light': '#1FB2A5',
        // 'accent-dark': '#22D3EE',
        // 'neutral-light': '#f3f4f6',
        // 'neutral-dark': '#1f2937',
        // 'surface-light': '#ffffff',
        // 'surface-dark': '#2d3748',
        // 'info-light': '#3ABFF8',
        // 'info-dark': '#67E8F9',
        // 'success-light': '#36D399',
        // 'success-dark': '#4ADE80',
        // 'warning-light': '#FBBD23',
        // 'warning-dark': '#FCD34D',
        // 'error-light': '#F87272',
        // 'error-dark': '#FCA5A5',

        // // Text colors
        // 'text-primary-light': '#111827',
        // 'text-secondary-light': '#4B5563',
        // 'text-disabled-light': '#9CA3AF',
        // 'text-primary-dark': '#E5E7EB',
        // 'text-secondary-dark': '#9CA3AF',
        // 'text-disabled-dark': '#6B7280',

        // // Input colors
        // 'input-bg-light': '#FFFFFF',
        // 'input-bg-dark': '#374151',
        // 'input-border-light': '#D1D5DB',
        // 'input-border-dark': '#4B5563',
        // 'input-text-light': '#111827',
        // 'input-text-dark': '#E5E7EB',
        // 'input-placeholder-light': '#9CA3AF',
        // 'input-placeholder-dark': '#6B7280',

        // // Focused border colors for inputs
        // 'input-focused-border-light': '#6D28D9',
        // 'input-focused-border-dark': '#8B5CF6',
      // },
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
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },

      typography: ({ theme }) => ({
        primary: {
          css: {
            '--tw-prose-body': theme('colors.purple[800]'),
            '--tw-prose-headings': theme('colors.purple[900]'),
            '--tw-prose-lead': theme('colors.purple[700]'),
            '--tw-prose-links': theme('colors.purple[900]'),
            '--tw-prose-bold': theme('colors.purple[900]'),
            '--tw-prose-counters': theme('colors.purple[600]'),
            '--tw-prose-bullets': theme('colors.purple[400]'),
            '--tw-prose-hr': theme('colors.purple[300]'),
            '--tw-prose-quotes': theme('colors.purple[900]'),
            '--tw-prose-quote-borders': theme('colors.purple[300]'),
            '--tw-prose-captions': theme('colors.purple[700]'),
            '--tw-prose-code': theme('colors.purple[900]'),
            '--tw-prose-pre-code': theme('colors.purple[100]'),
            '--tw-prose-pre-bg': theme('colors.purple[900]'),
            '--tw-prose-th-borders': theme('colors.purple[300]'),
            '--tw-prose-td-borders': theme('colors.purple[200]'),
            '--tw-prose-invert-body': theme('colors.purple[200]'),
            '--tw-prose-invert-headings': theme('colors.white'),
            '--tw-prose-invert-lead': theme('colors.purple[300]'),
            '--tw-prose-invert-links': theme('colors.white'),
            '--tw-prose-invert-bold': theme('colors.white'),
            '--tw-prose-invert-counters': theme('colors.purple[400]'),
            '--tw-prose-invert-bullets': theme('colors.purple[600]'),
            '--tw-prose-invert-hr': theme('colors.purple[700]'),
            '--tw-prose-invert-quotes': theme('colors.purple[100]'),
            '--tw-prose-invert-quote-borders': theme('colors.purple[700]'),
            '--tw-prose-invert-captions': theme('colors.purple[400]'),
            '--tw-prose-invert-code': theme('colors.white'),
            '--tw-prose-invert-pre-code': theme('colors.purple[300]'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.purple[600]'),
            '--tw-prose-invert-td-borders': theme('colors.purple[700]'),
          },
        },
      })
    }
},
  plugins: [
    require("tailwindcss-animate"),
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
  },
};

// export default config;
