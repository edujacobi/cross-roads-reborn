import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@core/models/User';
import { Language } from '@core/models/Language';
import { ClassId } from '@core/types/Classes';
import { Hospital, HospitalFailureReason } from '@core/models/Hospital';

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

describe('Hospital', () => {
    let user: User;

    beforeEach(() => {
        vi.clearAllMocks();
        user = new User('123', Language.English);
        user.Nickname = 'TestUser';
        user.Class = ClassId.Entrepreneur;
        user.Money = 5_000;
    });

    describe('When testing if user can pay private care', () => {
        it('Should fail if user is not in hospital', async () => {
            const hospital = new Hospital(user);
            const result = await hospital.CanPayPrivate();
            expect(result.canPay).toBe(false);
            expect(result.reason).toBe(HospitalFailureReason.UserFree);
        });

        it('Should fail if user is next in line (<5 min)', async () => {
            user.Hospital.Time = new Date(Date.now() + 120_000); // 2 min away
            const hospital = new Hospital(user);
            const result = await hospital.CanPayPrivate();
            expect(result.canPay).toBe(false);
            expect(result.reason).toBe(HospitalFailureReason.NextInLine);
        });

        it('Should fail if user does not have enough money', async () => {
            user.Money = 0;
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const hospital = new Hospital(user);
            const result = await hospital.CanPayPrivate();
            expect(result.canPay).toBe(false);
            expect(result.reason).toBe(HospitalFailureReason.WithoutMoney);
        });

        it('Should succeed', async () => {
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const hospital = new Hospital(user);
            const result = await hospital.CanPayPrivate();
            expect(result.canPay).toBe(true);
        })
    });
});
