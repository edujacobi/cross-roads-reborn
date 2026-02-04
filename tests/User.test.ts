import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User, SituationId } from '@core/models/User';
import { Language } from '@core/models/Language';
import { JobId } from '@core/types/Jobs';
import { ClassId } from '@core/types/Classes';
import { Scavenge } from '@core/models/Scavenge';
import { Shop } from '@core/models/Shop';
import { Alms } from '@core/models/Alms';
import { BeatUp } from '@core/models/BeatUp';
import { Casino } from '@core/models/Casino';
import { Hospital, HospitalFailureReason } from '@core/models/Hospital';
import { Prison, PrisonFailureReason } from '@core/models/Prison';
import { Robbery } from '@core/models/Robbery';
import { RobberyLocation } from '@core/models/RobberyLocation';
import { ScavengeId, ScavengeFailureReason } from '@core/types/Scavenge';
import { ItemId, BundleId } from '@core/types/Ids';
import { ItemList, UserItem } from '@core/types/Items';
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

// Mock getClient for BeatUp/Robbery discord interactions
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

// --- Test Suite ---

describe('Model Action Constraints (Unit Tests)', () => {
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

    describe('Scavenge', () => {
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

    describe('Shop', () => {
        describe('When testing if user can buy item', () => {
            it('Should fail if no money', async () => {
                const shop = new Shop(user);
                user.Money = 0;
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('money');
            });

            // it('Should fail if user has more hours than allowed', async () => {
            //     const shop = new Shop(user);
            //     // mock existingItem
            //     // TODO
            //     const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
            //     expect(result.canBuy).toBe(false);
            //     expect(result.message).toContain('hours');
            // });

            it('Should fail if user is scavenging', async () => {
                const shop = new Shop(user);
                user.Scavenge.IsScavengingId = ScavengeId.Dump;
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('scavenging');
            });

            it('Should fail if user is in prison', async () => {
                const shop = new Shop(user);
                user.Prison.Time = new Date(Date.now() + 3_600_000);
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('prison');
            });

            it('Should fail if user is in hospital', async () => {
                const shop = new Shop(user);
                user.Hospital.Time = new Date(Date.now() + 3_600_000);
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('hospital');
            });

            it('Should fail if user is in casino', async () => {
                const shop = new Shop(user);
                user.Casino.IsInGame = true;
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('casino');
            });

            it('Should fail if user is beating', async () => {
                const shop = new Shop(user);
                user.BeatUp.IsBeatingId = '123';
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('beating');
            });

            it('Should fail if user is being beated', async () => {
                const shop = new Shop(user);
                user.BeatUp.IsBeingBeatUpById = '123';
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('being beated');
            });

            it('Should fail if user is robbing user', async () => {
                const shop = new Shop(user);
                user.Robbery.IsRobbingId = '123';
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('robbing');
            });

            it('Should fail if user is being robbed', async () => {
                const shop = new Shop(user);
                user.Robbery.IsBeingRobbedById = '123';
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('being robbed');
            });

            it('Should fail if user is robbing location', async () => {
                const shop = new Shop(user);
                user.Robbery.IsRobbingLocationId = LocationId.GroceryStore;
                const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
                expect(result.canBuy).toBe(false);
                expect(result.message).toContain('robbing');
            });
        });
    });

    describe('Alms', () => {
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

    describe('BeatUp', () => {
        describe('When testing if user can beat up', () => {
            beforeEach(async () => {
                user.Items = [ItemList[ItemId.Knife] as UserItem];
                defender.Items = [ItemList[ItemId.Knife] as UserItem];
            });

            it('Should fail if attacker is defender', async () => {
                const beatUp = new BeatUp(user, user);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('yourself');
            });

            it('Should fail if defender has no nickname', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Nickname = '';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('nickname');
            });

            it('Should fail if defender has no class', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Class = ClassId.None;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('class');
            });

            it('Should fail if attacker without weapon', async () => {
                user.Items = [];
                await user.GetAttributes(true);
                const beatUp = new BeatUp(user, defender);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('weapon');
            });

            it('Should fail if defender too strong', async () => {
                user.Items = [ItemList[ItemId.Knife] as UserItem];
                defender.Items = [ItemList[ItemId.Bazooka] as UserItem];

                const beatUp = new BeatUp(user, defender);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('current weapons');
            });

            it('Should fail if attacker is scavenging', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Scavenge.IsScavengingId = ScavengeId.AlienShip;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('scavenging');
            });

            it('Should fail if defender is scavenging', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Scavenge.IsScavengingId = ScavengeId.AlienShip;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('scavenging');
            });

            it('Should fail if attacker is working', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Job.Id = JobId.Bodyguard;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('working');
            });

            it('Should fail if defender is working', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Job.Id = JobId.Bodyguard;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('working');
            });

            it('Should fail if attacker is in prison but defender is not', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Prison.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('prison');
            });

            it('Should fail if defender is in prison but attacker is not', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Prison.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('prison');
            });

            it('Should fail if attacker is wanted by the police', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Wanted.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('wanted');
            });

            it('Should fail if attacker is in hospital', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Hospital.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('hospital');
            });

            it('Should fail if defender is in hospital', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Hospital.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('hospital');
            });

            it('Should fail if attacker is in casino game', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Casino.IsInGame = true;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('casino');
            });

            it('Should fail if defender is in casino game', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Casino.IsInGame = true;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('casino');
            });

            it('Should fail if beat up is in cooldown', async () => {
                const beatUp = new BeatUp(user, defender);
                user.BeatUp.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('beat again');
            });

            it('Should fail if already beating', async () => {
                const beatUp = new BeatUp(user, defender);
                user.BeatUp.IsBeatingId = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('beating');
            });

            it('Should fail if already being beaten', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.BeatUp.IsBeingBeatUpById = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('beated');
            });

            it('Should fail if defender is in beating', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.BeatUp.IsBeatingId = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('beating');
            });

            it('Should fail if defender is being beaten', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.BeatUp.IsBeingBeatUpById = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('beated');
            });

            it('Should fail if already robbing', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Robbery.IsRobbingId = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbing');
            });

            it('Should fail if already being robbed', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Robbery.IsBeingRobbedById = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbed');
            });

            it('Should fail if defender is in robbing', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Robbery.IsRobbingId = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbing');
            });

            it('Should fail if defender is being robbed', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Robbery.IsBeingRobbedById = '123';
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbed');
            });

            it('Should fail if attacker is robbing location', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbing');
            });

            it('Should fail if defender is robbing location', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('robbing');
            });

            it('Should fail if attacker is escaping prison', async () => {
                const beatUp = new BeatUp(user, defender);
                user.Escape.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('escape');
            })

            it('Should fail if defender is escaping prison', async () => {
                const beatUp = new BeatUp(user, defender);
                defender.Escape.Time = new Date(Date.now() + 3_600_000);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(false);
                expect(result.message).toContain('escape');
            })

            it('Should succeed', async () => {
                const beatUp = new BeatUp(user, defender);
                const result = await beatUp.CanBeatUser();
                expect(result.canBeat).toBe(true);
            })

        });
    });

    describe('Casino', () => {
        describe('When testing if user can play game', () => {
            const BET_VALUE = 100;

            it('Should fail if user has no money', async () => {
                user.Money = 0;
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('money');
            })

            it('Should fail if user is scavenging', async () => {
                user.Scavenge.IsScavengingId = ScavengeId.AlienShip;
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('scavenging');
            })

            it('Should fail if user is working', async () => {
                user.Job.Id = JobId.BlackMarket;
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('working');
            })

            it('Should fail if user is in prison', async () => {
                user.Prison.Time = new Date(Date.now() + 3_600_000);
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('prison');
            })

            it('Should fail if user is in hospital', async () => {
                user.Hospital.Time = new Date(Date.now() + 3_600_000);
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('hospital');
            })

            it('Should fail if user in another casino game', async () => {
                user.Casino.IsInGame = true;
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('game');
            })
            // in order: isBeatingId, isBeingBeatUpById, isRobbingId, isBeingRobbedById, isRobbingLocationId
            it('Should fail if user is beating up someone', async () => {
                user.BeatUp.IsBeatingId = '123';
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('beating');
            })

            it('Should fail if user is being beat up', async () => {
                user.BeatUp.IsBeingBeatUpById = '123';
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('beated');
            })

            it('Should fail if user is robbing someone', async () => {
                user.Robbery.IsRobbingId = '123';
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('robbing');
            })

            it('Should fail if user is being robbed', async () => {
                user.Robbery.IsBeingRobbedById = '123';
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('robbed');
            })

            it('Should fail if user is robbing location', async () => {
                user.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(false);
                expect(result.message).toContain('robbing');
            })

            it('Should succeed', async () => {
                const result = await Casino.CanUserPlayGame(user, BET_VALUE);
                expect(result.canPlay).toBe(true);
            })
        })
    });

    describe('Hospital', () => {
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

    describe('Prison', () => {
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

    describe('Robbery', () => {
        describe('When testing if user can rob', () => {
            it('CanRobUser: Fail if attacker is working', async () => {
                user.Job.Id = JobId.UberDriver;
                user.Job.EndsIn = new Date(Date.now() + 3_600_000);
                user.BestGun = { Id: ItemId.Knife } as any;

                const robbery = new Robbery(user, defender);
                const result = await robbery.CanRobUser();
                expect(result.canRob).toBe(false);
                expect(result.message).toContain('working');
            });

            it('CanRobLocation: Fail if low ATK', async () => {
                user.Attributes.Attack = 0;
                const robberyLoc = new RobberyLocation(user, LocationId.SmallBank);
                const result = await robberyLoc.CanRobLocation();
                expect(result.canRob).toBe(false);
                expect(result.message).toContain('ATK');
            });
        });
    });

    describe('User Model Core Actions (Regression)', () => {
        it('should pass model lifecycle tests (Job status)', async () => {
            const jobId = JobId.Butcher;
            await user.StartJob(jobId);
            expect(user.Job.Id).toBe(jobId);
            expect(user.IsWorking()).toBe(true);

            await user.CancelJob();
            expect(user.Job.Id).toBe(null);
            expect(user.IsWorking()).toBe(false);
        });
    });
});
