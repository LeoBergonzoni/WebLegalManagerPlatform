/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        'wlm-yellow': '#FFE94D',
        'wlm-yellow-strong': '#FFD600',
        'wlm-black': '#0B0B0B',
        'wlm-grey': '#202225',
        'wlm-text': '#EDEDED'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'wlm': '18px'
      },
      boxShadow: {
        'wlm-logo': '0 2px 0 rgba(0,0,0,0.25)'
      },
      maxWidth: {
        'wlm': '1120px'
      },
      backgroundImage: {
        'wlm-body':
          'radial-gradient(1200px 600px at 80% -10%, rgba(255,233,77,0.18), transparent 55%), linear-gradient(180deg, #0B0B0B 0%, #111213 100%)',
        'wlm-stripe':
          'repeating-linear-gradient(45deg, #FFE94D, #FFE94D 14px, #000 14px, #000 28px)'
      }
    }
  },
  plugins: []
};
