// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-11-01",

	// SPA Mode as requested for internal admin dashboard
	ssr: false,

	devtools: { enabled: false },

	app: {
		head: {
			title: "Cross Roads Reborn - Admin Panel",
			meta: [
				{ charset: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ name: "description", content: "Administrative dashboard for Cross Roads Reborn" },
				{ name: "apple-mobile-web-app-title", content: "Cross Roads" },
			],
			link: [
				{ rel: "manifest", href: "/manifest/site.webmanifest" },
				{ rel: "icon", type: "image/x-icon", href: "/manifest/favicon.ico" },
				{ rel: "icon", type: "image/svg+xml", href: "/manifest/favicon.svg" },
				{ rel: "shortcut icon", href: "/manifest/favicon.ico" },
				{ rel: "apple-touch-icon", sizes: "180x180", href: "/manifest/apple-touch-icon.png" },
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
				},
			],
		},
	},

	css: ["~/assets/scss/main.scss"],

	runtimeConfig: {
		public: {
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
		},
	},

	modules: ["@nuxt/image"],
	image: {
		dir: "public/images",
	},
});
