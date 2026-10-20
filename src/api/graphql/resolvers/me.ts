import { GraphQLError } from "graphql";
import { User } from "#core/models/User";
import { UserAvatarDecoration } from "#core/models/UserAvatarDecoration";
import { UserBackgroundDecoration } from "#core/models/UserBackgroundDecoration";
import { UserBundle } from "#core/models/UserBundle";
import { UserRepository } from "#core/repositories/UserRepository";
import { Language } from "#core/models/Language";
import { ItemList, type Items } from "#core/types/Items";
import { ItemType } from "#core/types/Items";
import { BundleId, ItemId, type AvatarDecorationId, type BackgroundDecorationId } from "#core/types/Ids";
import { AvatarDecorationList, getAvatarDecorationList } from "#core/types/AvatarDecorations";
import { BackgroundDecorationList, getBackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { BundleList, getSkinBundleList } from "#core/types/Skins";
import { getJobList, JobList } from "#core/types/Jobs";
import type { JobId } from "#core/types/Jobs";
import { ScavengeFailureReason, ScavengeList } from "#core/types/Scavenge";
import { Scavenge } from "#core/models/Scavenge";
import { ClassId, ClassList, getInvestmentYieldClassModifier, getJobClassModifier, getRobberyClassModifier, getScavengeDurationClassModifier } from "#core/types/Classes";
import { Event, EventType } from "#core/models/Event";
import { Shop } from "#core/models/Shop";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import type { GraphQLContext } from "#api/types";
import { isUserBoosterInOfficialServerByUserId } from "#bot/utils/officialServer";
import { assertAuthenticated, isBlackMarketOpen, mapUserDetail } from "./helpers";
import type { ResolverFn } from "./helpers";
import { formatMoney } from "#bot/utils/ui";
import { Prison } from "#core/models/Prison";
import { Hospital, HospitalFailureReason } from "#core/models/Hospital";
import { Casino } from "#core/models/Casino";
import { Lottery } from "#core/models/Lottery";
import { BetFailureReason, HorseRacing } from "#core/models/HorseRacing";
import { HorseList } from "#core/types/Horses";
import { getCasinoClassModifier } from "#core/types/Classes";
import { Alms } from "#core/models/Alms";
import { Investment as InvestmentModel } from "#core/models/Investment";
import { type InvestmentActionReason, type InvestmentId, InvestmentList } from "#core/types/Investments";
import { LocationList } from "#core/types/Locations";
import { LocationRobberyStrategy } from "#core/models/strategies/robbery/LocationRobberyStrategy";

const itemTypeNames: Record<ItemType, string> = {
	[ItemType.Weapon]: "Arma",
	[ItemType.Wearable]: "Vestível",
	[ItemType.Accessory]: "Acessório",
	[ItemType.Consumable]: "Consumível",
	[ItemType.BeatUp]: "Espancamento",
};

async function mapItemDetails(item: Items) {
	const userCount = await UserItemRepository.CountUsersWithItem(item.Id);
	const skins = Object.entries(item.Skin).map(([bundleIdStr, skin]) => {
		const bId = Number(bundleIdStr) as BundleId;
		const bundle = BundleList[bId];
		const bundleName = bundle?.Description[Language.Portuguese] ?? "Desconhecido";
		let filename = `${item.Id}_${ItemId[item.Id]}.png`;
		if (bId !== BundleId.Default) {
			filename = `${item.Id}_${ItemId[item.Id]}_${BundleId[bId]}.png`;
		}
		return {
			bundleId: bId,
			bundleName,
			emoteId: skin.Id,
			emoteString: skin.String,
			imagePath: `/images/items/${filename}`,
		};
	});

	return {
		id: item.Id,
		type: item.Type,
		typeName: itemTypeNames[item.Type] ?? "Outro",
		name: item.Description[Language.Portuguese],
		namePt: item.Description[Language.Portuguese],
		nameEn: item.Description[Language.English],
		nameEs: item.Description[Language.Spanish],
		price: item.Price,
		shop: item.Shop,
		blackMarket: item.BlackMarket,
		attack: item.Attack,
		defense: item.Defense,
		moneyAttack: item.MoneyAttack,
		moneyDefense: item.MoneyDefense,
		moreAttack: item.MoreAttack,
		moreDefense: item.MoreDefense,
		moreMoneyATK: item.MoreMoneyATK,
		moreMoneyDEF: item.MoreMoneyDEF,
		extra: item.Extra ? item.Extra[Language.Portuguese] : undefined,
		special: {
			day: item.Special.Day,
			night: item.Special.Night,
		},
		skins,
		userCount,
		defaultImagePath: `/images/items/${item.Id}_${ItemId[item.Id]}.png`,
	};
}

export const meResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		me: (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.user;
		},

		blackMarketOpen: () => isBlackMarketOpen(),

		specialShop: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new GraphQLError("Jogador não encontrado.");
			}

			const [userBundles, userAvatarDecorations, userBackgroundDecorations] = await Promise.all([
				UserBundle.GetList(player.Id, Language.Portuguese),
				UserAvatarDecoration.GetList(player, Language.Portuguese),
				UserBackgroundDecoration.GetList(player, Language.Portuguese),
			]);
			const ownedBundleIds = new Set(userBundles.map(bundle => bundle.BundleId));
			const ownedAvatarDecorationIds = new Set(userAvatarDecorations.map(decoration => decoration.AvatarDecorationId));
			const ownedBackgroundDecorationIds = new Set(userBackgroundDecorations.map(decoration => decoration.BackgroundDecorationId));

			return {
				vipPricePerDay: User.VIP_PRICE_PER_DAY,
				vipMinimumDays: User.VIP_MIN_DAYS,
				skinBundles: getSkinBundleList()
					.filter(bundle => bundle.Shop)
					.map(bundle => ({
						id: bundle.Id,
						name: bundle.Description[Language.Portuguese],
						price: bundle.Price,
						owned: ownedBundleIds.has(bundle.Id),
						skins: bundle.Items.map(itemId => ({
							itemId,
							name: ItemList[itemId].Description[Language.Portuguese],
							imagePath: `/images/items/${itemId}_${ItemId[itemId]}_${BundleId[bundle.Id]}.png`,
						})),
					})),
				avatarDecorations: getAvatarDecorationList()
					.filter(decoration => decoration.Shop)
					.sort((a, b) => a.Price - b.Price)
					.map(decoration => ({
						id: decoration.Id,
						name: decoration.Description[Language.Portuguese],
						price: decoration.Price,
						owned: ownedAvatarDecorationIds.has(decoration.Id),
					})),
				backgroundDecorations: getBackgroundDecorationList()
					.filter(decoration => decoration.Shop)
					.sort((a, b) => a.Price - b.Price)
					.map(decoration => ({
						id: decoration.Id,
						name: decoration.Description[Language.Portuguese],
						price: decoration.Price,
						owned: ownedBackgroundDecorationIds.has(decoration.Id),
					})),
			};
		},

		myDecorations: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new GraphQLError("Jogador não encontrado.");
			}

			const [avatarDecorations, backgroundDecorations] = await Promise.all([
				UserAvatarDecoration.GetList(player, Language.Portuguese),
				UserBackgroundDecoration.GetList(player, Language.Portuguese),
			]);

			return {
				avatarDecorations: avatarDecorations.map(({ AvatarDecorationId: id }) => {
					const decoration = AvatarDecorationList[id];
					return {
						id,
						name: decoration.Description[Language.Portuguese],
						className: decoration.Description[Language.English].toLowerCase().replaceAll(" ", "_"),
					};
				}),
				backgroundDecorations: backgroundDecorations.map(({ BackgroundDecorationId: id }) => {
					const decoration = BackgroundDecorationList[id];
					return {
						id,
						name: decoration.Description[Language.Portuguese],
						className: decoration.Description[Language.English].toLowerCase().replaceAll(" ", "_"),
					};
				}),
			};
		},

		mySkinBundles: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const bundles = await UserBundle.GetList(authUser.userId, Language.Portuguese);
			return bundles.map(({ BundleId: id, Description: name }) => ({
				id,
				name,
				skins: BundleList[id].Items.map(itemId => {
					const item = ItemList[itemId];
					const filename = id === BundleId.Default
						? `${item.Id}_${ItemId[item.Id]}.png`
						: `${item.Id}_${ItemId[item.Id]}_${BundleId[id]}.png`;
					return {
						itemId: item.Id,
						name: item.Description[Language.Portuguese],
						imagePath: `/images/items/${filename}`,
					};
				}),
			}));
		},

		bribeCost: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return 0;
			}
			const prison = new Prison(player);
			return prison.CalculateBribeValue();
		},

		privateHospitalCost: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return 0;
			}
			const hospital = new Hospital(player);
			return hospital.PrivatePrice;
		},

		almsStatus: async (_: unknown, args: { receiverId: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const giver = new User(authUser.userId, Language.Portuguese);
			const receiver = new User(args.receiverId);
			const [giverFound, receiverFound] = await Promise.all([
				giver.GetInfo(),
				receiver.GetInfo(),
			]);

			if (!giverFound || !receiverFound) {
				return { canGive: false, value: 0 };
			}

			const alms = new Alms(giver, receiver);
			return { canGive: alms.CanGiveAlms().canGive, value: alms.Value };
		},

		myPrisonStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return {
					isInPrison: false,
					prisonTime: null,
					escapeHasTried: false,
					escapeTime: null,
					prisonHasPaidBribe: false,
				};
			}
			const isInPrison = player.IsInPrison();
			return {
				isInPrison,
				prisonTime: isInPrison ? player.Prison.Time.toISOString() : null,
				escapeHasTried: player.Escape.HasTried,
				escapeTime: player.Escape.Time ? player.Escape.Time.toISOString() : null,
				prisonHasPaidBribe: player.Prison.HasPaidBribe,
			};
		},

		jobs: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			await player.GetInfo();

			const eventActiveValue = await Event.GetActiveFromType(EventType.JOB_TIME_MULTIPLIER);
			const userClassModifier = getJobClassModifier(player.Class);

			const sortedJobs = [...getJobList()].sort((a, b) => Number(a.Special) - Number(b.Special));

			return sortedJobs.map((job) => {
				const needItems = (job.NeedItem || []).map((itemId) => {
					const itemDef = ItemList[itemId];
					const defaultFilename = `${itemId}_${ItemId[itemId]}.png`;
					return {
						id: itemId,
						name: itemDef?.Description?.[Language.Portuguese] || itemDef?.Description?.[Language.English] || `Item #${itemId}`,
						defaultImagePath: `/images/items/${defaultFilename}`,
					};
				});

				return {
					id: job.Id,
					name: job.Description[Language.Portuguese],
					duration: job.Duration * eventActiveValue,
					salary: Math.round(job.Salary * userClassModifier),
					special: job.Special,
					needItems,
				};
			});
		},

		scavengeLocations: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			await player.GetInfo();

			const userClassDurationModifier = getScavengeDurationClassModifier(player.Class);

			return Object.values(ScavengeList).map((place) => {
 				const rewardItems = place.Reward.Items.map((item: { Id: number; Duration: { Min: number; Max: number } }) => {
					const itemDef = ItemList[item.Id];
					const defaultFilename = `${item.Id}_${ItemId[item.Id]}.png`;
					const isConsumable = itemDef?.Type === ItemType.Consumable;
					const durationMin = isConsumable
						? item.Duration.Min + 1
						: item.Duration.Min * userClassDurationModifier;
					const durationMax = isConsumable
						? item.Duration.Max + 1
						: item.Duration.Max * userClassDurationModifier;
					return {
						itemId: item.Id,
						name: itemDef?.Description?.[Language.Portuguese] || itemDef?.Description?.[Language.English] || `Item #${item.Id}`,
						itemType: isConsumable ? "Consumable" : "Duration",
						durationMin,
						durationMax,
						defaultImagePath: `/images/items/${defaultFilename}`,
					};
				});

				return {
					id: place.Id,
					name: place.Description[Language.Portuguese],
					subtitle: place.Subtitle[Language.Portuguese],
					emoteString: place.Emote.String,
					needAttack: place.NeedAttack,
					successChance: place.SuccessChance,
					prisonChance: place.Prison.Chance,
					hospitalChance: place.Hospital.Chance,
					rewardMoneyMin: Math.floor(place.Reward.Money.Min * userClassDurationModifier),
					rewardMoneyMax: Math.floor(place.Reward.Money.Max * userClassDurationModifier),
					rewardItems,
					prisonText: place.Prison.Text[Language.Portuguese],
					hospitalText: place.Hospital.Text[Language.Portuguese],
				};
			});
		},

		robLocations: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new Error("Jogador não encontrado.");
			}

			const classModifier = getRobberyClassModifier(player.Class);
			return Object.values(LocationList).map(location => ({
				id: location.Id,
				name: location.Name[Language.Portuguese],
				description: location.Description[Language.Portuguese],
				needAttack: location.NeedAttack,
				successChance: location.SuccessChance,
				rewardMin: Math.floor(location.Reward.Min * classModifier),
				rewardMax: Math.floor(location.Reward.Max * classModifier),
			}));
		},

		myScavengeStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return {
					isScavenging: false,
					scavengingId: null,
					scavengeTime: null,
				};
			}
			const isScavenging = player.IsScavenging();
			return {
				isScavenging,
				scavengingId: isScavenging ? player.Scavenge.IsScavengingId : null,
				scavengeTime: player.Scavenge.Time > new Date() ? player.Scavenge.Time.toISOString() : null,
			};
		},

		myLotteryStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new Error("Jogador não encontrado.");
			}

			const draw = await Lottery.GetNextDraw();
			const lastWinner = await Lottery.GetLastWinner();
			const ticket = draw ? await Lottery.HasUserBoughtTicket(player.Id, draw.id) : null;

			return {
				hasActiveDraw: !!draw,
				drawId: draw?.id ?? null,
				drawTime: draw?.drawTime.toISOString() ?? null,
				ticketPrice: draw ? Lottery.GetTicketPrice(draw.drawTime) : null,
				ticketCost: draw ? Lottery.GetTicketCost(draw.drawTime, player.IsVip()) : null,
				isMegaDraw: draw ? Lottery.IsMegaDraw(draw.drawTime) : false,
				totalTickets: draw?.totalTickets ?? 0,
				prizePool: draw?.totalAmount ?? 0,
				hasTicket: !!ticket,
				ticketId: ticket?.id ?? null,
				previousWinnerName: lastWinner?.user?.Nickname ?? null,
				previousPrize: lastWinner?.ticket?.winnings ?? null,
				money: player.Money,
			};
		},

		myHorseRaceStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new Error("Jogador não encontrado.");
			}

			const racing = new HorseRacing(player);
			let raceInfo = await racing.GetRaceInfo();
			if (!raceInfo) {
				await HorseRacing.ScheduleNextRace();
				raceInfo = await racing.GetRaceInfo();
			}

			return {
				raceId: raceInfo?.race.id ?? null,
				raceTime: raceInfo?.race.raceTime.toISOString() ?? null,
				isBettingOpen: raceInfo?.isBettingOpen ?? false,
				totalBets: raceInfo?.race.totalBets ?? 0,
				hasBet: !!raceInfo?.userBet,
				betHorseId: raceInfo?.userBet?.horseNumber ?? null,
				betAmount: raceInfo?.userBet?.amount ?? null,
				maxBet: racing.CalculateMaxBet(),
				money: player.Money,
				horses: HorseList.map(horse => ({
					id: horse.Id,
					name: horse.Name[Language.Portuguese],
					description: horse.Description[Language.Portuguese],
					emote: horse.Emote,
					multiplier: horse.Multiplier,
				})),
			};
		},

		myCasinoStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				throw new Error("Jogador não encontrado.");
			}
			return { money: player.Money };
		},

		myInvestmentPage: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId, Language.Portuguese);
			if (!await player.GetInfo()) {
				throw new Error("Jogador não encontrado.");
			}

			const yieldModifier = getInvestmentYieldClassModifier(player.Class);
			const hasHenchman = InvestmentModel.HasContractHenchman(player);
			const hasActiveHenchman = InvestmentModel.HasActiveHenchman(player);

			return {
				money: player.Money,
				isIdling: player.IsIdling(),
				nextPaymentAt: InvestmentModel.GetNextPaymentTime().toISOString(),
				investments: Object.values(InvestmentList)
					.sort((a, b) => a.Price - b.Price)
					.map(investment => ({
						id: investment.Id,
						name: investment.Name[Language.Portuguese],
						description: investment.Description[Language.Portuguese],
						price: investment.Price,
						hourlyYield: Math.round(investment.HourlyYield * yieldModifier),
						defense: investment.BaseDefense,
						henchmanFee: investment.HenchmanFee,
					})),
				investment: player.Investment.Id == null
					? null
					: {
						id: player.Investment.Id,
						accumulatedYield: player.Investment.AccumulatedYield,
						expiresAt: player.Investment.ExpiresAt!.toISOString(),
						defense: InvestmentList[player.Investment.Id].BaseDefense + (hasActiveHenchman ? 10 : 0),
						henchmanEndsAt: player.Investment.HenchmanEndsAt?.toISOString() ?? null,
						henchmanHospitalized: player.Investment.HenchmanHospitalized,
						hasHenchman,
						notifyYield: player.Investment.NotifyYield,
					},
			};
		},

		item: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
			assertAuthenticated(context);
			const item = ItemList[args.id as ItemId];
			return item ? await mapItemDetails(item) : null;
		},

		items: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			return await Promise.all(Object.values(ItemList).map(mapItemDetails));
		},
	},

	Mutation: {
		buyInvestment: async (
			_: unknown,
			args: { investmentId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId, Language.Portuguese);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			const investment = InvestmentList[args.investmentId];
			if (!investment) {
				return { success: false, message: "Investimento não encontrado.", user: null };
			}
			if (!player.IsIdling()) {
				return { success: false, message: "Você precisa estar vadiando para comprar um investimento.", user: null };
			}

			const result = await InvestmentModel.Buy(player, args.investmentId as InvestmentId);
			if (!result.success) {
				const messages: Record<InvestmentActionReason, string> = {
					insufficient_funds: "Você não tem dinheiro suficiente.",
					already_has_investment: "Você já possui um investimento. Abandone-o antes de comprar um novo.",
					no_investment: "Você não possui um investimento.",
					already_has_henchman: "Você já possui um contrato de capanga ativo.",
					unknown: "Erro ao comprar investimento.",
				};
				return { success: false, message: messages[result.reason ?? "unknown"], user: null };
			}

			return {
				success: true,
				message: `Você comprou ${investment.Name[Language.Portuguese]} com sucesso.`,
				user: null,
			};
		},

		abandonInvestment: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId, Language.Portuguese);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (player.Investment.Id == null) {
				return { success: false, message: "Você não possui um investimento.", user: null };
			}
			if (!player.IsIdling()) {
				return { success: false, message: "Você precisa estar vadiando para abandonar seu investimento.", user: null };
			}

			const result = await InvestmentModel.Abandon(player);
			return {
				success: result.success,
				message: result.success
					? "Você abandonou seu investimento."
					: "Você não possui um investimento.",
				user: null,
			};
		},

		hireInvestmentHenchman: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId, Language.Portuguese);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			const result = await InvestmentModel.HireHenchman(player);
			const messages: Record<InvestmentActionReason, string> = {
				insufficient_funds: "Você não tem dinheiro suficiente.",
				already_has_investment: "Você já possui um investimento.",
				no_investment: "Você não possui um investimento.",
				already_has_henchman: "Você já possui um contrato de capanga ativo.",
				unknown: "Erro ao contratar o capanga.",
			};
			return {
				success: result.success,
				message: result.success ? "Capanga contratado por 12 horas." : messages[result.reason ?? "unknown"],
				user: null,
			};
		},

		toggleInvestmentYieldNotifications: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId, Language.Portuguese);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (player.Investment.Id == null) {
				return { success: false, message: "Você não possui um investimento.", user: null };
			}

			const enabled = await InvestmentModel.ToggleNotifyYield(player);
			return {
				success: true,
				message: enabled ? "Notificações de lucro ativadas." : "Notificações de lucro desativadas.",
				user: null,
			};
		},

		giftVip: async (_: unknown, args: { receiverId: string; days: number }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			if (!Number.isSafeInteger(args.days) || args.days < User.VIP_MIN_DAYS) {
				return { success: false, message: `Presenteie pelo menos ${User.VIP_MIN_DAYS} dias inteiros de VIP.`, user: null };
			}
			const price = args.days * User.VIP_PRICE_PER_DAY;
			if (!Number.isSafeInteger(price)) {
				return { success: false, message: "Quantidade de dias inválida.", user: null };
			}
			if (args.receiverId === authUser.userId) {
				return { success: false, message: "Use a loja especial para comprar seu próprio VIP.", user: null };
			}

			const giver = new User(authUser.userId, Language.Portuguese);
			const receiver = new User(args.receiverId);
			const [giverFound, receiverFound] = await Promise.all([giver.GetInfo(), receiver.GetInfo()]);
			if (!giverFound || !receiverFound) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (receiver.VipEternal) {
				return { success: false, message: "Este jogador já possui VIP Eterno.", user: null };
			}
			if (giver.SpecialCoin < price) {
				return { success: false, message: "Saldo insuficiente de Moedas Especiais.", user: null };
			}
			if (!await giver.GiftVipForDays(receiver, args.days)) {
				return { success: false, message: "Não foi possível presentear VIP. Atualize o saldo e tente novamente.", user: null };
			}
			return {
				success: true,
				message: `Você presenteou ${receiver.Nickname} com ${args.days} dias de VIP!`,
				user: null,
			};
		},

		giveAlms: async (_: unknown, args: { receiverId: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const giver = new User(authUser.userId, Language.Portuguese);
			const receiver = new User(args.receiverId);
			const [giverFound, receiverFound] = await Promise.all([
				giver.GetInfo(),
				receiver.GetInfo(),
			]);

			if (!giverFound || !receiverFound) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			const alms = new Alms(giver, receiver);
			const { canGive, message } = alms.CanGiveAlms();
			if (!canGive) {
				return { success: false, message, user: null };
			}

			await alms.GiveAlms();
			return {
				success: true,
				message: `Você doou ${formatMoney(alms.Value, Language.Portuguese)} para ${receiver.Nickname}.`,
				user: null,
			};
		},

		claimDailyReward: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (!player.CanReceiveDaily()) {
				return { success: false, message: "Você já resgatou sua recompensa diária.", user: null };
			}

			const { money } = await player.ReceiveDaily({
				isBooster: isUserBoosterInOfficialServerByUserId(authUser.userId),
			});
			return {
				success: true,
				message: `Você recebeu Cr$ ${money.toLocaleString("pt-BR")} na recompensa diária. Sequência atual: ${player.Daily.CurrentStreak}.`,
				user: null,
			};
		},

		changeOwnNickname: async (
			_: unknown,
			args: { nickname: string },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			if (args.nickname.length < 3 || args.nickname.length > 18 || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(args.nickname)) {
				return {
					success: false,
					message: "O apelido deve ter de 3 a 18 letras e pode conter espaços simples.",
					user: null,
				};
			}

			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (args.nickname === player.Nickname) {
				return { success: false, message: "Esse já é o seu apelido.", user: null };
			}
			const nickExists = await UserRepository.SearchByNameOrId(args.nickname);
			if (nickExists) {
				return { success: false, message: "Esse apelido já está em uso.", user: null };
			}

			const cost = player.GetNicknameChangeCost();
			if (player.Money < cost) {
				return {
					success: false,
					message: `Saldo insuficiente. A alteração custa Cr$ ${cost.toLocaleString("pt-BR")}.`,
					user: null,
				};
			}
			await player.SetNickname(args.nickname, cost || undefined);
			return {
				success: true,
				message: `Seu apelido foi alterado para ${args.nickname}.`,
				user: null,
			};
		},

		changeOwnClass: async (
			_: unknown,
			args: { classId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const availableClasses = [ClassId.Attorney, ClassId.Entrepreneur, ClassId.Hobo, ClassId.Thief];
			if (!availableClasses.includes(args.classId)) {
				return { success: false, message: "Classe inválida.", user: null };
			}

			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (player.Class === args.classId) {
				return { success: false, message: "Você já possui essa classe.", user: null };
			}

			const cost = player.GetClassChangeCost();
			if (player.Money < cost) {
				return {
					success: false,
					message: `Saldo insuficiente. A alteração custa Cr$ ${cost.toLocaleString("pt-BR")}.`,
					user: null,
				};
			}
			await player.SetClass(args.classId, cost || undefined);
			return {
				success: true,
				message: `Sua classe foi alterada para ${ClassList[args.classId].Name[Language.Portuguese]}.`,
				user: null,
			};
		},

		setOwnAutomaticGrenade: async (
			_: unknown,
			args: { enabled: boolean },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			await player.SetAutomaticGrenade(args.enabled);
			return {
				success: true,
				message: `Uso automático de granadas ${args.enabled ? "ativado" : "desativado"}.`,
				user: null,
			};
		},

		buyItem: async (
			_: unknown,
			args: { itemId: number; units?: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", money: 0 };
			}

			const item = ItemList[args.itemId];
			if (!item) {
				return { success: false, message: "Item não encontrado.", money: player.Money };
			}
			if (!item.Shop && !item.BlackMarket) {
				return { success: false, message: "Este item não está à venda.", money: player.Money };
			}
			if (item.BlackMarket && !isBlackMarketOpen()) {
				return { success: false, message: "O Mercado Negro está fechado.", money: player.Money };
			}

			const units = Math.max(1, Math.min(10, args.units ?? 1));
			const shop = new Shop(player);
			let purchasedUnits = 0;
			let firstErrorMessage = "";

			for (let i = 0; i < units; i++) {
				const { canBuy, message } = await shop.CanUserBuyItem(item);
				if (!canBuy) {
					if (!firstErrorMessage) {
						firstErrorMessage = message;
					}
					break;
				}
				await player.BuyItem(item);
				purchasedUnits++;
			}

			if (purchasedUnits === 0) {
				return { success: false, message: firstErrorMessage, money: player.Money };
			}

			const successMessage = purchasedUnits === units
				? `Você comprou ${purchasedUnits} unidade(s) de ${item.Description[Language.Portuguese]}.`
				: `Compra parcial: ${purchasedUnits}/${units} unidade(s) de ${item.Description[Language.Portuguese]}. ${firstErrorMessage}`;

			return {
				success: purchasedUnits > 0,
				message: successMessage,
				money: player.Money,
			};
		},

		buySpecialShopVip: async (
			_: unknown,
			args: { days: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (!Number.isSafeInteger(args.days) || args.days < User.VIP_MIN_DAYS) {
				return { success: false, message: `O VIP deve ser comprado por pelo menos ${User.VIP_MIN_DAYS} dias.`, user: null };
			}

			const price = args.days * User.VIP_PRICE_PER_DAY;
			if (!Number.isSafeInteger(price)) {
				return { success: false, message: "Quantidade de dias inválida.", user: null };
			}
			if (player.SpecialCoin < price) {
				return { success: false, message: "Saldo insuficiente de Moedas Especiais.", user: null };
			}
			if (!await player.BuyVipForDays(args.days)) {
				return { success: false, message: "Não foi possível concluir a compra de VIP.", user: null };
			}

			return {
				success: true,
				message: `Você comprou ${args.days} dias de VIP!`,
				user: null,
			};
		},

		buySpecialShopItem: async (
			_: unknown,
			args: {
				type: "SKIN_BUNDLE" | "AVATAR_DECORATION" | "BACKGROUND_DECORATION";
				itemId: number;
			},
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			let price: number;
			let ownsItem: () => Promise<boolean | undefined>;
			let purchase: () => Promise<boolean>;
			let itemName: string;

			if (args.type === "SKIN_BUNDLE") {
				const bundle = BundleList[args.itemId];
				if (!bundle?.Shop) {
					return { success: false, message: "Pacote de skins não encontrado.", user: null };
				}
				price = bundle.Price;
				itemName = bundle.Description[Language.Portuguese];
				ownsItem = () => UserBundle.HasBundle(player.Id, bundle.Id);
				purchase = () => player.BuySkinBundle(bundle.Id);
			}
			else if (args.type === "AVATAR_DECORATION") {
				const decoration = getAvatarDecorationList().find(item => item.Id === args.itemId);
				if (!decoration?.Shop) {
					return { success: false, message: "Decoração de avatar não encontrada.", user: null };
				}
				price = decoration.Price;
				itemName = decoration.Description[Language.Portuguese];
				ownsItem = () => UserAvatarDecoration.HasAvatarDecoration(player.Id, decoration.Id);
				purchase = () => player.BuyAvatarDecoration(decoration.Id as AvatarDecorationId);
			}
			else if (args.type === "BACKGROUND_DECORATION") {
				const decoration = getBackgroundDecorationList().find(item => item.Id === args.itemId);
				if (!decoration?.Shop) {
					return { success: false, message: "Decoração de fundo não encontrada.", user: null };
				}
				price = decoration.Price;
				itemName = decoration.Description[Language.Portuguese];
				ownsItem = () => UserBackgroundDecoration.HasBackgroundDecoration(player.Id, decoration.Id);
				purchase = () => player.BuyBackgroundDecoration(decoration.Id as BackgroundDecorationId);
			}
			else {
				return { success: false, message: "Item especial inválido.", user: null };
			}

			if (await ownsItem()) {
				return { success: false, message: "Você já possui este item.", user: null };
			}
			if (player.SpecialCoin < price) {
				return { success: false, message: "Saldo insuficiente de Moedas Especiais.", user: null };
			}
			if (!await purchase()) {
				return { success: false, message: `Não foi possível comprar ${itemName}.`, user: null };
			}

			return {
				success: true,
				message: `Você comprou ${itemName}!`,
				user: null,
			};
		},

		setOwnDecoration: async (
			_: unknown,
			args: { type: "AVATAR" | "BACKGROUND"; decorationId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (!Number.isSafeInteger(args.decorationId)) {
				return { success: false, message: "Decoração inválida.", user: null };
			}

			if (args.type === "AVATAR") {
				const decoration = getAvatarDecorationList().find(item => item.Id === args.decorationId);
				const ownedDecorations = await UserAvatarDecoration.GetList(player);
				if (!decoration || !ownedDecorations.some(item => item.AvatarDecorationId === args.decorationId)) {
					return { success: false, message: "Você não possui esta decoração de avatar.", user: null };
				}
				if (!await player.SetAvatarDecoration(decoration)) {
					return { success: false, message: "Não foi possível atualizar a decoração de avatar.", user: null };
				}
				return { success: true, message: "Decoração de avatar atualizada.", user: null };
			}

			const decoration = getBackgroundDecorationList().find(item => item.Id === args.decorationId);
			const ownedDecorations = await UserBackgroundDecoration.GetList(player);
			if (!decoration || !ownedDecorations.some(item => item.BackgroundDecorationId === args.decorationId)) {
				return { success: false, message: "Você não possui esta decoração de fundo.", user: null };
			}
			if (!await player.SetBackgroundDecoration(decoration)) {
				return { success: false, message: "Não foi possível atualizar a decoração de fundo.", user: null };
			}
			return { success: true, message: "Decoração de fundo atualizada.", user: null };
		},

		setOwnBundleSkin: async (
			_: unknown,
			args: { bundleId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (!Number.isSafeInteger(args.bundleId)) {
				return { success: false, message: "Pacote de skins inválido.", user: null };
			}

			const bundle = BundleList[args.bundleId as BundleId];
			if (!bundle) {
				return { success: false, message: "Pacote de skins não encontrado.", user: null };
			}

			const ownedBundles = await UserBundle.GetList(player.Id);
			if (!ownedBundles.some(ownedBundle => ownedBundle.BundleId === bundle.Id)) {
				return { success: false, message: "Você não possui este pacote de skins.", user: null };
			}

			await player.SetBundleSkin(bundle);
			return { success: true, message: "Pacote de skins aplicado a todos os itens.", user: null };
		},

		setOwnItemSkin: async (
			_: unknown,
			args: { itemId: number; bundleId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}
			if (!Number.isSafeInteger(args.itemId) || !Number.isSafeInteger(args.bundleId)) {
				return { success: false, message: "Item ou skin inválidos.", user: null };
			}

			const item = ItemList[args.itemId as ItemId];
			const bundle = BundleList[args.bundleId as BundleId];
			if (!item || !bundle || !item.Skin[bundle.Id]) {
				return { success: false, message: "Esta skin não está disponível para este item.", user: null };
			}

			const [userItem, ownedBundles] = await Promise.all([
				UserItemRepository.FindByUserAndItem(player.Id, item.Id),
				UserBundle.GetList(player.Id),
			]);
			if (!userItem) {
				return { success: false, message: "Você não possui este item.", user: null };
			}
			if (!ownedBundles.some(ownedBundle => ownedBundle.BundleId === bundle.Id)) {
				return { success: false, message: "Você não possui esta skin.", user: null };
			}

			await player.SetItemSkin(item, bundle);
			return { success: true, message: "Skin ativada para este item.", user: null };
		},

		startJob: async (
			_: unknown,
			args: { jobId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			const job = JobList[args.jobId];
			if (!job) {
				return { success: false, message: "Trabalho não encontrado.", user: null };
			}

			if (job.Special && !isBlackMarketOpen()) {
				return { success: false, message: "O Mercado Negro está fechado.", user: null };
			}

			if (player.Job.EndsIn > new Date() && player.Job.Id !== null) {
				return { success: false, message: "Você já está trabalhando.", user: null };
			}
			if (player.Scavenge.Time > new Date() && player.Scavenge.IsScavengingId !== null) {
				return { success: false, message: "Você já está farejando.", user: null };
			}
			if (player.Prison.Time > new Date()) {
				return { success: false, message: "Você está na prisão.", user: null };
			}
			if (player.Hospital.Time > new Date()) {
				return { success: false, message: "Você está no hospital.", user: null };
			}
			if (player.Casino.IsInGame) {
				return { success: false, message: "Você está no cassino.", user: null };
			}
			if (player.BeatUp.IsBeatingId !== null) {
				return { success: false, message: "Você está agredindo alguém.", user: null };
			}
			if (player.Robbery.IsRobbingId !== null || player.Robbery.IsRobbingLocationId !== null) {
				return { success: false, message: "Você está roubando.", user: null };
			}
			if (player.Robbery.IsBeingRobbedById !== null) {
				return { success: false, message: "Você está sendo roubado.", user: null };
			}
			if (player.IsDefendingInvestment()) {
				return { success: false, message: "Você está defendendo seu investimento.", user: null };
			}
			if (player.IsParticipatingInGangAction()) {
				return { success: false, message: "Você está em uma ação de gangue.", user: null };
			}

			if (job.NeedItem) {
				const missingItems = job.NeedItem.filter(
					(neededId) => !player.Items.some((userItem) => userItem.Id === neededId),
				);
				if (missingItems.length > 0) {
					const missingNames = missingItems.map((id) => {
						const itemDef = ItemList[id];
						return itemDef?.Description?.[Language.Portuguese] || itemDef?.Description?.[Language.English] || `Item #${id}`;
					});
					return { success: false, message: `Itens necessários: ${missingNames.join(", ")}.`, user: null };
				}
			}

			await player.StartJob(args.jobId as JobId);
			const userDetail = await mapUserDetail(player);

			return {
				success: true,
				message: `Você começou o trabalho: ${job.Description[Language.Portuguese]}.`,
				user: userDetail,
			};
		},

		cancelJob: async (
			_: unknown,
			__: unknown,
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", user: null };
			}

			if (player.Job.Id === null) {
				return { success: false, message: "Você não está trabalhando.", user: null };
			}

			await player.CancelJob();
			const userDetail = await mapUserDetail(player);

			return {
				success: true,
				message: "Trabalho cancelado.",
				user: userDetail,
			};
		},

		payPrivateHospital: async (
			_: unknown,
			__: unknown,
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", money: 0, privatePrice: null };
			}

			const hospital = new Hospital(player);
			const { canPay, reason } = await hospital.CanPayPrivate();

			if (!canPay) {
				let message = "";
				if (reason === HospitalFailureReason.UserFree) {
					message = "Você não está hospitalizado!";
				}
				else if (reason === HospitalFailureReason.NextInLine) {
					message = "Você é o próximo da fila, aguarde sua vez.";
				}
				else if (reason === HospitalFailureReason.WithoutMoney) {
					message = `Você não tem dinheiro suficiente! Precisa de ${formatMoney(hospital.PrivatePrice, Language.Portuguese)}.`;
				}
				return { success: false, message, money: player.Money, privatePrice: hospital.PrivatePrice };
			}

			await hospital.PayPrivate();
			return {
				success: true,
				message: "Você pagou pelo tratamento particular e foi curado!",
				money: player.Money,
				privatePrice: hospital.PrivatePrice,
			};
		},

		attemptPrisonEscape: async (
			_: unknown,
			__: unknown,
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", duration: 0 };
			}

			const prison = new Prison(player);
			const { canEscape } = await prison.CanEscape();

			if (!canEscape) {
				return {
					success: false,
					message: "Você não pode tentar fugir no momento.",
					duration: 0,
				};
			}

			await prison.CalculateEscapeChance();
			if (!await prison.StartEscape()) {
				return {
					success: false,
					message: "Você não pode tentar fugir no momento.",
					duration: 0,
				};
			}

			return {
				success: true,
				message: "Tentando fugir...",
				duration: prison.Escape.DefaultDuration,
			};
		},


		payBribePrison: async (
			_: unknown,
			__: unknown,
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado.", money: 0, bribeAccepted: false, bribeCost: 0 };
			}

			const prison = new Prison(player);
			const { canBribe } = await prison.CanBribe();

			if (!canBribe) {
				const bribeCost = prison.CalculateBribeValue();
				return {
					success: false,
					message: "Você não pode subornar no momento.",
					money: player.Money,
					bribeAccepted: false,
					bribeCost,
				};
			}

			const bribeValue = prison.CalculateBribeValue();
			if (player.Money < bribeValue) {
				return {
					success: false,
					message: `Você não tem dinheiro suficiente. Precisa de ${formatMoney(bribeValue, Language.Portuguese)}.`,
					money: player.Money,
					bribeAccepted: false,
					bribeCost: bribeValue,
				};
			}

			const bribeAccepted = await prison.PayBribery(bribeValue);

			if (bribeAccepted) {
				return {
					success: true,
					message: "Suborno aceito! Você foi liberado.",
					money: player.Money,
					bribeAccepted: true,
					bribeCost: bribeValue,
				};
			}

			return {
				success: false,
				message: "Suborno recusado! Os guardas ficaram com o dinheiro.",
				money: player.Money,
				bribeAccepted: false,
				bribeCost: bribeValue,
			};
		},

		startScavenge: async (
			_: unknown,
			args: { placeId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return { success: false, message: "Jogador não encontrado." };
			}

			const place = ScavengeList[args.placeId];
			if (!place) {
				return { success: false, message: "Local não encontrado." };
			}

			if (player.Attributes.Attack < place.NeedAttack) {
				return { success: false, message: `Ataque insuficiente. Você precisa de ${place.NeedAttack} de ATK.` };
			}

			const scavenge = new Scavenge(player, args.placeId);
			const { canScavenge, reason } = await scavenge.CanScavenge();

			if (!canScavenge) {
				let message = "";
				switch (reason) {
				case ScavengeFailureReason.UserScavengeTime:
					message = "Você já vasculhou recentemente. Aguarde 1 hora.";
					break;
				case ScavengeFailureReason.UserScavenging:
					message = "Você já está vasculhando.";
					break;
				case ScavengeFailureReason.UserWorking:
					message = "Você está trabalhando.";
					break;
				case ScavengeFailureReason.UserPrison:
					message = "Você está na prisão.";
					break;
				case ScavengeFailureReason.UserHospital:
					message = "Você está no hospital.";
					break;
				case ScavengeFailureReason.UserCasino:
					message = "Você está no cassino.";
					break;
				default:
					message = "Você não pode vasculhar no momento.";
					break;
				}
				return { success: false, message };
			}

			await scavenge.StartScavenge();

			return {
				success: true,
				message: "Vasculhando...",
			};
		},

		startRobLocation: async (
			_: unknown,
			args: { locationId: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado." };
			}

			const location = LocationList[args.locationId];
			if (!Number.isInteger(args.locationId) || !location) {
				return { success: false, message: "Local não encontrado." };
			}

			const robbery = new LocationRobberyStrategy(player, location.Id);
			const { canRob } = await robbery.CanRob();
			if (!canRob) {
				return {
					success: false,
					message: player.Attributes.Attack < location.NeedAttack
						? `Ataque insuficiente. Você precisa de ${location.NeedAttack} ATK.`
						: "Você não pode roubar este local no momento.",
				};
			}

			await robbery.LockStates();
			return { success: true, message: "Roubo em andamento..." };
		},

		playCoinFlip: async (
			_: unknown,
			args: { side: string; amount: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", money: 0 };
			}

			if (!["HEADS", "TAILS"].includes(args.side) || !Number.isFinite(args.amount) || args.amount < 500) {
				return { success: false, message: "Escolha um lado e aposte pelo menos Cr$ 500.", money: player.Money };
			}

			const { canPlay, message } = await Casino.CanUserPlayGame(player, args.amount);
			if (!canPlay) {
				return { success: false, message, money: player.Money };
			}

			if (!await Casino.StartUserGame(player)) {
				return { success: false, message: "Você já está jogando no cassino.", money: player.Money };
			}
			try {
				const resultSide = Math.random() < 0.5 ? "HEADS" : "TAILS";
				const won = resultSide === args.side;
				const prize = won ? Math.round(args.amount * 0.5 * getCasinoClassModifier(player.Class)) : 0;

				if (won) {
					await Casino.FinishUserGameWithWin(player, prize, args.amount);
				}
				else {
					await Casino.FinishUserGameWithLoss(player, args.amount);
				}

				return {
					success: true,
					message: won ? `Você ganhou ${formatMoney(prize + args.amount, Language.Portuguese)}!` : "A moeda caiu do outro lado. Você perdeu a aposta.",
					money: player.Money,
					won,
					resultSide,
					selectedSide: args.side,
					amount: args.amount,
					prize,
				};
			}
			finally {
				player.Casino.IsInGame = false;
				await player.Update({ casinoIsInGame: false });
			}
		},

		buyLotteryTicket: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", money: 0, ticketId: null };
			}

			const result = await Lottery.BuyTicket(player);
			return {
				success: result.success,
				message: result.message,
				money: player.Money,
				ticketId: result.ticketId ?? null,
			};
		},

		placeHorseRaceBet: async (
			_: unknown,
			args: { raceId: number; horseId: number; amount: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			if (!await player.GetInfo()) {
				return { success: false, message: "Jogador não encontrado.", money: 0 };
			}

			const result = await new HorseRacing(player).PlaceBet(args.raceId, args.horseId, args.amount);
			if (!result.Success) {
				const message = result.Reason === BetFailureReason.BetTooLow
					? `A aposta mínima é ${formatMoney(HorseRacing.MIN_BET, Language.Portuguese)}.`
					: result.Reason === BetFailureReason.BetTooHigh
						? `A aposta máxima é ${formatMoney(new HorseRacing(player).CalculateMaxBet(), Language.Portuguese)}.`
						: result.Message || "Não foi possível registrar a aposta.";
				return { success: false, message, money: player.Money };
			}

			return {
				success: true,
				message: `Aposta registrada em ${result.Horse.Name[Language.Portuguese]}.`,
				money: player.Money,
				horseId: result.Horse.Id,
				horseName: result.Horse.Name[Language.Portuguese],
				multiplier: result.Horse.Multiplier,
				amount: result.Amount,
				raceTime: result.RaceTime.toISOString(),
			};
		},
	},
};