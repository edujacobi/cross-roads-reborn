import { User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { Language } from "#core/models/Language";
import { ItemList, type Items } from "#core/types/Items";
import { ItemType } from "#core/types/Items";
import { BundleId, ItemId } from "#core/types/Ids";
import { BundleList } from "#core/types/Skins";
import { getJobList, JobList } from "#core/types/Jobs";
import type { JobId } from "#core/types/Jobs";
import { ClassId, ClassList } from "#core/types/Classes";
import { getJobClassModifier } from "#core/types/Classes";
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

export const meResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		me: (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.user;
		},

		blackMarketOpen: () => isBlackMarketOpen(),

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

		myPrisonStatus: async (_: unknown, __: unknown, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const player = new User(authUser.userId);
			const found = await player.GetInfo();
			if (!found) {
				return {
					isInPrison: false,
					prisonTime: null,
					escapeHasTried: false,
					prisonHasPaidBribe: false,
				};
			}
			const isInPrison = player.IsInPrison();
			return {
				isInPrison,
				prisonTime: isInPrison ? player.Prison.Time.toISOString() : null,
				escapeHasTried: player.Escape.HasTried,
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

		items: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const itemTypeNames: Record<ItemType, string> = {
				[ItemType.Weapon]: "Arma",
				[ItemType.Wearable]: "Vestível",
				[ItemType.Accessory]: "Acessório",
				[ItemType.Consumable]: "Consumível",
				[ItemType.BeatUp]: "Espancamento",
			};

			return await Promise.all(
				Object.values(ItemList).map(async (item: Items) => {
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

					const defaultFilename = `${item.Id}_${ItemId[item.Id]}.png`;

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
						defaultImagePath: `/images/items/${defaultFilename}`,
					};
				}),
			);
		},
	},

	Mutation: {
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
			if (!item.Shop) {
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
				return { success: false, message: "Jogador não encontrado.", money: 0, isWanted: false };
			}

			const prison = new Prison(player);
			const { canEscape } = await prison.CanEscape();

			if (!canEscape) {
				return {
					success: false,
					message: "Você não pode tentar fugir no momento.",
					money: player.Money,
					isWanted: false,
				};
			}

			await prison.CalculateEscapeChance();
			await prison.StartEscape();
			const { success } = await prison.EndEscape();

			if (success) {
				return {
					success: true,
					message: "Fuga bem-sucedida! A polícia está na sua cola!",
					money: player.Money,
					isWanted: true,
				};
			}

			return {
				success: false,
				message: "Fuga fracassada! Você ficará preso por mais tempo.",
				money: player.Money,
				isWanted: false,
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
	},
};