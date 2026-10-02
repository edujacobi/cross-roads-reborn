import { ApolloClient, createHttpLink, from, InMemoryCache } from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { localStorageKeys } from "~/constants/localStorageKeys";

export default defineNuxtPlugin((nuxtApp) => {
	const config = useRuntimeConfig();
	const tokenStorage = useLocalStorage(localStorageKeys.adminToken);

	const httpLink = createHttpLink({
		uri: `${config.public.apiBaseUrl}/graphql`,
	});

	const authLink = setContext((_, { headers }) => {
		const token = tokenStorage.get();

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
