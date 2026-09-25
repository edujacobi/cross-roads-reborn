/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthUser = {
  __typename?: 'AuthUser';
  avatar?: Maybe<Scalars['String']['output']>;
  role: Role;
  userId: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type DashboardSnapshot = {
  __typename?: 'DashboardSnapshot';
  beatUpCount: Scalars['Int']['output'];
  casinoCount: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  englishCount: Scalars['Int']['output'];
  hospitalCount: Scalars['Int']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  idleCount: Scalars['Int']['output'];
  jobCount: Scalars['Int']['output'];
  portugueseCount: Scalars['Int']['output'];
  prisonCount: Scalars['Int']['output'];
  robberyCount: Scalars['Int']['output'];
  scavengeCount: Scalars['Int']['output'];
  spanishCount: Scalars['Int']['output'];
  totalGangs: Scalars['Int']['output'];
  totalPlayers: Scalars['Int']['output'];
};

export type DashboardStats = {
  __typename?: 'DashboardStats';
  beatUpCount: Scalars['Int']['output'];
  casinoCount: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  englishCount: Scalars['Int']['output'];
  hospitalCount: Scalars['Int']['output'];
  idleCount: Scalars['Int']['output'];
  jobCount: Scalars['Int']['output'];
  portugueseCount: Scalars['Int']['output'];
  prisonCount: Scalars['Int']['output'];
  robberyCount: Scalars['Int']['output'];
  scavengeCount: Scalars['Int']['output'];
  spanishCount: Scalars['Int']['output'];
  totalGangs: Scalars['Int']['output'];
  totalPlayers: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cureUser: MutationResult;
  freeUser: MutationResult;
  removeAction: MutationResult;
  resetCooldown: MutationResult;
  setMoney: MutationResult;
};


export type MutationCureUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationFreeUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRemoveActionArgs = {
  action: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationResetCooldownArgs = {
  cooldown: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetMoneyArgs = {
  amount: Scalars['Int']['input'];
  mode: SetMoneyMode;
  userId: Scalars['ID']['input'];
};

export type MutationResult = {
  __typename?: 'MutationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  user?: Maybe<UserDetail>;
};

export type Query = {
  __typename?: 'Query';
  dashboardHistory: Array<DashboardSnapshot>;
  dashboardStats: DashboardStats;
  me?: Maybe<AuthUser>;
  user?: Maybe<UserDetail>;
  users: UserSearchResult;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export enum Role {
  Developer = 'DEVELOPER',
  Moderator = 'MODERATOR'
}

export enum SetMoneyMode {
  Add = 'ADD',
  Set = 'SET'
}

export type UserDetail = {
  __typename?: 'UserDetail';
  attack: Scalars['Int']['output'];
  class: Scalars['Int']['output'];
  className: Scalars['String']['output'];
  dailyStreak: Scalars['Int']['output'];
  defense: Scalars['Int']['output'];
  gangId?: Maybe<Scalars['Int']['output']>;
  hospitalTime?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  investmentId?: Maybe<Scalars['Int']['output']>;
  isInCasino: Scalars['Boolean']['output'];
  isInHospital: Scalars['Boolean']['output'];
  isInPrison: Scalars['Boolean']['output'];
  isScavenging: Scalars['Boolean']['output'];
  isVip: Scalars['Boolean']['output'];
  isWanted: Scalars['Boolean']['output'];
  isWorking: Scalars['Boolean']['output'];
  items: Array<UserItemInfo>;
  jobEndsIn?: Maybe<Scalars['String']['output']>;
  language: Scalars['String']['output'];
  money: Scalars['Int']['output'];
  nickname: Scalars['String']['output'];
  prisonTime?: Maybe<Scalars['String']['output']>;
  situationId: Scalars['Int']['output'];
  specialCoin: Scalars['Int']['output'];
  vipEternal: Scalars['Boolean']['output'];
  vipTime?: Maybe<Scalars['String']['output']>;
  voteCount: Scalars['Int']['output'];
};

export type UserItemInfo = {
  __typename?: 'UserItemInfo';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  remainingTime?: Maybe<Scalars['String']['output']>;
  skin: Scalars['Int']['output'];
  type: Scalars['Int']['output'];
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  total: Scalars['Int']['output'];
  users: Array<UserSummary>;
};

export type UserSummary = {
  __typename?: 'UserSummary';
  class: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isVip: Scalars['Boolean']['output'];
  money: Scalars['Float']['output'];
  nickname: Scalars['String']['output'];
  situationId: Scalars['Int']['output'];
  specialCoin: Scalars['Int']['output'];
  vipEternal: Scalars['Boolean']['output'];
};

export type SetMoneyMode =
  | 'ADD'
  | 'SET';

export type GetDashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardStatsQuery = { dashboardStats: { date: string, totalPlayers: number, totalGangs: number, prisonCount: number, hospitalCount: number, jobCount: number, scavengeCount: number, casinoCount: number, robberyCount: number, beatUpCount: number, idleCount: number, englishCount: number, portugueseCount: number, spanishCount: number } };

export type GetDashboardHistoryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardHistoryQuery = { dashboardHistory: Array<{ id: string | null, date: string, totalPlayers: number, totalGangs: number, prisonCount: number, hospitalCount: number, jobCount: number, scavengeCount: number, casinoCount: number, robberyCount: number, beatUpCount: number, idleCount: number, englishCount: number, portugueseCount: number, spanishCount: number }> };

export type SearchUsersQueryVariables = Exact<{
  search?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchUsersQuery = { users: { total: number, users: Array<{ id: string, nickname: string, money: number, specialCoin: number, class: number, isVip: boolean, vipEternal: boolean, situationId: number }> } };

export type GetUserDetailQueryVariables = Exact<{
  id: string | number;
}>;


export type GetUserDetailQuery = { user: { id: string, nickname: string, money: number, specialCoin: number, gangId: number | null, class: number, className: string, attack: number, defense: number, isVip: boolean, vipEternal: boolean, vipTime: string | null, language: string, isInHospital: boolean, hospitalTime: string | null, isInPrison: boolean, prisonTime: string | null, isWorking: boolean, jobEndsIn: string | null, isScavenging: boolean, isWanted: boolean, isInCasino: boolean, investmentId: number | null, situationId: number, dailyStreak: number, voteCount: number, items: Array<{ id: number, name: string, type: number, quantity: number, skin: number, remainingTime: string | null }> } | null };

export type SetMoneyMutationVariables = Exact<{
  userId: string | number;
  amount: number;
  mode: SetMoneyMode;
}>;


export type SetMoneyMutation = { setMoney: { success: boolean, message: string, user: { id: string, money: number } | null } };

export type CureUserMutationVariables = Exact<{
  userId: string | number;
}>;


export type CureUserMutation = { cureUser: { success: boolean, message: string, user: { id: string, isInHospital: boolean, hospitalTime: string | null } | null } };

export type FreeUserMutationVariables = Exact<{
  userId: string | number;
}>;


export type FreeUserMutation = { freeUser: { success: boolean, message: string, user: { id: string, isInPrison: boolean, prisonTime: string | null } | null } };

export type ResetCooldownMutationVariables = Exact<{
  userId: string | number;
  cooldown: string;
}>;


export type ResetCooldownMutation = { resetCooldown: { success: boolean, message: string } };

export type RemoveActionMutationVariables = Exact<{
  userId: string | number;
  action: string;
}>;


export type RemoveActionMutation = { removeAction: { success: boolean, message: string } };


export const GetDashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlayers"}},{"kind":"Field","name":{"kind":"Name","value":"totalGangs"}},{"kind":"Field","name":{"kind":"Name","value":"prisonCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalCount"}},{"kind":"Field","name":{"kind":"Name","value":"jobCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpCount"}},{"kind":"Field","name":{"kind":"Name","value":"idleCount"}},{"kind":"Field","name":{"kind":"Name","value":"englishCount"}},{"kind":"Field","name":{"kind":"Name","value":"portugueseCount"}},{"kind":"Field","name":{"kind":"Name","value":"spanishCount"}}]}}]}}]} as unknown as DocumentNode<GetDashboardStatsQuery, GetDashboardStatsQueryVariables>;
export const GetDashboardHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlayers"}},{"kind":"Field","name":{"kind":"Name","value":"totalGangs"}},{"kind":"Field","name":{"kind":"Name","value":"prisonCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalCount"}},{"kind":"Field","name":{"kind":"Name","value":"jobCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpCount"}},{"kind":"Field","name":{"kind":"Name","value":"idleCount"}},{"kind":"Field","name":{"kind":"Name","value":"englishCount"}},{"kind":"Field","name":{"kind":"Name","value":"portugueseCount"}},{"kind":"Field","name":{"kind":"Name","value":"spanishCount"}}]}}]}}]} as unknown as DocumentNode<GetDashboardHistoryQuery, GetDashboardHistoryQueryVariables>;
export const SearchUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"money"}},{"kind":"Field","name":{"kind":"Name","value":"specialCoin"}},{"kind":"Field","name":{"kind":"Name","value":"class"}},{"kind":"Field","name":{"kind":"Name","value":"isVip"}},{"kind":"Field","name":{"kind":"Name","value":"vipEternal"}},{"kind":"Field","name":{"kind":"Name","value":"situationId"}}]}}]}}]}}]} as unknown as DocumentNode<SearchUsersQuery, SearchUsersQueryVariables>;
export const GetUserDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"money"}},{"kind":"Field","name":{"kind":"Name","value":"specialCoin"}},{"kind":"Field","name":{"kind":"Name","value":"gangId"}},{"kind":"Field","name":{"kind":"Name","value":"class"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"attack"}},{"kind":"Field","name":{"kind":"Name","value":"defense"}},{"kind":"Field","name":{"kind":"Name","value":"isVip"}},{"kind":"Field","name":{"kind":"Name","value":"vipEternal"}},{"kind":"Field","name":{"kind":"Name","value":"vipTime"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"isInHospital"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTime"}},{"kind":"Field","name":{"kind":"Name","value":"isInPrison"}},{"kind":"Field","name":{"kind":"Name","value":"prisonTime"}},{"kind":"Field","name":{"kind":"Name","value":"isWorking"}},{"kind":"Field","name":{"kind":"Name","value":"jobEndsIn"}},{"kind":"Field","name":{"kind":"Name","value":"isScavenging"}},{"kind":"Field","name":{"kind":"Name","value":"isWanted"}},{"kind":"Field","name":{"kind":"Name","value":"isInCasino"}},{"kind":"Field","name":{"kind":"Name","value":"investmentId"}},{"kind":"Field","name":{"kind":"Name","value":"situationId"}},{"kind":"Field","name":{"kind":"Name","value":"dailyStreak"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"skin"}},{"kind":"Field","name":{"kind":"Name","value":"remainingTime"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserDetailQuery, GetUserDetailQueryVariables>;
export const SetMoneyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMoney"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetMoneyMode"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setMoney"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"mode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"money"}}]}}]}}]}}]} as unknown as DocumentNode<SetMoneyMutation, SetMoneyMutationVariables>;
export const CureUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CureUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cureUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isInHospital"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTime"}}]}}]}}]}}]} as unknown as DocumentNode<CureUserMutation, CureUserMutationVariables>;
export const FreeUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FreeUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"freeUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isInPrison"}},{"kind":"Field","name":{"kind":"Name","value":"prisonTime"}}]}}]}}]}}]} as unknown as DocumentNode<FreeUserMutation, FreeUserMutationVariables>;
export const ResetCooldownDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetCooldown"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cooldown"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetCooldown"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cooldown"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cooldown"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ResetCooldownMutation, ResetCooldownMutationVariables>;
export const RemoveActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RemoveActionMutation, RemoveActionMutationVariables>;