export const typeDefs = /* GraphQL */ `
    enum Role {
        DEVELOPER
        MODERATOR
        HELPER
        PLAYER
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
        situationId: Int!
        gangId: Int
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
        avatarDecoration: String!
        backgroundDecoration: String!
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
        backgroundDecoration: String!
        gangName: String
        gangAcronym: String
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
        defense: Int
        expiresAt: String!
        nextPaymentValue: String
        henchmanEndsAt: String
    }

    type InvestmentOption {
        id: Int!
        name: String!
        description: String!
        price: Float!
        hourlyYield: Float!
        defense: Int!
        henchmanFee: Int!
    }

    type ActiveInvestment {
        id: Int!
        accumulatedYield: Float!
        expiresAt: String!
        defense: Int!
        henchmanEndsAt: String
        henchmanHospitalized: Boolean!
        hasHenchman: Boolean!
        notifyYield: Boolean!
    }

    type MyInvestmentPage {
        money: Float!
        isIdling: Boolean!
        nextPaymentAt: String!
        investments: [InvestmentOption!]!
        investment: ActiveInvestment
    }

    type GangInfo {
        id: Int!
        name: String!
        imageUrl: String
        role: String!
        level: Int!
        color: String!
    }

    type GangMemberInfo {
        userId: ID!
        nickname: String!
        avatarUrl: String
        avatarDecoration: String
        backgroundDecoration: String
        roleId: Int!
        roleName: String!
        permissionCount: Int!
        depositAmount: Float!
        depositTime: String
        lastDepositAt: String
    }

    type GangRoleInfo {
        id: Int!
        name: String!
        canInvite: Boolean!
        canKick: Boolean!
        canPromote: Boolean!
        canEditGang: Boolean!
        canImport: Boolean!
    }

    type GangBaseInfo {
        id: Int!
        name: String!
        modifierDefense: Float
        modifierAttack: Float
        modifierPrisonEscape: Float
    }

    type GangDetail {
        id: Int!
        name: String!
        acronym: String!
        description: String!
        money: Float!
        maxDepositAmount: Float!
        level: Int!
        experience: Int!
        xpForNextLevel: Int!
        color: String!
        imageUrl: String
        base: GangBaseInfo
        shipmentStartedAt: String
        shipmentArrivesAt: String
        importCost: Float
        importSuccessChance: Float
        canImport: Boolean!
        canStartImport: Boolean
        canViewShipmentInfo: Boolean!
        leaderId: ID!
        leaderNickname: String
        leaderAvatarUrl: String
        members: [GangMemberInfo!]!
        roles: [GangRoleInfo!]!
        createdAt: String!
    }

    type UserDetail {
        id: ID!
        nickname: String!
        online: Boolean!
        avatarUrl: String
        avatarDecoration: String!
        backgroundDecoration: String!
        money: Float!
        specialCoin: Float
        automaticGrenade: Boolean
        dailyNextAvailableAt: String
        nicknameChangeCost: Float!
        classChangeCost: Float!
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
        escapeHasTried: Boolean!
        prisonHasPaidBribe: Boolean!
        isWorking: Boolean!
        currentJobId: Int
        jobEndsIn: String
        isScavenging: Boolean!
        scavengingId: Int
        robberUserId: ID
        robbedByUserId: ID
        robberyLocationId: Int
        robberyLocationName: String
        beaterUserId: ID
        beatenByUserId: ID
        activityTargetNickname: String
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
        items: [UserItemInfo!]!
        voteCount: Int!
        activityStats: UserActivityStats!
        badges: [UserBadgeInfo!]!
        createdAt: String!
        updatedAt: String!
    }

    type UserHistoryParticipant {
        id: ID!
        nickname: String!
        avatarUrl: String
    }

    type UserHistoryEntry {
        id: ID!
        attackerId: ID!
        defenderId: ID
        attacker: UserHistoryParticipant
        defender: UserHistoryParticipant
        locationId: Int
        locationName: String
        type: Int!
        success: Boolean!
        money: Float!
        createdAt: String!
    }

    type UserHistoryResult {
        entries: [UserHistoryEntry!]!
        total: Int!
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
        adminAvatarUrl: String
        adminIpAddress: String
        adminDeviceType: String
        adminOperatingSystem: String
        adminBrowser: String
        actionId: Int!
        targetUserId: ID
        targetUserName: String
        targetUserAvatarUrl: String
        targetSettingId: Int
        previousValue: String!
        newValue: String!
        createdAt: String!
    }

    type AdminAuditLogPage {
        entries: [AdminAuditEntry!]!
        total: Int!
    }

    type ItemSkin {
        bundleId: Int!
        bundleName: String!
        emoteId: String!
        emoteString: String!
        imagePath: String!
    }

    type ItemSpecial {
        day: Boolean!
        night: Boolean!
    }

    type ItemDetails {
        id: Int!
        type: Int!
        typeName: String!
        name: String!
        namePt: String!
        nameEn: String!
        nameEs: String!
        price: Float!
        shop: Boolean!
        blackMarket: Boolean!
        attack: Int!
        defense: Int!
        moneyAttack: Float!
        moneyDefense: Float!
        moreAttack: Int!
        moreDefense: Int!
        moreMoneyATK: Float!
        moreMoneyDEF: Float!
        extra: String
        special: ItemSpecial!
        skins: [ItemSkin!]!
        userCount: Int!
        defaultImagePath: String!
    }

    type JobNeedItem {
        id: Int!
        name: String!
        defaultImagePath: String!
    }

    type JobInfo {
        id: Int!
        name: String!
        duration: Float!
        salary: Float!
        special: Boolean!
        needItems: [JobNeedItem!]!
    }

    type JobMutationResult {
        success: Boolean!
        message: String!
        user: UserDetail
    }

    type HospitalizedUser {
        id: ID!
        nickname: String!
        avatarUrl: String
        avatarDecoration: String
        class: Int!
        hospitalTime: String!
        hospitalCount: Int!
    }

    type DeadUser {
        id: ID!
        nickname: String!
        avatarUrl: String
        avatarDecoration: String
        class: Int!
        deadUntil: String!
    }

    type PrisonerUser {
        id: ID!
        nickname: String!
        avatarUrl: String
        avatarDecoration: String
        class: Int!
        prisonTime: String!
        robberyFailureCount: Int!
        escapeCount: Int!
    }

    type HospitalizedUserPage {
        entries: [HospitalizedUser!]!
        total: Int!
    }

    type PrisonerUserPage {
        entries: [PrisonerUser!]!
        total: Int!
    }

    type HospitalResult {
        success: Boolean!
        message: String!
        money: Float!
        privatePrice: Float
    }

    type PrisonEscapeStartResult {
        success: Boolean!
        message: String!
        duration: Int!
    }

    enum ScavengeRewardItemType {
        Consumable
        Duration
    }

    type ScavengeRewardItem {
        itemId: Int!
        name: String!
        itemType: ScavengeRewardItemType!
        durationMin: Float!
        durationMax: Float!
        defaultImagePath: String!
    }

    type ScavengeLocation {
        id: Int!
        name: String!
        subtitle: String!
        emoteString: String!
        needAttack: Int!
        successChance: Float!
        prisonChance: Float!
        hospitalChance: Float!
        rewardMoneyMin: Float!
        rewardMoneyMax: Float!
        rewardItems: [ScavengeRewardItem!]!
        prisonText: String!
        hospitalText: String!
    }

    type ScavengeStatus {
        isScavenging: Boolean!
        scavengingId: Int
        scavengeTime: String
    }

    type LotteryStatus {
        hasActiveDraw: Boolean!
        drawId: Int
        drawTime: String
        ticketPrice: Float
        ticketCost: Float
        isMegaDraw: Boolean!
        totalTickets: Int!
        prizePool: Float!
        hasTicket: Boolean!
        ticketId: Int
        previousWinnerName: String
        previousPrize: Float
        money: Float!
    }

    type CasinoStatus {
        money: Float!
    }

    type HorseRaceHorse {
        id: Int!
        name: String!
        description: String!
        emote: String!
        multiplier: Float!
    }

    type HorseRaceStatus {
        raceId: Int
        raceTime: String
        isBettingOpen: Boolean!
        totalBets: Int!
        hasBet: Boolean!
        betHorseId: Int
        betAmount: Float
        maxBet: Float!
        money: Float!
        horses: [HorseRaceHorse!]!
    }

    type CasinoPlayResult {
        success: Boolean!
        message: String!
        money: Float!
        won: Boolean
        resultSide: String
        selectedSide: String
        amount: Float
        prize: Float
    }

    type LotteryPurchaseResult {
        success: Boolean!
        message: String!
        money: Float!
        ticketId: Int
    }

    type HorseRaceBetResult {
        success: Boolean!
        message: String!
        money: Float!
        horseId: Int
        horseName: String
        multiplier: Float
        amount: Float
        raceTime: String
    }

    type ScavengeStartResult {
        success: Boolean!
        message: String!
    }

    type PrisonBribeResult {
        success: Boolean!
        message: String!
        money: Float!
        bribeAccepted: Boolean
        bribeCost: Float
    }

    type GangMutationResult {
        success: Boolean!
        message: String!
    }

    type MyPrisonStatus {
        isInPrison: Boolean!
        prisonTime: String
        escapeHasTried: Boolean!
        escapeTime: String
        prisonHasPaidBribe: Boolean!
    }

    type Query {
        me: AuthUser
        adminAuditLogs(limit: Int, offset: Int, actionId: Int): AdminAuditLogPage!
        dashboardStats: DashboardStats!
        dashboardHistory: [DashboardSnapshot!]!
        dashboardItemPopularity: [DashboardItemPopularity!]!
        events: [Event!]!
        seasonInfo: SeasonInfo!
        seasonEndPreview: SeasonEndPreview!
        users(search: String, limit: Int, offset: Int, vipOnly: Boolean, sortBy: String, sortOrder: String): UserSearchResult!
        topUsers(ranking: UserRanking!, limit: Int, offset: Int): UserRankingResult!
        topGangs(limit: Int, offset: Int): GangRankingResult!
        gang(id: ID!): GangDetail
        user(id: ID!): UserDetail
        userHistory(userId: ID!, limit: Int, offset: Int): UserHistoryResult!
        items: [ItemDetails!]!
        blackMarketOpen: Boolean!
        jobs: [JobInfo!]!
        hospitalizedUsers(search: String, limit: Int, offset: Int, sortBy: String, sortOrder: String): HospitalizedUserPage!
        deadUsers: [DeadUser!]!
        prisoners(search: String, limit: Int, offset: Int, sortBy: String, sortOrder: String): PrisonerUserPage!
        bribeCost: Float
        privateHospitalCost: Float
        myPrisonStatus: MyPrisonStatus!
        scavengeLocations: [ScavengeLocation!]!
        myScavengeStatus: ScavengeStatus!
        myLotteryStatus: LotteryStatus!
        myHorseRaceStatus: HorseRaceStatus!
        myCasinoStatus: CasinoStatus!
        myInvestmentPage: MyInvestmentPage!
        almsStatus(receiverId: ID!): AlmsStatus!
    }

    type ShopBuyResult {
        success: Boolean!
        message: String!
        money: Float!
    }

    type AlmsStatus {
        canGive: Boolean!
        value: Float!
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
        claimDailyReward: MutationResult!
        changeOwnNickname(nickname: String!): MutationResult!
        changeOwnClass(classId: Int!): MutationResult!
        setOwnAutomaticGrenade(enabled: Boolean!): MutationResult!
        giveAlms(receiverId: ID!): MutationResult!
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
        buyItem(itemId: Int!, units: Int): ShopBuyResult!
        startJob(jobId: Int!): JobMutationResult!
        cancelJob: JobMutationResult!
        payPrivateHospital: HospitalResult!
        attemptPrisonEscape: PrisonEscapeStartResult!
        payBribePrison: PrisonBribeResult!
        startScavenge(placeId: Int!): ScavengeStartResult!
        playCoinFlip(side: String!, amount: Float!): CasinoPlayResult!
        buyInvestment(investmentId: Int!): MutationResult!
        abandonInvestment: MutationResult!
        hireInvestmentHenchman: MutationResult!
        toggleInvestmentYieldNotifications: MutationResult!
        buyLotteryTicket: LotteryPurchaseResult!
        placeHorseRaceBet(raceId: Int!, horseId: Int!, amount: Int!): HorseRaceBetResult!
        createGang(name: String!, acronym: String!, description: String!, color: String!, imageUrl: String): GangMutationResult!
        updateGang(id: ID!, name: String, acronym: String, description: String, color: String, imageUrl: String): GangMutationResult!
        startGangImport(gangId: ID!): GangMutationResult!
        cancelGangImport(gangId: ID!): GangMutationResult!
        setGangMoney(gangId: ID!, amount: Float!, mode: SetMoneyMode!): GangMutationResult!
        createGangRole(gangId: ID!, name: String!, canInvite: Boolean!, canKick: Boolean!, canPromote: Boolean!, canEditGang: Boolean!, canImport: Boolean!): GangMutationResult!
        updateGangRole(gangId: ID!, roleId: Int!, name: String!, canInvite: Boolean!, canKick: Boolean!, canPromote: Boolean!, canEditGang: Boolean!, canImport: Boolean!): GangMutationResult!
        updateGangMemberRole(gangId: ID!, targetUserId: ID!, roleId: Int!): GangMutationResult!
        kickGangMember(gangId: ID!, targetUserId: ID!): GangMutationResult!
        communicateGang(gangId: ID!, message: String!): GangMutationResult!
        depositGang(gangId: ID!, amount: Float!): GangMutationResult!
        leaveGang(gangId: ID!): GangMutationResult!
        transferGang(gangId: ID!, targetUserId: ID!): GangMutationResult!
        inviteGangMember(gangId: ID!, targetUserId: ID!): GangMutationResult!
    }
`;
