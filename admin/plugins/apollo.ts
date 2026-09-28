import { ApolloClient, createHttpLink, from, InMemoryCache } from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { DefaultApolloClient } from "@vue/apollo-composable";

export default defineNuxtPlugin((nuxtApp) => {
	const config = useRuntimeConfig();

	const httpLink = createHttpLink({
		uri: `${config.public.apiBaseUrl}/graphql`,
	});

	const authLink = setContext((_, { headers }) => {
		let token: string | null = null;
		if (import.meta.client) {
			token = localStorage.getItem("cr_admin_token");
		}

		return {
			headers: {
				...headers,
				authorization: token ? `Bearer ${token}` : "",
			},
		};
	});

	const apolloClient = new ApolloClient({
		link: from([authLink, httpLink]),
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: "cache-and-network",
			},
		},
	});

	nuxtApp.vueApp.provide(DefaultApolloClient, apolloClient);

	return {
		provide: {
			apollo: apolloClient,
		},
	};
});
