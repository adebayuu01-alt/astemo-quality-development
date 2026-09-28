/**
 * Figma Design System Tokens
 * Source: Figma Variables Export
 * (Advics theme & colors removed per user request)
 */

export const FIGMA_TOKENS = {
  spacing: {
    none: '0px',
    '2px': '2px',
    '4px': '4px',
    '6px': '6px',
    '8px': '8px',
    '10px': '10px',
    '12px': '12px',
    '14px': '14px',
    '16px': '16px',
    '20px': '20px',
    '24px': '24px',
    '28px': '28px',
    '32px': '32px',
    '36px': '36px',
    '40px': '40px',
    '44px': '44px',
    '48px': '48px',
    '56px': '56px',
    '64px': '64px',
    '80px': '80px',
    '96px': '96px',
    '112px': '112px',
    '114px': '114px',
    '128px': '128px',
    full: '9999px'
  },

  radius: {
    'rounded-none': '0px',
    'rounded-sm': '2px',
    'rounded': '4px',
    'rounded-md': '6px',
    'rounded-lg': '8px',
    'rounded-xl': '12px',
    'rounded-2xl': '16px',
    'rounded-3xl': '24px',
    'rounded-full': '9999px'
  },

  screens: {
    sm: '360px',
    md: '768px',
    lg: '1024px',
    xl: '1080px'
  },

  colors: {
    green: {
      25: '#f3fff9',
      50: '#e6f8ef',
      100: '#b0e9cf',
      200: '#8adeb7',
      300: '#55cf96',
      400: '#34c582',
      500: '#01b763', // Primary Green
      600: '#01a75a',
      700: '#018246',
      800: '#016536',
      900: '#004d2a'
    },
    neutral: {
      0: '#ffffff',
      25: '#fafafa',
      50: '#f9f9fb',
      100: '#f2f2f7',
      200: '#e4e4ec',
      300: '#d0d1dd',
      400: '#a1a2b3',
      500: '#6d6d85',
      600: '#4c4e67',
      700: '#31323f',
      800: '#24262b',
      900: '#1a1e24'
    },
    grey: {
      0: '#f1f2f4',
      25: '#e4e6ea',
      50: '#aeb2b7',
      100: '#7b7e82',
      200: '#45474a',
      300: '#3d3e42',
      400: '#343537',
      500: '#2c2d2f',
      600: '#27282a',
      700: '#222325',
      800: '#1b1c1d',
      900: '#0c0c0c'
    },
    blue: {
      25: '#f4faff',
      50: '#e9f5ff',
      100: '#e0f0ff',
      200: '#9cd0ff',
      300: '#6ebaff',
      400: '#52adff',
      500: '#2798ff',
      600: '#238ae8',
      700: '#1c6cb5',
      800: '#1c66a3',
      900: '#195580'
    },
    red: {
      25: '#fffbfa',
      50: '#fef3f2',
      100: '#fee4e2',
      200: '#fecdca',
      300: '#fda29b',
      400: '#f97066',
      500: '#f04438',
      600: '#d92d20',
      700: '#b42318',
      800: '#a3241d',
      900: '#911e1a'
    },
    yellow: {
      25: '#fffcf0',
      50: '#fff8e0',
      100: '#fff4cc',
      200: '#ffeba3',
      300: '#ffe070',
      400: '#ffce1f',
      500: '#ffc30f',
      600: '#ebb000',
      700: '#cc9900',
      800: '#b28600',
      900: '#997300'
    },
    orange: {
      25: '#fff7eb',
      50: '#ffeed6',
      100: '#ffe2b8',
      200: '#ffd28f',
      300: '#ffc266',
      400: '#ffb547',
      500: '#ffa826',
      600: '#ff9900',
      700: '#eb8d00',
      800: '#cc7a00',
      900: '#b86e00'
    },
    purple: {
      25: '#fafaff',
      50: '#f6f5ff',
      100: '#edebff',
      200: '#dcd7fe',
      300: '#c0bbfb',
      400: '#9592f6',
      500: '#7777ed',
      600: '#5658d9',
      700: '#4145c6',
      800: '#383e9e',
      900: '#30377d'
    },
    base: {
      white: '#ffffff',
      black: '#24262b'
    }
  },

  typography: {
    fontFamilies: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      poppins: ['Poppins', 'sans-serif'],
      sora: ['Sora', 'sans-serif'],
      inter: ['Inter', 'sans-serif'],
      robotoSlab: ['"Roboto Slab"', 'serif'],
      lora: ['Lora', 'serif']
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    fontSizes: {
      12: '12px',
      14: '14px',
      16: '16px',
      18: '18px',
      20: '20px',
      24: '24px',
      32: '32px',
      36: '36px',
      48: '48px',
      64: '64px',
      80: '80px'
    }
  },

  // Semantic Design System (Light & Dark Mode)
  semantic: {
    light: {
      bg: '#f2f2f7',
      card: '#ffffff',
      border: '#d0d1dd',
      textPrimary: '#24262b',
      textSecondary: '#4c4e67',
      placeholder: '#a1a2b3',
      table: '#f2f2f7',
      primary: '#01b763',
      secondary: '#6d6d85',
      accent: '#8adeb7',
      success: '#01b763',
      warning: '#ffc30f',
      info: '#2798ff',
      danger: '#f04438',
      nav: {
        bg: '#ffffff',
        fontSidebar: '#4c4e67',
        fontSidebarActive: '#01a75a',
        sidebarAccent: '#e6f8ef',
        border: '#d0d1dd'
      },
      form: {
        bg: '#f9f9fb',
        border: '#d0d1dd',
        fontTitle: '#24262b',
        typing: '#01b763',
        value: '#24262b',
        success: '#01b763',
        error: '#f04438',
        disabled: '#e4e4ec',
        placeholder: '#a1a2b3'
      }
    },
    dark: {
      bg: '#222325',
      card: '#2c2d2f',
      border: '#3d3e42',
      textPrimary: '#ffffff',
      textSecondary: '#aeb2b7',
      placeholder: '#7b7e82',
      table: '#343537',
      primary: '#01b763',
      secondary: '#1a1e24',
      accent: '#016536',
      success: '#004d2a',
      warning: '#997300',
      info: '#195580',
      danger: '#911e1a',
      nav: {
        bg: '#2c2d2f',
        fontSidebar: '#aeb2b7',
        fontSidebarActive: '#e6f8ef',
        sidebarAccent: '#016536',
        border: '#3d3e42'
      },
      form: {
        bg: '#343537',
        border: '#3d3e42',
        fontTitle: '#ffffff',
        typing: '#01b763',
        value: '#ffffff',
        success: '#01b763',
        error: '#f04438',
        disabled: '#45474a',
        placeholder: '#7b7e82'
      }
    }
  }
};

export default FIGMA_TOKENS;
