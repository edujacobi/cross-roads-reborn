import { dashboardResolvers } from "./dashboard";
import { userResolvers } from "./users";
import { gangResolvers } from "./gangs";
import { seasonResolvers } from "./season";
import { eventResolvers } from "./events";
import { adminResolvers } from "./admin";
import { meResolvers } from "./me";
import type { ResolverFn } from "./helpers";

export const resolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		...meResolvers.Query,
		...userResolvers.Query,
		...gangResolvers.Query,
		...dashboardResolvers.Query,
		...seasonResolvers.Query,
		...eventResolvers.Query,
		...adminResolvers.Query,
	},
	Mutation: {
		...meResolvers.Mutation,
		...seasonResolvers.Mutation,
		...eventResolvers.Mutation,
		...adminResolvers.Mutation,
	},
};