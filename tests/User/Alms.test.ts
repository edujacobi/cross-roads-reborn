import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@core/models/User';
import { Language } from '@core/models/Language';
import { ClassId } from '@core/types/Classes';
import { Alms } from '@core/models/Alms';

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

describe('Alms', () => {
    let user: User;
    let defender: User;

    beforeEach(() => {
        vi.clearAllMocks();
        user = new User('123', Language.English);
        user.Nickname = 'TestUser';
        user.Class = ClassId.Entrepreneur;
        user.Money = 5_000;

        defender = new User('456', Language.English);
        defender.Nickname = 'Defender';
        defender.Class = ClassId.Entrepreneur;
        defender.Money = 5_000;
    });

    describe('When testing if user can give alms', () => {
        it('Should fail if same giver and receiver', () => {
            user.Money = 5_000;
            const alms = new Alms(user, user);
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('yourself');
        });

        it('Should fail if giver has no money', () => {
            const alms = new Alms(user, defender);
            user.Money = 0;
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('money');
        });

        it('Should fail if user is in cooldown to give alms', () => {
            const alms = new Alms(user, defender);
            user.Alms.GiveTime = new Date(Date.now() + 3_600_000);
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('give alms again');
        })

        it('Should fail if receiver is in cooldown to receive', () => {
            const alms = new Alms(user, defender);
            defender.Alms.ReceiveTime = new Date(Date.now() + 3_600_000);
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('receive alms again');
        })

        it('Should fail if receiver doesn\'t have a nickname', () => {
            const alms = new Alms(user, defender);
            defender.Nickname = '';
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('nickname');
        })

        it('Should fail if receiver doesn\'t have a class', () => {
            const alms = new Alms(user, defender);
            defender.Class = ClassId.None;
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('class');
        })

        it('Should fail if giver in casino', () => {
            const alms = new Alms(user, defender);
            user.Casino.IsInGame = true;
            const result = alms.CanGiveAlms();
            expect(result.canGive).toBe(false);
            expect(result.message).toContain('casino');
        });

        describe('And user can give alms', () => {
            it('Then should return true', () => {
                const alms = new Alms(user, defender);
                const result = alms.CanGiveAlms();
                expect(result.canGive).toBe(true);
                expect(result.message).toBe('');
            });
        });
    });

    describe('When giving alms', () => {
        let value = 50;
        describe('And user is not vip', () => {
            it('Then should give alms with default value', async () => {
                const alms = new Alms(user, defender);

                const initialMoneyUser = user.Money;
                const initialMoneyDefender = defender.Money;
                await alms.GiveAlms();
                expect(user.Money).toBe(initialMoneyUser - value);
                expect(defender.Money).toBe(initialMoneyDefender + value);
            });
        });

        describe('And user is vip', () => {
            it('Then should give alms with vip value', async () => {
                user.VipEternal = true;
                const alms = new Alms(user, defender);
                value *= 1.5;
                const initialMoneyUser = user.Money;
                const initialMoneyDefender = defender.Money;
                await alms.GiveAlms();
                expect(user.Money).toBe(initialMoneyUser - value);
                expect(defender.Money).toBe(initialMoneyDefender + value);
            });
        });
    });
});
