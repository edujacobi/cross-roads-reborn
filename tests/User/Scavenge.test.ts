import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@core/models/User';
import { Language } from '@core/models/Language';
import { JobId } from '@core/types/Jobs';
import { ClassId } from '@core/types/Classes';
import { Scavenge } from '@core/models/Scavenge';
import { ScavengeId, ScavengeFailureReason } from '@core/types/Scavenge';
import { LocationId } from '@core/types/Locations';

// --- Global Mocks ---

vi.mock('@core/database/Users', () => ({
    Users: {
        update: vi.fn(),
        findOne: vi.fn(),
        findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: 'OtherUser' })),
        findAll: vi.fn(() => Promise.resolve([])),
    },
}));

vi.mock('@core/database/UserItems', () => ({
    UserItems: {
        findOne: vi.fn(),
        upsert: vi.fn(),
    },
}));

vi.mock('@shared/log', () => ({
    Log: {
        Info: vi.fn(),
        Success: vi.fn(),
        Warning: vi.fn(),
        Error: vi.fn(),
    },
}));

vi.mock('@core/models/Notification', () => ({
    NotificationType: {
        Job: 'Job',
        Hospital: 'Hospital',
        Free: 'Free',
        Scavenge: 'Scavenge',
    },
    Notification: {
        Job: vi.fn(),
        Dismiss: vi.fn(),
        StartProcedure: vi.fn(),
        Hospital: vi.fn(),
        Free: vi.fn(),
        Scavenge: vi.fn(),
        AlmsGive: vi.fn(),
        RobAgain: vi.fn(),
        BeatAgain: vi.fn(),
    },
}));

vi.mock('@core/models/Event', () => ({
    EventType: {
        JOB_TIME_MULTIPLIER: 'JOB_TIME_MULTIPLIER',
    },
    Event: {
        GetActiveFromType: vi.fn(() => Promise.resolve(1)),
    },
}));

vi.mock('@bot/client', () => ({
    getClient: vi.fn(() => ({
        users: {
            fetch: vi.fn(() => Promise.resolve({ id: 'defender', send: vi.fn() })),
        },
    })),
}));

vi.mock('@core/models/Gang', () => ({
    Gang: {
        GetBasicById: vi.fn(() => Promise.resolve(null)),
    }
}));

describe('Scavenge', () => {
    let user: User;

    beforeEach(() => {
        vi.clearAllMocks();
        user = new User('123', Language.English);
        user.Nickname = 'TestUser';
        user.Class = ClassId.Entrepreneur;
        user.Money = 5_000;
    });

    describe('When testing if user can scavenge', () => {
        it('Should pass if user can scavenge', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(true);
        });

        it('Should fail if in cooldown', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Scavenge.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserScavengeTime);
        });

        it('Should fail if already scavenging', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Scavenge.IsScavengingId = ScavengeId.Dump;
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserScavenging);
        });

        it('Should fail if in job', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Job.Id = JobId.Butcher;
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserWorking);
        });

        it('Should fail if in prison', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserPrison);
        });

        it('Should fail if in hospital', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserHospital);
        });

        it('Should fail if in casino', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Casino.IsInGame = true;
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.UserCasino);
        });

        it('Should fail if beating user', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.BeatUp.IsBeatingId = '123';
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.AttackerIsBeatingId);
        });

        it('Should fail if being beated', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.BeatUp.IsBeingBeatUpById = '123';
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.AttackerIsBeingBeatedById);
        });

        it('Should fail if robbing user', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Robbery.IsRobbingId = '123';
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.AttackerIsRobbingId);
        });

        it('Should fail if being robbed', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Robbery.IsBeingRobbedById = '123';
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.AttackerIsBeingRobbedById);
        });

        it('Should fail if robbing location', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            user.Robbery.IsRobbingLocationId = LocationId.GroceryStore;
            const result = await scavenge.CanScavenge();
            expect(result.canScavenge).toBe(false);
            expect(result.reason).toBe(ScavengeFailureReason.AttackerIsRobbingLocationId);
        });
    });

    describe('When scavenging', () => {
        it('Should scavenge', async () => {
            const scavenge = new Scavenge(user, ScavengeId.Dump);
            await scavenge.StartScavenge();
            expect(user.Scavenge.IsScavengingId).toBe(ScavengeId.Dump);
        });
    });
});
