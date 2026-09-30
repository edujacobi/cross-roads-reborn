export const typeDefs = /* GraphQL */ `
    enum Role {
        DEVELOPER
        MODERATOR
        HELPER
    }

    enum SetMoneyMode {
        ADD
        SET
    }

    enum UserRanking {
        MONEY
        GAMBLERS
        SPENDERS
        THIEVES
        WORKERS
        DRUNKERS
        BEATERS
        SCAVENGERS
        HOSPITAL
        BRIBERS
        ESCAPERS
        INVESTORS
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
        allUsers: Int!
        bankVaultValue: Int!
        casinoVaultValue: Int!
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
        allUsers: Int
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

    type UserRankingEntry {
        id: ID!
        nickname: String!
        avatarUrl: String
        gangName: String
        gangColor: String
        value: Float!
        count: Float
    }

    type UserRankingResult {
        entries: [UserRankingEntry!]!
        total: Int!
    }

    type GangRankingEntry {
        id: ID!
        name: String!
        acronym: String!
        imageUrl: String
        level: Int!
        experience: Int!
        memberRole: String
        color: String!
    }

    type GangRankingResult {
        entries: [GangRankingEntry!]!
        total: Int!
        currentUserGangId: ID
        currentUserGangName: String
        currentUserGangColor: String
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

    type UserActivityStats {
        dailyMaxStreak: Int!
        dailyCurrentStreak: Int!
        hospitalCount: Int!
        hospitalTreatmentCount: Int!
        hospitalTreatmentSum: Int!
        prisonCount: Int!
        escapeCount: Int!
        prisonBriberySum: Int!
        prisonBriberyCount: Int!
        robberySuccessCount: Int!
        robberyFailureCount: Int!
        robberySuccessRobbedSum: Int!
        robberyBeingRobbedCount: Int!
        robberyBeingRobbedSum: Int!
        beatUpSuccessCount: Int!
        beatUpFailureCount: Int!
        beatUpBeatedUpCount: Int!
        casinoWinCount: Int!
        casinoLoseCount: Int!
        casinoWinSum: Int!
        casinoLoseSum: Int!
        almsReceivedSum: Int!
        almsReceivedCount: Int!
        almsGivenSum: Int!
        almsGivenCount: Int!
        scavengeFoundCount: Int!
        scavengeFailures: Int!
        scavengeHospitalizations: Int!
        scavengePrisonizations: Int!
        jobReceivedSum: Int!
        jobReceivedCount: Int!
        investmentProfit: Int!
        shopSpentSum: Int!
        shopSpentCount: Int!
    }

    type InvestmentInfo {
        id: Int!
        name: String!
        defense: Int!
        expiresAt: String!
        nextPaymentValue: String!
        henchmanEndsAt: String
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
        online: Boolean!
        avatarUrl: String
        avatarDecoration: String!
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
        wantedTime: String
        isRobbing: Boolean!
        isBeingRobbed: Boolean!
        isBeating: Boolean!
        isBeingBeated: Boolean!
        isInCasino: Boolean!
        isDefendingInvestment: Boolean!
        isInGangAction: Boolean!
        isDead: Boolean!
        deadUntil: String
        investment: InvestmentInfo,
        situationId: Int!,
        situationText: String!
        items: [UserItemInfo!]!
        voteCount: Int!
        activityStats: UserActivityStats!
        badges: [UserBadgeInfo!]!
        createdAt: String!
        updatedAt: String!
    }

    type Event {
        id: Int!
        type: Int!
        value: Float!
        periodStart: String!
        periodEnd: String!
        isActive: Boolean!
    }

    type EventMutationResult {
        success: Boolean!
        message: String!
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
        events: [Event!]!
        users(search: String, limit: Int, offset: Int): UserSearchResult!
        topUsers(ranking: UserRanking!, limit: Int, offset: Int): UserRankingResult!
        topGangs(limit: Int, offset: Int): GangRankingResult!
        user(id: ID!): UserDetail
    }

    type Mutation {
        setMoney(userId: ID!, amount: Int!, mode: SetMoneyMode!): MutationResult!
        cureUser(userId: ID!): MutationResult!
        freeUser(userId: ID!): MutationResult!
        resetCooldown(userId: ID!, cooldown: String!): MutationResult!
        removeAction(userId: ID!, action: String!): MutationResult!
        setItem(userId: ID!, itemId: Int!, mode: SetMoneyMode!, hoursOrQuantity: Float!): MutationResult!
        addSpecialCoins(userId: ID!, amount: Int!): MutationResult!
        setClass(userId: ID!, classId: Int!): MutationResult!
        setNickname(userId: ID!, nickname: String!): MutationResult!
        setVip(userId: ID!, days: Int!): MutationResult!
        killUser(userId: ID!, days: Int!): MutationResult!
        addBadge(userId: ID!, badgeId: Int!): MutationResult!
        removeBadge(userId: ID!, badgeId: Int!): MutationResult!
        swapUsers(firstUserId: ID!, secondUserId: ID!): MutationResult!
        createEvent(type: Int!, value: Float!, periodStart: String!, periodEnd: String!): EventMutationResult!
        updateEvent(id: Int!, value: Float, periodStart: String, periodEnd: String): EventMutationResult!
        deleteEvent(id: Int!): EventMutationResult!
    }
`;
