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
			],
			link: [
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
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
