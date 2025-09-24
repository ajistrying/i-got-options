// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
  	css: ['~/assets/css/main.css'],
	modules: ["@nuxt/scripts", "@nuxt/test-utils", "@nuxt/ui"],
	runtimeConfig: {
		redditUsername: process.env.REDDIT_USERNAME,
		redditSecretToken: process.env.REDDIT_SECRET_TOKEN,
		public: {
			supabaseUrl: process.env.SUPABASE_URL,
			supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
		},
	},
});
