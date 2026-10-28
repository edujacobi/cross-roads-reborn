import { useQuery } from "@vue/apollo-composable";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { GetUserProfileDocument } from "~/graphql/generated";

export function useUserProfile(userId: MaybeRefOrGetter<string>) {
	const id = computed(() => toValue(userId));
	const { result, loading, error, refetch } = useQuery(
		GetUserProfileDocument,
		() => ({ id: id.value }),
		{
			enabled: computed(() => !!id.value),
			fetchPolicy: "cache-and-network",
		},
	);
	const user = computed(() => result.value?.user ?? null);

	return { user, loading, error, refetch };
}
