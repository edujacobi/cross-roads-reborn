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
  allUsers?: Maybe<Scalars['Int']['output']>;
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
  allUsers: Scalars['Int']['output'];
  bankVaultValue: Scalars['Int']['output'];
  beatUpCount: Scalars['Int']['output'];
  casinoCount: Scalars['Int']['output'];
  casinoVaultValue: Scalars['Int']['output'];
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

export type Event = {
  __typename?: 'Event';
  id: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  periodEnd: Scalars['String']['output'];
  periodStart: Scalars['String']['output'];
  type: Scalars['Int']['output'];
  value: Scalars['Float']['output'];
};

export type EventMutationResult = {
  __typename?: 'EventMutationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GangInfo = {
  __typename?: 'GangInfo';
  color: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  role: Scalars['String']['output'];
};

export type InvestmentInfo = {
  __typename?: 'InvestmentInfo';
  defense: Scalars['Int']['output'];
  expiresAt: Scalars['String']['output'];
  henchmanEndsAt?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  nextPaymentValue: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBadge: MutationResult;
  addSpecialCoins: MutationResult;
  createEvent: EventMutationResult;
  cureUser: MutationResult;
  deleteEvent: EventMutationResult;
  freeUser: MutationResult;
  killUser: MutationResult;
  removeAction: MutationResult;
  removeBadge: MutationResult;
  resetCooldown: MutationResult;
  setClass: MutationResult;
  setItem: MutationResult;
  setMoney: MutationResult;
  setNickname: MutationResult;
  setVip: MutationResult;
  swapUsers: MutationResult;
  updateEvent: EventMutationResult;
};


