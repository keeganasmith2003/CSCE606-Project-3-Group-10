const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: [
		'./public/*.html',
		'./app/helpers/**/*.rb',
		'./app/javascript/**/*.js',
		'./app/views/**/*.{erb,haml,html,slim}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter var', ...defaultTheme.fontFamily.sans],
			},
			colors: {
				background: 'unquote("hsl(var(--background))")',
				foreground: 'unquote("hsl(var(--foreground))")',
				card: {
					DEFAULT: 'unquote("hsl(var(--card))")',
					foreground: 'unquote("hsl(var(--card-foreground))")',
				},
				primary: {
					DEFAULT: 'unquote("hsl(var(--primary))")',
					foreground: 'unquote("hsl(var(--primary-foreground))")',
				},
				secondary: {
					DEFAULT: 'unquote("hsl(var(--secondary))")',
					foreground: 'unquote("hsl(var(--secondary-foreground))")',
				},
				muted: {
					DEFAULT: 'unquote("hsl(var(--muted))")',
					foreground: 'unquote("hsl(var(--muted-foreground))")',
				},
				accent: {
					DEFAULT: 'unquote("hsl(var(--accent))")',
					foreground: 'unquote("hsl(var(--accent-foreground))")',
				},
				destructive: {
					DEFAULT: 'unquote("hsl(var(--destructive))")',
					foreground: 'unquote("hsl(var(--destructive-foreground))")',
				},
				border: 'unquote("hsl(var(--border))")',
				input: 'unquote("hsl(var(--input))")',
				ring: 'unquote("hsl(var(--ring))")',
				chart: {
					1: 'unquote("hsl(var(--chart-1))")',
					2: 'unquote("hsl(var(--chart-2))")',
					3: 'unquote("hsl(var(--chart-3))")',
					4: 'unquote("hsl(var(--chart-4))")',
					5: 'unquote("hsl(var(--chart-5))")',
				},
			},
			borderRadius: {
				lg: 'unquote("var(--radius)")',
				md: 'unquote("calc(var(--radius) - 2px)")',
				sm: 'unquote("calc(var(--radius) - 4px)")',
			},
		},
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/container-queries'),
	],
};
