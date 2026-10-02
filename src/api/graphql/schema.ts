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

    type ClassCount {
        classId: Int!
        count: Int!
    }

    type DashboardStats {
        date: String!
        totalPlayers: Int!
        allUsers: Int!
        classCounts: [ClassCount!]!
        bankVaultValue: Float!
        casinoVaultValue: Float!
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
        classCounts: [ClassCount!]
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

    type DashboardItemPopularity {
        itemId: Int!
        name: String!
        userCount: Int!
    }

    type UserSummary {
        id: ID!
        nickname: String!
        avatarUrl: String
        class: Int!
        isVip: Boolean!
        vipEternal: Boolean!
        vipTime: String
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
        avatarDecoration: String!
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
        hospitalTreatmentSum: Float!
        prisonCount: Int!
        escapeCount: Int!
        prisonBriberySum: Float!
        prisonBriberyCount: Int!
        robberySuccessCount: Int!
        robberyFailureCount: Int!
        robberySuccessRobbedSum: Float!
        robberyBeingRobbedCount: Int!
        robberyBeingRobbedSum: Float!
        beatUpSuccessCount: Int!
        beatUpFailureCount: Int!
        beatUpBeatedUpCount: Int!
        casinoWinCount: Int!
        casinoLoseCount: Int!
        casinoWinSum: Float!
        casinoLoseSum: Float!
        almsReceivedSum: Float!
        almsReceivedCount: Int!
        almsGivenSum: Float!
        almsGivenCount: Int!
        scavengeFoundCount: Int!
        scavengeFailures: Int!
        scavengeHospitalizations: Int!
        scavengePrisonizations: Int!
        jobReceivedSum: Float!
        jobReceivedCount: Int!
        investmentProfit: Float!
        shopSpentSum: Float!
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
        money: Float!
        specialCoin: Float!
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

    type SeasonInfo {
        number: Int!
        startDate: String!
        endDate: String!
        daysRemaining: Int!
        mainHeistAllowed: Boolean!
    }

    type SeasonMutationResult {
        success: Boolean!
        message: String!
    }

    type SeasonRankingUser {
        id: ID!
        nickname: String!
        class: Int!
        value: Float!
    }

    type SeasonRankingGang {
        id: Int!
        name: String!
        level: Int!
    }

    type SeasonWipeStats {
        activeUsers: Int!
        activeGangs: Int!
        gangMembers: Int!
        gangRoles: Int!
        gangHeists: Int!
        items: Int!
        robberies: Int!
        notifications: Int!
        lotteryTickets: Int!
        investments: Int!
        horseRaceBets: Int!
    }

    type SeasonEndPreview {
        topMoney: [SeasonRankingUser!]!
        topGambler: [SeasonRankingUser!]!
        topSpender: [SeasonRankingUser!]!
        topThiefProfit: [SeasonRankingUser!]!
        topThiefQuantity: [SeasonRankingUser!]!
        topWorker: [SeasonRankingUser!]!
        topBeater: [SeasonRankingUser!]!
        topScavenger: [SeasonRankingUser!]!
        topHospital: [SeasonRankingUser!]!
        topBriber: [SeasonRankingUser!]!
        topEscaper: [SeasonRankingUser!]!
        topDrunk: [SeasonRankingUser!]!
        topInvestor: [SeasonRankingUser!]!
        topGang: [SeasonRankingGang!]!
        stats: SeasonWipeStats!
    }

    type MutationResult {
        success: Boolean!
        message: String!
        user: UserDetail
    }

    type AdminAuditEntry {
        id: ID!
        adminId: ID!
        adminName: String!
        action: String!
        target: String!
        previousValue: String!
        newValue: String!
        createdAt: String!
    }

    type AdminAuditLogPage {
        entries: [AdminAuditEntry!]!
        total: Int!
    }

    type Query {
        me: AuthUser
        adminAuditLogs(limit: Int, offset: Int): AdminAuditLogPage!
        dashboardStats: DashboardStats!
        dashboardHistory: [DashboardSnapshot!]!
        dashboardItemPopularity: [DashboardItemPopularity!]!
        events: [Event!]!
        seasonInfo: SeasonInfo!
        seasonEndPreview: SeasonEndPreview!
        users(search: String, limit: Int, offset: Int, vipOnly: Boolean): UserSearchResult!
        topUsers(ranking: UserRanking!, limit: Int, offset: Int): UserRankingResult!
        topGangs(limit: Int, offset: Int): GangRankingResult!
        user(id: ID!): UserDetail
    }

    type Mutation {
        setMoney(userId: ID!, amount: Float!, mode: SetMoneyMode!): MutationResult!
        cureUser(userId: ID!): MutationResult!
        freeUser(userId: ID!): MutationResult!
        resetCooldown(userId: ID!, cooldown: String!): MutationResult!
        removeAction(userId: ID!, action: String!): MutationResult!
        setItem(userId: ID!, itemId: Int!, mode: SetMoneyMode!, hoursOrQuantity: Float!): MutationResult!
        addSpecialCoins(userId: ID!, amount: Float!): MutationResult!
        setClass(userId: ID!, classId: Int!): MutationResult!
        setNickname(userId: ID!, nickname: String!): MutationResult!
        setVip(userId: ID!, days: Int!, eternal: Boolean!): MutationResult!
        killUser(userId: ID!, days: Int!): MutationResult!
        addBadge(userId: ID!, badgeId: Int!): MutationResult!
        removeBadge(userId: ID!, badgeId: Int!): MutationResult!
        swapUsers(firstUserId: ID!, secondUserId: ID!): MutationResult!
        deleteUser(userId: ID!): MutationResult!
        createEvent(type: Int!, value: Float!, periodStart: String!, periodEnd: String!): EventMutationResult!
        updateEvent(id: Int!, value: Float, periodStart: String, periodEnd: String): EventMutationResult!
        deleteEvent(id: Int!): EventMutationResult!
        setMainHeistAllowed(allowed: Boolean!): SeasonMutationResult!
        endSeason(isPreSeason: Boolean!): SeasonMutationResult!
    }
`;
