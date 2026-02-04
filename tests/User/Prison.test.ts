import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@core/models/User';
import { Language } from '@core/models/Language';
import { ClassId } from '@core/types/Classes';
import { Prison, PrisonFailureReason } from '@core/models/Prison';

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

describe('Prison', () => {
    let user: User;

    beforeEach(() => {
        vi.clearAllMocks();
        user = new User('123', Language.English);
        user.Nickname = 'TestUser';
        user.Class = ClassId.Entrepreneur;
        user.Money = 5_000;
    });

    describe('When testing if user can escape', () => {
        it('Should fail if user not in prison', async () => {
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.BribeNotInPrison);
        });

        it('Should fail if user already tried escaping', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Escape.HasTried = true;
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.EscapeHasTried);
        });

        it('Should fail if user is already escaping', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Escape.Time = new Date(Date.now() + 3_600_000);
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.EscapeEscaping);
        });

        //in order: isBeingRobbedById, isBeatingId, IsBeingBeatUpById
        it('Should fail if user is being robbed', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.Robbery.IsBeingRobbedById = '123';
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeingRobbedById);
        });

        it('Should fail if user is beating', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.BeatUp.IsBeatingId = '123';
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeatingId);
        });

        it('Should fail if user is being beat up', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            user.BeatUp.IsBeingBeatUpById = '123';
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(false);
            expect(result.reason).toBe(PrisonFailureReason.AttackerIsBeingBeatedById);
        });

        it('Should succeed', async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const prison = new Prison(user);
            const result = await prison.CanEscape();
            expect(result.canEscape).toBe(true);
        });
    });
});
