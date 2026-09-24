import { gql } from "@apollo/client/core";
import type { BundleId } from "../../src/core/types/Ids";

export interface DashboardStatsDto {
	date: number;
	totalPlayers: number;
	totalGangs: number;
	prisonCount: number;
	hospitalCount: number;
	jobCount: number;
	scavengeCount: number;
	casinoCount: number;
	robberyCount: number;
	beatUpCount: number;
	idleCount: number;
	englishCount: number;
	portugueseCount: number;
	spanishCount: number;
}

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      date
      totalPlayers
      totalGangs
      prisonCount
      hospitalCount
      jobCount
      scavengeCount
      casinoCount
      robberyCount
      beatUpCount
      idleCount
      englishCount
      portugueseCount
      spanishCount
    }
  }
`;

export interface DashboardHistoryDto {
	id: number;
	date: number;
	totalPlayers: number;
	totalGangs: number;
	prisonCount: number;
	hospitalCount: number;
	jobCount: number;
	scavengeCount: number;
	casinoCount: number;
	robberyCount: number;
	beatUpCount: number;
	idleCount: number;
	englishCount: number;
	portugueseCount: number;
	spanishCount: number;
}

export const GET_DASHBOARD_HISTORY = gql`
  query GetDashboardHistory {
    dashboardHistory {
      id
      date
      totalPlayers
      totalGangs
      prisonCount
      hospitalCount
      jobCount
      scavengeCount
      casinoCount
      robberyCount
      beatUpCount
      idleCount
      englishCount
      portugueseCount
      spanishCount
    }
  }
`;

export interface SimpleUserDto {
	id: number;
	nickname: string;
	money: number;
	specialCoin: number;
	class: number;
	className: string;
	isVip: boolean;
	vipEternal: boolean;
	isInHospital: boolean;
	isInPrison: boolean;
	isWorking: boolean;
}

export const SEARCH_USERS = gql`
  query SearchUsers($search: String, $limit: Int, $offset: Int) {
    users(search: $search, limit: $limit, offset: $offset) {
      total
      users {
        id
        nickname
        money
        specialCoin
        class
        className
        isVip
        vipEternal
        isInHospital
        isInPrison
        isWorking
      }
    }
  }
`;

export interface UserItemDto {
	id: number;
	name: string;
	type: number;
	quantity: number;
	skin: BundleId;
	remainingTime: string;
}

export interface UserDetailsDto {
	id: number;
	nickname: string;
	money: number;
	specialCoin: number;
	gangId: number;
	class: number;
	className: string;
	attack: number;
	defense: number;
	isVip: boolean;
	vipEternal: boolean;
	vipTime: number;
	language: string;
	isInHospital: boolean;
	hospitalTime: number;
	isInPrison: boolean;
	prisonTime: number;
	isWorking: boolean;
	jobEndsIn: number;
	isScavenging: boolean;
	isWanted: boolean;
	isInCasino: boolean;
	investmentId: boolean;
	situationId: boolean;
	dailyStreak: number;
	voteCount: number;
	items: UserItemDto[];
}

export const GET_USER_DETAIL = gql`
    query GetUserDetail($id: ID!) {
        user(id: $id) {
            id
            nickname
            money
            specialCoin
	        gangId
            class
            className
	        attack
	        defense
            isVip
            vipEternal
            vipTime
            language
            isInHospital
            hospitalTime
            isInPrison
            prisonTime
            isWorking
            jobEndsIn
            isScavenging
            isWanted
	        isInCasino
	        investmentId
	        situationId
            dailyStreak
            voteCount
            items {
                id
                name
                type
                quantity
                skin
                remainingTime
            }
        }
    }
`;

export const MUTATION_SET_MONEY = gql`
  mutation SetMoney($userId: ID!, $amount: Int!, $mode: SetMoneyMode!) {
    setMoney(userId: $userId, amount: $amount, mode: $mode) {
      success
      message
      user {
        id
        money
      }
    }
  }
`;

export const MUTATION_CURE_USER = gql`
  mutation CureUser($userId: ID!) {
    cureUser(userId: $userId) {
      success
      message
      user {
        id
        isInHospital
        hospitalTime
      }
    }
  }
`;

export const MUTATION_FREE_USER = gql`
  mutation FreeUser($userId: ID!) {
    freeUser(userId: $userId) {
      success
      message
      user {
        id
        isInPrison
        prisonTime
      }
    }
  }
`;

export const MUTATION_RESET_COOLDOWN = gql`
  mutation ResetCooldown($userId: ID!, $cooldown: String!) {
    resetCooldown(userId: $userId, cooldown: $cooldown) {
      success
      message
    }
  }
`;

export const MUTATION_REMOVE_ACTION = gql`
  mutation RemoveAction($userId: ID!, $action: String!) {
    removeAction(userId: $userId, action: $action) {
      success
      message
    }
  }
`;
