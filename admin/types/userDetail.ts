import type { GetUserDetailQuery } from "~/graphql/generated";

export type UserDetail = NonNullable<GetUserDetailQuery["user"]>;
