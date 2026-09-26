export const typeDefs = /* GraphQL */ `
    enum Role {
        DEVELOPER
        MODERATOR
    }

    enum SetMoneyMode {
        ADD
        SET
    }

    type AuthUser {
        userId: ID!
        username: String!
        avatar: String
        role: Role!
    }

    type DashboardStats {
        date: String!
        totalPlayers: Int!
        totalGangs: Int!
        prisonCount: Int!
        hospitalCount: Int!
        jobCount: Int!
        scavengeCount: Int!
        casinoCount: Int!
        robberyCount: Int!
        beatUpCount: Int!
        idleCount: Int!
        englishCount: Int!
        portugueseCount: Int!
        spanishCount: Int!
    }

    type DashboardSnapshot {
        id: ID
        date: String!
        totalPlayers: Int!
        totalGangs: Int!
        prisonCount: Int!
        hospitalCount: Int!
        jobCount: Int!
        scavengeCount: Int!
        casinoCount: Int!
        robberyCount: Int!
        beatUpCount: Int!
        idleCount: Int!
        englishCount: Int!
        portugueseCount: Int!
        spanishCount: Int!
    }

    type UserSummary {
        id: ID!
        nickname: String!
        avatarUrl: String
        class: Int!
        isVip: Boolean!
        vipEternal: Boolean!
        situationId: Int!
        isDeveloper: Boolean!
        isModerator: Boolean!
        isHelper: Boolean!
        createdAt: String!
        updatedAt: String!
    }

    type UserSearchResult {
        users: [UserSummary!]!
        total: Int!
    }

    type UserItemInfo {
        id: Int!
        name: String!
        type: Int!
        quantity: Int!
        skin: Int!
        remainingTime: String
    }

    type UserBadgeInfo {
        id: Int!
        name: String!
        description: String!
    }

    type InvestmentInfo {
        id: Int!
        name: String!
        imageUrl: String!
        defense: Int!
        expiresAt: String!
    }

    type GangInfo {
        id: Int!
        name: String!
        imageUrl: String
        role: String!
        level: Int!
        color: String!
    }

    type UserDetail {
        id: ID!
        nickname: String!
        avatarUrl: String
        money: Int!
        specialCoin: Int!
        gang: GangInfo
        class: Int!
        className: String!
        attack: Float!
        defense: Float!
        isVip: Boolean!
        vipEternal: Boolean!
        vipTime: String
        language: String!
        isInHospital: Boolean!
        hospitalTime: String
        isInPrison: Boolean!
        prisonTime: String
        isWorking: Boolean!
        jobEndsIn: String
        isScavenging: Boolean!
        isWanted: Boolean!
        isInCasino: Boolean!
        investment: InvestmentInfo,
        situationId: Int!,
        situationText: String!
        items: [UserItemInfo!]!
        dailyStreak: Int!
        voteCount: Int!
        badges: [UserBadgeInfo!]!
        createdAt: String!
        updatedAt: String!
    }

    type MutationResult {
        success: Boolean!
        message: String!
        user: UserDetail
    }

    type Query {
        me: AuthUser
        dashboardStats: DashboardStats!
        dashboardHistory: [DashboardSnapshot!]!
        users(search: String, limit: Int, offset: Int): UserSearchResult!
        user(id: ID!): UserDetail
    }

    type Mutation {
        setMoney(userId: ID!, amount: Int!, mode: SetMoneyMode!): MutationResult!
        cureUser(userId: ID!): MutationResult!
        freeUser(userId: ID!): MutationResult!
        resetCooldown(userId: ID!, cooldown: String!): MutationResult!
        removeAction(userId: ID!, action: String!): MutationResult!
    }
`;
