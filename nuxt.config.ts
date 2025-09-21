// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/scripts", "@nuxt/test-utils", "@nuxt/ui"],
	runtimeConfig: {
		public: {
			supabaseUrl: process.env.SUPABASE_URL,
			supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
		},
	},
});