export type MutationAddBadgeArgs = {
  badgeId: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAddSpecialCoinsArgs = {
  amount: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCreateEventArgs = {
  periodEnd: Scalars['String']['input'];
  periodStart: Scalars['String']['input'];
  type: Scalars['Int']['input'];
  value: Scalars['Float']['input'];
};


export type MutationCureUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationDeleteEventArgs = {
  id: Scalars['Int']['input'];
};


export type MutationFreeUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationKillUserArgs = {
  days: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveActionArgs = {
  action: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveBadgeArgs = {
  badgeId: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationResetCooldownArgs = {
  cooldown: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetClassArgs = {
  classId: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetItemArgs = {
  hoursOrQuantity: Scalars['Float']['input'];
  itemId: Scalars['Int']['input'];
  mode: SetMoneyMode;
  userId: Scalars['ID']['input'];
};


export type MutationSetMoneyArgs = {
  amount: Scalars['Int']['input'];
  mode: SetMoneyMode;
  userId: Scalars['ID']['input'];
};


export type MutationSetNicknameArgs = {
  nickname: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetVipArgs = {
  days: Scalars['Int']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSwapUsersArgs = {
  firstUserId: Scalars['ID']['input'];
  secondUserId: Scalars['ID']['input'];
};


export type MutationUpdateEventArgs = {
  id: Scalars['Int']['input'];
  periodEnd?: InputMaybe<Scalars['String']['input']>;
  periodStart?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['Float']['input']>;
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
  events: Array<Event>;
  me?: Maybe<AuthUser>;
  topUsers: UserRankingResult;
  user?: Maybe<UserDetail>;
  users: UserSearchResult;
};


export type QueryTopUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  ranking: UserRanking;
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
  Helper = 'HELPER',
  Moderator = 'MODERATOR'
}

export enum SetMoneyMode {
  Add = 'ADD',
  Set = 'SET'
}

export type UserActivityStats = {
  __typename?: 'UserActivityStats';
  almsGivenCount: Scalars['Int']['output'];
  almsGivenSum: Scalars['Int']['output'];
  almsReceivedCount: Scalars['Int']['output'];
  almsReceivedSum: Scalars['Int']['output'];
  beatUpBeatedUpCount: Scalars['Int']['output'];
  beatUpFailureCount: Scalars['Int']['output'];
  beatUpSuccessCount: Scalars['Int']['output'];
  casinoLoseCount: Scalars['Int']['output'];
  casinoLoseSum: Scalars['Int']['output'];
  casinoWinCount: Scalars['Int']['output'];
  casinoWinSum: Scalars['Int']['output'];
  dailyCurrentStreak: Scalars['Int']['output'];
  dailyMaxStreak: Scalars['Int']['output'];
  escapeCount: Scalars['Int']['output'];
  hospitalCount: Scalars['Int']['output'];
  hospitalTreatmentCount: Scalars['Int']['output'];
  hospitalTreatmentSum: Scalars['Int']['output'];
  investmentProfit: Scalars['Int']['output'];
  jobReceivedCount: Scalars['Int']['output'];
  jobReceivedSum: Scalars['Int']['output'];
  prisonBriberyCount: Scalars['Int']['output'];
  prisonBriberySum: Scalars['Int']['output'];
  prisonCount: Scalars['Int']['output'];
  robberyBeingRobbedCount: Scalars['Int']['output'];
  robberyBeingRobbedSum: Scalars['Int']['output'];
  robberyFailureCount: Scalars['Int']['output'];
  robberySuccessCount: Scalars['Int']['output'];
  robberySuccessRobbedSum: Scalars['Int']['output'];
  scavengeFailures: Scalars['Int']['output'];
  scavengeFoundCount: Scalars['Int']['output'];
  scavengeHospitalizations: Scalars['Int']['output'];
  scavengePrisonizations: Scalars['Int']['output'];
  shopSpentCount: Scalars['Int']['output'];
  shopSpentSum: Scalars['Int']['output'];
};

export type UserBadgeInfo = {
  __typename?: 'UserBadgeInfo';
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type UserDetail = {
  __typename?: 'UserDetail';
  activityStats: UserActivityStats;
  attack: Scalars['Float']['output'];
  avatarDecoration: Scalars['String']['output'];
  avatarUrl?: Maybe<Scalars['String']['output']>;
  badges: Array<UserBadgeInfo>;
  class: Scalars['Int']['output'];
  className: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  deadUntil?: Maybe<Scalars['String']['output']>;
  defense: Scalars['Float']['output'];
  gang?: Maybe<GangInfo>;
  hospitalTime?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  investment?: Maybe<InvestmentInfo>;
  isBeating: Scalars['Boolean']['output'];
  isBeingBeated: Scalars['Boolean']['output'];
  isBeingRobbed: Scalars['Boolean']['output'];
  isDead: Scalars['Boolean']['output'];
  isDefendingInvestment: Scalars['Boolean']['output'];
  isInCasino: Scalars['Boolean']['output'];
  isInGangAction: Scalars['Boolean']['output'];
  isInHospital: Scalars['Boolean']['output'];
  isInPrison: Scalars['Boolean']['output'];
  isRobbing: Scalars['Boolean']['output'];
  isScavenging: Scalars['Boolean']['output'];
  isVip: Scalars['Boolean']['output'];
  isWanted: Scalars['Boolean']['output'];
  isWorking: Scalars['Boolean']['output'];
  items: Array<UserItemInfo>;
  jobEndsIn?: Maybe<Scalars['String']['output']>;
  language: Scalars['String']['output'];
  money: Scalars['Int']['output'];
  nickname: Scalars['String']['output'];
  online: Scalars['Boolean']['output'];
  prisonTime?: Maybe<Scalars['String']['output']>;
  situationId: Scalars['Int']['output'];
  situationText: Scalars['String']['output'];
  specialCoin: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
  vipEternal: Scalars['Boolean']['output'];
  vipTime?: Maybe<Scalars['String']['output']>;
  voteCount: Scalars['Int']['output'];
  wantedTime?: Maybe<Scalars['String']['output']>;
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

export enum UserRanking {
  Beaters = 'BEATERS',
  Bribers = 'BRIBERS',
  Drunkers = 'DRUNKERS',
  Escapers = 'ESCAPERS',
  Gamblers = 'GAMBLERS',
  Hospital = 'HOSPITAL',
  Investors = 'INVESTORS',
  Money = 'MONEY',
  Scavengers = 'SCAVENGERS',
  Spenders = 'SPENDERS',
  Thieves = 'THIEVES',
  Workers = 'WORKERS'
}

export type UserRankingEntry = {
  __typename?: 'UserRankingEntry';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  count?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type UserRankingResult = {
  __typename?: 'UserRankingResult';
  entries: Array<UserRankingEntry>;
  total: Scalars['Int']['output'];
};

export type UserSearchResult = {
  __typename?: 'UserSearchResult';
  total: Scalars['Int']['output'];
  users: Array<UserSummary>;
};

export type UserSummary = {
  __typename?: 'UserSummary';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  class: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isDeveloper: Scalars['Boolean']['output'];
  isHelper: Scalars['Boolean']['output'];
  isModerator: Scalars['Boolean']['output'];
  isVip: Scalars['Boolean']['output'];
  nickname: Scalars['String']['output'];
  situationId: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
  vipEternal: Scalars['Boolean']['output'];
};

export type SetMoneyMode =
  | 'ADD'
  | 'SET';

export type UserRanking =
  | 'BEATERS'
  | 'BRIBERS'
  | 'DRUNKERS'
  | 'ESCAPERS'
  | 'GAMBLERS'
  | 'HOSPITAL'
  | 'INVESTORS'
  | 'MONEY'
  | 'SCAVENGERS'
  | 'SPENDERS'
  | 'THIEVES'
  | 'WORKERS';

export type GetDashboardStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardStatsQuery = { dashboardStats: { date: string, totalPlayers: number, allUsers: number, bankVaultValue: number, casinoVaultValue: number, totalGangs: number, prisonCount: number, hospitalCount: number, jobCount: number, scavengeCount: number, casinoCount: number, robberyCount: number, beatUpCount: number, idleCount: number, englishCount: number, portugueseCount: number, spanishCount: number } };

export type GetDashboardHistoryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardHistoryQuery = { dashboardHistory: Array<{ id: string | null, date: string, totalPlayers: number, allUsers: number | null, totalGangs: number, prisonCount: number, hospitalCount: number, jobCount: number, scavengeCount: number, casinoCount: number, robberyCount: number, beatUpCount: number, idleCount: number, englishCount: number, portugueseCount: number, spanishCount: number }> };

export type GetEventsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetEventsQuery = { events: Array<{ id: number, type: number, value: number, periodStart: string, periodEnd: string, isActive: boolean }> };

export type CreateEventMutationVariables = Exact<{
  type: number;
  value: number;
  periodStart: string;
  periodEnd: string;
}>;


export type CreateEventMutation = { createEvent: { success: boolean, message: string } };

export type UpdateEventMutationVariables = Exact<{
  id: number;
  value?: number | null | undefined;
  periodStart?: string | null | undefined;
  periodEnd?: string | null | undefined;
}>;


export type UpdateEventMutation = { updateEvent: { success: boolean, message: string } };

export type DeleteEventMutationVariables = Exact<{
  id: number;
}>;


export type DeleteEventMutation = { deleteEvent: { success: boolean, message: string } };

export type SearchUsersQueryVariables = Exact<{
  search?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;


export type SearchUsersQuery = { users: { total: number, users: Array<{ id: string, nickname: string, avatarUrl: string | null, class: number, isVip: boolean, vipEternal: boolean, situationId: number, isDeveloper: boolean, isModerator: boolean, isHelper: boolean, createdAt: string, updatedAt: string }> } };

export type GetTopUsersQueryVariables = Exact<{
  ranking: UserRanking;
  limit: number;
  offset: number;
}>;


export type GetTopUsersQuery = { topUsers: { total: number, entries: Array<{ id: string, nickname: string, avatarUrl: string | null, value: number, count: number | null }> } };

export type GetUserDetailQueryVariables = Exact<{
  id: string | number;
}>;


export type GetUserDetailQuery = { user: { id: string, nickname: string, online: boolean, money: number, avatarUrl: string | null, avatarDecoration: string, specialCoin: number, class: number, className: string, attack: number, defense: number, isVip: boolean, vipEternal: boolean, vipTime: string | null, language: string, isInHospital: boolean, hospitalTime: string | null, isInPrison: boolean, prisonTime: string | null, isWorking: boolean, jobEndsIn: string | null, isScavenging: boolean, isWanted: boolean, wantedTime: string | null, isRobbing: boolean, isBeingRobbed: boolean, isBeating: boolean, isBeingBeated: boolean, isInCasino: boolean, isDefendingInvestment: boolean, isInGangAction: boolean, isDead: boolean, deadUntil: string | null, situationId: number, situationText: string, voteCount: number, createdAt: string, updatedAt: string, gang: { id: number, name: string, imageUrl: string | null, color: string, level: number, role: string } | null, investment: { id: number, name: string, defense: number, expiresAt: string, nextPaymentValue: string, henchmanEndsAt: string | null } | null, activityStats: { dailyMaxStreak: number, dailyCurrentStreak: number, hospitalCount: number, hospitalTreatmentCount: number, hospitalTreatmentSum: number, prisonCount: number, escapeCount: number, prisonBriberySum: number, prisonBriberyCount: number, robberySuccessCount: number, robberyFailureCount: number, robberySuccessRobbedSum: number, robberyBeingRobbedCount: number, robberyBeingRobbedSum: number, beatUpSuccessCount: number, beatUpFailureCount: number, beatUpBeatedUpCount: number, casinoWinCount: number, casinoLoseCount: number, casinoWinSum: number, casinoLoseSum: number, almsReceivedSum: number, almsReceivedCount: number, almsGivenSum: number, almsGivenCount: number, scavengeFoundCount: number, scavengeFailures: number, scavengeHospitalizations: number, scavengePrisonizations: number, jobReceivedSum: number, jobReceivedCount: number, investmentProfit: number, shopSpentSum: number, shopSpentCount: number }, items: Array<{ id: number, name: string, type: number, quantity: number, skin: number, remainingTime: string | null }>, badges: Array<{ id: number, name: string, description: string }> } | null };

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

export type SetItemMutationVariables = Exact<{
  userId: string | number;
  itemId: number;
  mode: SetMoneyMode;
  hoursOrQuantity: number;
}>;


export type SetItemMutation = { setItem: { success: boolean, message: string } };

export type AddSpecialCoinsMutationVariables = Exact<{
  userId: string | number;
  amount: number;
}>;


export type AddSpecialCoinsMutation = { addSpecialCoins: { success: boolean, message: string } };

export type SetClassMutationVariables = Exact<{
  userId: string | number;
  classId: number;
}>;


export type SetClassMutation = { setClass: { success: boolean, message: string } };

export type SetNicknameMutationVariables = Exact<{
  userId: string | number;
  nickname: string;
}>;


export type SetNicknameMutation = { setNickname: { success: boolean, message: string } };

export type SetVipMutationVariables = Exact<{
  userId: string | number;
  days: number;
}>;


export type SetVipMutation = { setVip: { success: boolean, message: string } };

export type KillUserMutationVariables = Exact<{
  userId: string | number;
  days: number;
}>;


export type KillUserMutation = { killUser: { success: boolean, message: string } };

export type AddBadgeMutationVariables = Exact<{
  userId: string | number;
  badgeId: number;
}>;


export type AddBadgeMutation = { addBadge: { success: boolean, message: string } };

export type RemoveBadgeMutationVariables = Exact<{
  userId: string | number;
  badgeId: number;
}>;


export type RemoveBadgeMutation = { removeBadge: { success: boolean, message: string } };

export type SwapUsersMutationVariables = Exact<{
  firstUserId: string | number;
  secondUserId: string | number;
}>;


export type SwapUsersMutation = { swapUsers: { success: boolean, message: string } };


export const GetDashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlayers"}},{"kind":"Field","name":{"kind":"Name","value":"allUsers"}},{"kind":"Field","name":{"kind":"Name","value":"bankVaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"casinoVaultValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalGangs"}},{"kind":"Field","name":{"kind":"Name","value":"prisonCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalCount"}},{"kind":"Field","name":{"kind":"Name","value":"jobCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpCount"}},{"kind":"Field","name":{"kind":"Name","value":"idleCount"}},{"kind":"Field","name":{"kind":"Name","value":"englishCount"}},{"kind":"Field","name":{"kind":"Name","value":"portugueseCount"}},{"kind":"Field","name":{"kind":"Name","value":"spanishCount"}}]}}]}}]} as unknown as DocumentNode<GetDashboardStatsQuery, GetDashboardStatsQueryVariables>;
export const GetDashboardHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboardHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlayers"}},{"kind":"Field","name":{"kind":"Name","value":"allUsers"}},{"kind":"Field","name":{"kind":"Name","value":"totalGangs"}},{"kind":"Field","name":{"kind":"Name","value":"prisonCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalCount"}},{"kind":"Field","name":{"kind":"Name","value":"jobCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpCount"}},{"kind":"Field","name":{"kind":"Name","value":"idleCount"}},{"kind":"Field","name":{"kind":"Name","value":"englishCount"}},{"kind":"Field","name":{"kind":"Name","value":"portugueseCount"}},{"kind":"Field","name":{"kind":"Name","value":"spanishCount"}}]}}]}}]} as unknown as DocumentNode<GetDashboardHistoryQuery, GetDashboardHistoryQueryVariables>;
export const GetEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"events"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<GetEventsQuery, GetEventsQueryVariables>;
export const CreateEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodEnd"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<CreateEventMutation, CreateEventMutationVariables>;
export const UpdateEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"value"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"value"},"value":{"kind":"Variable","name":{"kind":"Name","value":"value"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodEnd"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<UpdateEventMutation, UpdateEventMutationVariables>;
export const DeleteEventDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteEvent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteEvent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DeleteEventMutation, DeleteEventMutationVariables>;
export const SearchUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"class"}},{"kind":"Field","name":{"kind":"Name","value":"isVip"}},{"kind":"Field","name":{"kind":"Name","value":"vipEternal"}},{"kind":"Field","name":{"kind":"Name","value":"situationId"}},{"kind":"Field","name":{"kind":"Name","value":"isDeveloper"}},{"kind":"Field","name":{"kind":"Name","value":"isModerator"}},{"kind":"Field","name":{"kind":"Name","value":"isHelper"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<SearchUsersQuery, SearchUsersQueryVariables>;
export const GetTopUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ranking"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRanking"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ranking"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ranking"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<GetTopUsersQuery, GetTopUsersQueryVariables>;
export const GetUserDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"online"}},{"kind":"Field","name":{"kind":"Name","value":"money"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"avatarDecoration"}},{"kind":"Field","name":{"kind":"Name","value":"specialCoin"}},{"kind":"Field","name":{"kind":"Name","value":"gang"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"Field","name":{"kind":"Name","value":"class"}},{"kind":"Field","name":{"kind":"Name","value":"className"}},{"kind":"Field","name":{"kind":"Name","value":"attack"}},{"kind":"Field","name":{"kind":"Name","value":"defense"}},{"kind":"Field","name":{"kind":"Name","value":"isVip"}},{"kind":"Field","name":{"kind":"Name","value":"vipEternal"}},{"kind":"Field","name":{"kind":"Name","value":"vipTime"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"isInHospital"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTime"}},{"kind":"Field","name":{"kind":"Name","value":"isInPrison"}},{"kind":"Field","name":{"kind":"Name","value":"prisonTime"}},{"kind":"Field","name":{"kind":"Name","value":"isWorking"}},{"kind":"Field","name":{"kind":"Name","value":"jobEndsIn"}},{"kind":"Field","name":{"kind":"Name","value":"isScavenging"}},{"kind":"Field","name":{"kind":"Name","value":"isWanted"}},{"kind":"Field","name":{"kind":"Name","value":"wantedTime"}},{"kind":"Field","name":{"kind":"Name","value":"isRobbing"}},{"kind":"Field","name":{"kind":"Name","value":"isBeingRobbed"}},{"kind":"Field","name":{"kind":"Name","value":"isBeating"}},{"kind":"Field","name":{"kind":"Name","value":"isBeingBeated"}},{"kind":"Field","name":{"kind":"Name","value":"isInCasino"}},{"kind":"Field","name":{"kind":"Name","value":"isDefendingInvestment"}},{"kind":"Field","name":{"kind":"Name","value":"isInGangAction"}},{"kind":"Field","name":{"kind":"Name","value":"isDead"}},{"kind":"Field","name":{"kind":"Name","value":"deadUntil"}},{"kind":"Field","name":{"kind":"Name","value":"investment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"defense"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextPaymentValue"}},{"kind":"Field","name":{"kind":"Name","value":"henchmanEndsAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"situationId"}},{"kind":"Field","name":{"kind":"Name","value":"situationText"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"activityStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailyMaxStreak"}},{"kind":"Field","name":{"kind":"Name","value":"dailyCurrentStreak"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTreatmentCount"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTreatmentSum"}},{"kind":"Field","name":{"kind":"Name","value":"prisonCount"}},{"kind":"Field","name":{"kind":"Name","value":"escapeCount"}},{"kind":"Field","name":{"kind":"Name","value":"prisonBriberySum"}},{"kind":"Field","name":{"kind":"Name","value":"prisonBriberyCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberySuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyFailureCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberySuccessRobbedSum"}},{"kind":"Field","name":{"kind":"Name","value":"robberyBeingRobbedCount"}},{"kind":"Field","name":{"kind":"Name","value":"robberyBeingRobbedSum"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpSuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpFailureCount"}},{"kind":"Field","name":{"kind":"Name","value":"beatUpBeatedUpCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoWinCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoLoseCount"}},{"kind":"Field","name":{"kind":"Name","value":"casinoWinSum"}},{"kind":"Field","name":{"kind":"Name","value":"casinoLoseSum"}},{"kind":"Field","name":{"kind":"Name","value":"almsReceivedSum"}},{"kind":"Field","name":{"kind":"Name","value":"almsReceivedCount"}},{"kind":"Field","name":{"kind":"Name","value":"almsGivenSum"}},{"kind":"Field","name":{"kind":"Name","value":"almsGivenCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeFoundCount"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeFailures"}},{"kind":"Field","name":{"kind":"Name","value":"scavengeHospitalizations"}},{"kind":"Field","name":{"kind":"Name","value":"scavengePrisonizations"}},{"kind":"Field","name":{"kind":"Name","value":"jobReceivedSum"}},{"kind":"Field","name":{"kind":"Name","value":"jobReceivedCount"}},{"kind":"Field","name":{"kind":"Name","value":"investmentProfit"}},{"kind":"Field","name":{"kind":"Name","value":"shopSpentSum"}},{"kind":"Field","name":{"kind":"Name","value":"shopSpentCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"skin"}},{"kind":"Field","name":{"kind":"Name","value":"remainingTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"badges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetUserDetailQuery, GetUserDetailQueryVariables>;
export const SetMoneyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetMoney"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetMoneyMode"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setMoney"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"mode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"money"}}]}}]}}]}}]} as unknown as DocumentNode<SetMoneyMutation, SetMoneyMutationVariables>;
export const CureUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CureUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cureUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isInHospital"}},{"kind":"Field","name":{"kind":"Name","value":"hospitalTime"}}]}}]}}]}}]} as unknown as DocumentNode<CureUserMutation, CureUserMutationVariables>;
export const FreeUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FreeUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"freeUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isInPrison"}},{"kind":"Field","name":{"kind":"Name","value":"prisonTime"}}]}}]}}]}}]} as unknown as DocumentNode<FreeUserMutation, FreeUserMutationVariables>;
export const ResetCooldownDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetCooldown"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cooldown"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetCooldown"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"cooldown"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cooldown"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ResetCooldownMutation, ResetCooldownMutationVariables>;
export const RemoveActionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveAction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeAction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RemoveActionMutation, RemoveActionMutationVariables>;
export const SetItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"mode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetMoneyMode"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hoursOrQuantity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"itemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"itemId"}}},{"kind":"Argument","name":{"kind":"Name","value":"mode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"mode"}}},{"kind":"Argument","name":{"kind":"Name","value":"hoursOrQuantity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hoursOrQuantity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SetItemMutation, SetItemMutationVariables>;
export const AddSpecialCoinsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddSpecialCoins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSpecialCoins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<AddSpecialCoinsMutation, AddSpecialCoinsMutationVariables>;
export const SetClassDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetClass"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setClass"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"classId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SetClassMutation, SetClassMutationVariables>;
export const SetNicknameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetNickname"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nickname"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setNickname"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"nickname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nickname"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SetNicknameMutation, SetNicknameMutationVariables>;
export const SetVipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetVip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setVip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"days"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SetVipMutation, SetVipMutationVariables>;
export const KillUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"KillUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"killUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"days"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<KillUserMutation, KillUserMutationVariables>;
export const AddBadgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddBadge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"badgeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addBadge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"badgeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"badgeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<AddBadgeMutation, AddBadgeMutationVariables>;
export const RemoveBadgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveBadge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"badgeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeBadge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"badgeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"badgeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RemoveBadgeMutation, RemoveBadgeMutationVariables>;
export const SwapUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SwapUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"firstUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"secondUserId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"swapUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"firstUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"firstUserId"}}},{"kind":"Argument","name":{"kind":"Name","value":"secondUserId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"secondUserId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SwapUsersMutation, SwapUsersMutationVariables>;