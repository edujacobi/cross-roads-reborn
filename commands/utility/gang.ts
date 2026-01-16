import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ColorResolvable,
	Colors,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { Gang } from "../../models/Gang";
import { convertHexNumberToString, defaultComponent, formatMoney, hexToRGB, showTime } from "../../utils/ui";
import { createButtonCollector, deferReply, disableButtons, replyWithContainer, searchUser } from "../../utils/logic";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { GangColor, IGangColor } from "../../utils/colors";
import { EmoteString } from "../../utils/emotes";
import { DEFAULT_GANG_IMAGE } from "../../ui/builders/GangImageCanvasBuilder";
import { GangBaseId, GangBases, GangModifier, getGangBases } from "../../interfaces/GangBases";

enum CommandOption {
	Info = "info",
	Create = "create",
	Edit = "edit",
	Invite = "invite",
	Leave = "leave",
	Kick = "kick",
	Communicate = "communicate",
	Base = "base",
	Deposit = "deposit"
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("gang")
		.setNameLocalizations({
			[Locale.PortugueseBR]: "gangue",
			[Locale.SpanishES]: "cuadrilla",
		})
		.setDescription("View information about gangs")
		.setDescriptionLocalizations({
			[Locale.PortugueseBR]: "Visualize informações sobre gangues",
			[Locale.SpanishES]: "Ver información sobre cuadrillas",
		})
		.addSubcommand(info => info
			.setName(CommandOption.Info)
			.setDescription("Show information about a gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Mostra informações sobre uma gangue",
				[Locale.SpanishES]: "Muestra información sobre una cuadrilla",
			})
			.addStringOption(name => name
				.setName("name")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "nome",
					[Locale.SpanishES]: "nombre",
				})
				.setDescription("Gang name or acronym to search for")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Nome ou acrônimo da gangue para buscar",
					[Locale.SpanishES]: "Nombre o acrónimo de la cuadrilla para buscar",
				}),
			),
		)
		.addSubcommand(create => create
			.setName(CommandOption.Create)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "criar",
				[Locale.SpanishES]: "crear",
			})
			.setDescription("Create a new gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Cria uma nova gangue",
				[Locale.SpanishES]: "Crea una nueva cuadrilla",
			})
			.addStringOption(name => name
				.setName("name")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "nome",
					[Locale.SpanishES]: "nombre",
				})
				.setDescription("Gang name (max. 25 characters)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Nome da gangue (máx. 25 caracteres)",
					[Locale.SpanishES]: "Nombre de la cuadrilla (máx. 25 caracteres)",
				})
				.setRequired(true)
				.setMinLength(4)
				.setMaxLength(50),
			)
			.addStringOption(acronym => acronym
				.setName("acronym")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "acrônimo",
					[Locale.SpanishES]: "acrónimo",
				})
				.setDescription("Gang acronym (max. 3 characters)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Acrônimo da gangue (máx. 3 caracteres)",
					[Locale.SpanishES]: "Acrónimo de la cuadrilla (máx. 3 caracteres)",
				})
				.setRequired(true)
				.setMinLength(2)
				.setMaxLength(3),
			)
			.addStringOption(description => description
				.setName("description")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "descricao",
					[Locale.SpanishES]: "descripcion",
				})
				.setDescription("Gang description")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Descrição da gangue",
					[Locale.SpanishES]: "Descripción de la cuadrilla",
				})
				.setRequired(true),
			)
			.addIntegerOption(color => color
				.setName("color")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "cor",
					[Locale.SpanishES]: "color",
				})
				.setDescription("Gang color")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Cor da gangue",
					[Locale.SpanishES]: "Color de la cuadrilla",
				})
				.setRequired(true)
				.addChoices(Object.values(GangColor)
					.filter(color => !color.Special)
					.map((color: IGangColor) => ({
						name: color.Description[Language.English],
						value: color.Id,
						name_localizations: {
							[Locale.PortugueseBR]: color.Description[Language.Portuguese],
							[Locale.SpanishES]: color.Description[Language.Spanish],
						},
					} as {
						name: string; value: number; name_localizations: Record<Locale, string>
					}))),
			)
			.addStringOption(image => image
				.setName("image")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "imagem",
					[Locale.SpanishES]: "imagen",
				})
				.setDescription("Gang image URL (optional)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "URL da imagem da gangue (opcional)",
					[Locale.SpanishES]: "URL de la imagen de la cuadrilla (opcional)",
				})
				.setRequired(false),
			),
		)
		.addSubcommand(edit => edit
			.setName(CommandOption.Edit)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "editar",
				[Locale.SpanishES]: "editar",
			})
			.setDescription("Edit your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Edita sua gangue",
				[Locale.SpanishES]: "Edita tu cuadrilla",
			})
			.addStringOption(name => name
				.setName("name")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "nome",
					[Locale.SpanishES]: "nombre",
				})
				.setDescription("Gang name (max. 25 characters)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Nome da gangue (máx. 25 caracteres)",
					[Locale.SpanishES]: "Nombre de la cuadrilla (máx. 25 caracteres)",
				})
				.setMinLength(4)
				.setMaxLength(50),
			)
			.addStringOption(acronym => acronym
				.setName("acronym")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "acrônimo",
					[Locale.SpanishES]: "acrónimo",
				})
				.setDescription("Gang acronym (max. 3 characters)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Acrônimo da gangue (máx. 3 caracteres)",
					[Locale.SpanishES]: "Acrónimo de la cuadrilla (máx. 3 caracteres)",
				})
				.setMinLength(2)
				.setMaxLength(3),
			)
			.addStringOption(description => description
				.setName("description")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "descricao",
					[Locale.SpanishES]: "descripcion",
				})
				.setDescription("Gang description")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Descrição da gangue",
					[Locale.SpanishES]: "Descripción de la cuadrilla",
				}),
			)
			.addIntegerOption(color => color
				.setName("color")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "cor",
					[Locale.SpanishES]: "color",
				})
				.setDescription("Gang color")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Cor da gangue",
					[Locale.SpanishES]: "Color de la cuadrilla",
				})
				.addChoices(Object.values(GangColor)
					.filter(color => !color.Special)
					.map((color: IGangColor) => ({
						name: color.Description[Language.English],
						value: color.Id,
						name_localizations: {
							[Locale.PortugueseBR]: color.Description[Language.Portuguese],
							[Locale.SpanishES]: color.Description[Language.Spanish],
						},
					} as {
						name: string; value: number; name_localizations: Record<Locale, string>
					}))),
			)
			.addStringOption(image => image
				.setName("image")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "imagem",
					[Locale.SpanishES]: "imagen",
				})
				.setDescription("Gang image URL")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "URL da imagem da gangue",
					[Locale.SpanishES]: "URL de la imagen de la cuadrilla",
				}),
			),
		)
		.addSubcommand(invite => invite
			.setName(CommandOption.Invite)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "convidar",
				[Locale.SpanishES]: "invitar",
			})
			.setDescription("Invite a user to your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Convida um usuário para sua gangue",
				[Locale.SpanishES]: "Invita a un usuario a tu cuadrilla",
			})
			.addStringOption(user => user
				.setName("user")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "usuario",
					[Locale.SpanishES]: "usuario",
				})
				.setDescription("User to invite to your gang")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Usuário para convidar para sua gangue",
					[Locale.SpanishES]: "Usuario para invitar a tu cuadrilla",
				})
				.setRequired(true),
			),
		)
		.addSubcommand(leave => leave
			.setName(CommandOption.Leave)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "sair",
				[Locale.SpanishES]: "salir",
			})
			.setDescription("Leave your current gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Sai da sua gangue atual",
				[Locale.SpanishES]: "Sale de tu cuadrilla actual",
			}),
		)
		.addSubcommand(kick => kick
			.setName(CommandOption.Kick)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "expulsar",
				[Locale.SpanishES]: "expulsar",
			})
			.setDescription("Kick a user from your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Expulsa um usuário da sua gangue",
				[Locale.SpanishES]: "Expulsa a un usuario de tu cuadrilla",
			})
			.addStringOption(user => user
				.setName("user")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "usuario",
					[Locale.SpanishES]: "usuario",
				})
				.setDescription("User to kick from your gang")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Usuário para expulsar da sua gangue",
					[Locale.SpanishES]: "Usuario para expulsar de tu cuadrilla",
				})
				.setRequired(true),
			),
		)
		.addSubcommand(communicate => communicate
			.setName(CommandOption.Communicate)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "comunicar",
				[Locale.SpanishES]: "comunicar",
			})
			.setDescription("Communicate with your gang members")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Comunica com os membros da sua gangue",
				[Locale.SpanishES]: "Comunica con los miembros de tu cuadrilla",
			})
			.addStringOption(message => message
				.setName("message")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "mensagem",
					[Locale.SpanishES]: "mensaje",
				})
				.setDescription("Message to send to your gang members")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Mensagem para enviar aos membros da sua gangue",
					[Locale.SpanishES]: "Mensaje para enviar a los miembros de tu cuadrilla",
				})
				.setMinLength(2)
				.setMaxLength(1024)
				.setRequired(true),
			),
		)
		.addSubcommand(base => base
			.setName(CommandOption.Base)
			.setDescription("Buy a base for your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Compre uma base para sua gangue",
				[Locale.SpanishES]: "Compra una base para tu cuadrilla",
			}),
		)
		.addSubcommand(deposit => deposit
			.setName(CommandOption.Deposit)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "depositar",
				[Locale.SpanishES]: "depositar",
			})
			.setDescription("Deposit money into your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Deposite dinheiro na sua gangue",
				[Locale.SpanishES]: "Deposita dinero en tu cuadrilla",
			})
			.addIntegerOption(amount => amount
				.setName("amount")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "quantidade",
					[Locale.SpanishES]: "cantidad",
				})
				.setDescription("Amount to deposit")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Quantidade para depositar",
					[Locale.SpanishES]: "Cantidad para depositar",
				})
				.setRequired(true)
				.setMinValue(1),
			),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const containerInfo = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(Colors.Green)
			.addSectionComponents(main => main
				.addTexts([
					`# ${s.gangTitle}`,
					s.gangDescription,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://cdn.discordapp.com/attachments/1233604589064818808/1457724304383938611/GangImage.png"),
				),
			)
			.addFooter();

		const subCommand = interaction.options.getSubcommand();

		switch (subCommand) {
		case CommandOption.Info: {
			await deferReply(interaction);

			const searchName = interaction.options.getString("name");

			try {
				let gang: Gang | null;

				if (!searchName) {
					// If no name provided, check user's gang
					gang = await Gang.GetByUserId(user.Id);

					if (!gang) {
						return replyWithContainer(interaction, containerInfo, true);
					}
				}
				else {
					// Search gang by name
					gang = await Gang.FindByName(searchName);
					if (!gang) {
						return warn(s.gangNotFoundByName(searchName));
					}
				}

				if (!gang) {
					return;
				}

				const membersList = gang.Members.map(member => {
					const underscore = member.UserId == interaction.user.id ? "__" : "";
					const emote = gang.GetMemberEmote(member);

					return `${emote} ${underscore}${member.Nickname}${underscore} - ${member.RoleName}`;
				}).join("\n");

				const adminIdText = user.Id === process.env.JACOBI_ID ? ` • ${s.gangId(gang.Id)}` : "";

				const gangBase = GangBases[gang.BaseId];

				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(hexToRGB(convertHexNumberToString(GangColor[gang.Color].Color)))
					.addSectionComponents(header => header
						.addTexts([
							`# [${gang.Acronym}] ${gang.Name}${GangColor[gang.Color].Emote.String}`,
							`_${gang.Description}_`,
							`## ${formatMoney(gang.Money, language)}`,
							// `-# ${s.totalInBalance}`,
						])
						.setThumbnailAccessory(image => image
							.setURL(gang.Image || DEFAULT_GANG_IMAGE),
						),
					)
					.addLargeSeparator();

				if (gang.BaseId !== GangBaseId.None) {
					container
						.addSectionComponents(section => section
							.addTexts([
								`### ${gangBase.Name[language]}`,
								`-# ${s.level} ${gang.Level} ${gang.GetExpBar(6)}`,
							])
							.setThumbnailAccessory(thumb => thumb
								.setURL(gangBase.ImageUrl!),
							),
						)
						.addLargeSeparator();
				}
				else {
					container
						.addTexts([
							`### ${gangBase.Name[language]}`,
						])
						.addLargeSeparator();
				}

				container
					.addTexts([
						`### ${s.members} (${gang.Members.length}/${gang.GetMaxMembers()})`,
						`${membersList}`,
					])
					.addFooter({
						text: `${s.created} ${showTime(gang.CreatedAt.getTime())}${adminIdText}`,
						button: new ButtonBuilder()
							.setLabel("Info")
							.setCustomId("info")
							.setStyle(ButtonStyle.Secondary),
					});

				let responded = false;
				const response = await replyWithContainer(interaction, container);

				const collector = createButtonCollector(interaction, response);

				collector?.on("collect", async btn => {
					await btn.deferUpdate();
					if (btn.customId === "info") {
						responded = true;
						await replyWithContainer(interaction, containerInfo);
					}
				});

				collector?.on("end", async () => {
					if (responded) return;
					await disableButtons(interaction, container);
				});

				return;
			}
			catch (err) {
				return warn(s.errorSearchingGang);
			}
		}

		case CommandOption.Create: {
			await deferReply(interaction);

			// Verificar se o usuário já está em uma gangue
			if (user.IsInGang()) {
				return warn(s.alreadyInGang);
			}

			// Verificar se o usuário tem dinheiro suficiente
			if (user.Money < Gang.CREATION_COST) {
				return warn(s.notEnoughMoneyCreate(formatMoney(Gang.CREATION_COST, language)));
			}

			// Obter os parâmetros da gangue
			const name = interaction.options.getString("name", true);
			const acronym = interaction.options.getString("acronym", true);
			const description = interaction.options.getString("description", true);
			const color = interaction.options.getInteger("color", true);
			const image = interaction.options.getString("image");

			// Check if gang with the same name or acronym already exists
			const exists = await checkGangExists(name, acronym);
			if (exists) return;

			// Validar o nome da gangue
			if (!validateGangName(name)) {
				return warn(s.lettersAndNumbers);
			}

			// validate if image is a valid URL
			if (image && validateImageUrl(image)) {
				return warn(s.invalidURLImage);
			}

			// Criar a gangue
			const gang = await user.CreateGang(name, acronym, description, color, image || null);

			if (!gang) {
				return warn(s.errorCreatingGang);
			}

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(GangColor[gang.Color].Color)
				.addTexts([
					`-# ${s.gangCreated}`,
				])
				.addLargeSeparator()
				.addTexts([
					s.gangCreatedDetails(gang.Name, formatMoney(Gang.CREATION_COST, language)),
					`### ${s.name}`,
					`${gang.Name}`,
					`### ${s.acronym}`,
					`${gang.Acronym.toUpperCase()}`,
					`### ${s.description}`,
					`${gang.Description}`,
					`### ${s.color}`,
					`${GangColor[gang.Color].Emote.String} ${GangColor[gang.Color].Description[language]}`,
				]);

			if (image) {
				container.addTexts([
					`### ${s.image}`,
					`${gang.Image}`,
				]);
			}

			container.addFooter();

			return replyWithContainer(interaction, container);
		}

		case CommandOption.Edit: {
			await deferReply(interaction);

			// Obter os parâmetros da gangue
			const name = interaction.options.getString("name");
			const acronym = interaction.options.getString("acronym");
			const description = interaction.options.getString("description");
			const color = interaction.options.getInteger("color");
			const image = interaction.options.getString("image");

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const canEdit = gang.CanEdit(user.Id);

			if (!canEdit) {
				return warn(s.errorEdittingGangPermission);
			}

			// Check if gang with the same name or acronym already exists
			const exists = await checkGangExists(name, acronym);
			if (exists) return;

			// validate the name of the gang
			if (name && !validateGangName(name)) {
				return warn(s.lettersAndNumbers);
			}

			// validate if image is a valid URL
			if (image && validateImageUrl(image)) {
				return warn(s.invalidURLImage);
			}

			const old = {
				name: gang.Name,
				acronym: gang.Acronym,
				description: gang.Description,
				color: gang.Color,
				image: gang.Image,
			};

			const successEditting = await gang.Edit(name, acronym, description, color, image);

			if (!successEditting) {
				return warn(s.errorEdittingGang);
			}

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(GangColor[gang.Color].Color)
				.addTexts([
					`-# ${s.gangEditted}`,
				])
				.addLargeSeparator();

			if (name) {
				container.addTexts([
					`### ${s.name}`,
					`-# ~~${old.name}~~`,
					`${gang.Name}`,
				]);
			}
			if (acronym) {
				container.addTexts([
					`### ${s.acronym}`,
					`-# ~~${old.acronym.toUpperCase()}~~`,
					`${gang.Acronym.toUpperCase()}`,
				]);
			}
			if (description) {
				container.addTexts([
					`### ${s.description}`,
					`-# ~~${old.description}~~`,
					`${gang.Description}`,
				]);
			}
			if (color != null) {
				container.addTexts([
					`### ${s.color}`,
					`-# ${GangColor[old.color].Emote.String} ~~${GangColor[old.color].Description[language]}~~`,
					`${GangColor[gang.Color].Emote.String} ${GangColor[gang.Color].Description[language]}`,
				]);
			}
			if (image) {
				container.addTexts([
					`### ${s.image}`,
					`-# ~~${old.image}~~`,
					`${gang.Image}`,
				]);
			}

			container.addFooter();

			return replyWithContainer(interaction, container);
		}

		case CommandOption.Invite: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const canInvite = gang.CanInvite(user.Id);

			if (!canInvite) {
				return warn(s.errorInviteGangPermission);
			}

			const targetUserInput = interaction.options.getString("user", true);

			const target = await searchUser(targetUserInput, interaction);

			if (!target) {
				return;
			}

			if (target.Id === user.Id) {
				return warn(s.errorInviteGangYourself);
			}

			if (target.IsInGang()) {
				return warn(s.userAlreadyInGang(target));
			}

			const success = await gang.InviteUser(user, target);

			if (!success) {
				return warn(s.errorInviteGangGeneric);
			}

			const container = defaultComponent({
				color: GangColor[gang.Color].Color as ColorResolvable,
				description: s.successInviteGang(target.GetNameWithImage(), gang.Name),
				user,
			});

			return replyWithContainer(interaction, container);
		}

		case CommandOption.Leave: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			if (user.Id === this.LeaderId) {
				return warn(s.errorLeaveGangLeader);
			}

			const buttonConfirm = new ButtonBuilder()
				.setCustomId("confirm")
				.setLabel(s.confirm)
				.setStyle(ButtonStyle.Success);

			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents([buttonConfirm]);

			const container = defaultComponent({
				user,
				color: GangColor[gang.Color].Color as ColorResolvable,
				description: s.confirmLeave(gang.Name),
				buttons: row,
			});

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			let responded = false;

			collector?.on("collect", async btn => {
				responded = true;

				if (!await Gang.GetByUserId(user.Id)) {
					return warn(s.notInGang);
				}

				if (btn.customId === "confirm") {
					const success = await gang.LeaveGang(user);

					if (!success) {
						return warn(s.errorLeaveGang);
					}

					const container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successLeaveGang(gang.Name),
						user,
					});

					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				if (responded) return;

				const container = defaultComponent({
					color: GangColor[gang.Color].Color as ColorResolvable,
					description: s.noResponseLeaveGang(gang.Name),
					user,
				});

				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.Kick: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const canKick = gang.CanKick(user.Id);

			if (!canKick) {
				return warn(s.errorKickGangPermission);
			}

			const targetUserInput = interaction.options.getString("user", true);

			const target = await searchUser(targetUserInput, interaction);

			if (!target) {
				return;
			}

			if (target.Id === user.Id) {
				return warn(s.errorKickGangYourself);
			}

			if (target.Id === this.LeaderId) {
				return warn(s.errorKickGangLeader);
			}

			const buttonConfirm = new ButtonBuilder()
				.setCustomId("confirm")
				.setLabel(s.confirm)
				.setStyle(ButtonStyle.Success);

			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents([buttonConfirm]);

			const container = defaultComponent({
				user,
				color: GangColor[gang.Color].Color as ColorResolvable,
				description: s.confirmKick(target.Nickname, gang.Name),
				buttons: row,
			});

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			let responded = false;

			collector?.on("collect", async btn => {
				responded = true;

				if (!await Gang.GetByUserId(user.Id)) {
					return warn(s.notInGang);
				}

				if (btn.customId === "confirm") {
					const success = await gang.KickMember(user, target);

					if (!success) {
						return warn(s.errorKickGang(target.Nickname, gang.Name));
					}

					const container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successKickGang(target.Nickname, gang.Name),
						user,
					});

					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				if (responded) return;

				const container = defaultComponent({
					color: GangColor[gang.Color].Color as ColorResolvable,
					description: s.noResponseKickGang(target.Nickname, gang.Name),
					user,
				});

				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.Communicate: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const canCommunicate = gang.CanCommunicate(user.Id);

			if (!canCommunicate) {
				return warn(s.errorCommunicateGangPermission);
			}

			const text = interaction.options.getString("message", true);

			await gang.OfficialCommunication(user, text);

			const container = defaultComponent({
				color: GangColor[gang.Color].Color as ColorResolvable,
				description: `> ${text}\n${s.messageSent}`,
				user,
			});

			return replyWithContainer(interaction, container);
		}

		case CommandOption.Base: {
			await deferReply(interaction);

			let gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const canEdit = gang.CanEdit(user.Id);

			if (!canEdit) {
				return warn(s.errorEdittingGangPermission);
			}

			function getModifierText(modifier?: GangModifier) {
				const text = [];

				if (!modifier) {
					return "";
				}

				if (modifier.PrisonEscape?.Positive) {
					text.push(`${EmoteString.Victory} +${modifier.PrisonEscape?.Positive}% ${s.prisonModifier} ${s.perLevelModifier} ${EmoteString.Escape}`);
				}
				if (modifier.Attack?.Positive) {
					text.push(`${EmoteString.Victory}${EmoteString.Attack}+${modifier.Attack?.Positive} ATK ${s.perLevelModifier}`);
				}
				if (modifier.Defense?.Positive) {
					text.push(`${EmoteString.Victory}${EmoteString.Defense}+${modifier.Defense?.Positive} DEF ${s.perLevelModifier}`);
				}
				return text.join("\n");
			}

			const BASE_COST = 1_000_000;

			function addBaseHeader() {
				return new CustomContainerBuilder()
					.setAccentColor(GangColor[gang!.Color].Color)
					.addTexts([
						`# ${s.gangBasesTitle}`,
						s.gangBasesCost(formatMoney(BASE_COST, language)),
					])
					.addLargeSeparator();
			}

			function generateDefaultContainer() {
				const container = addBaseHeader();
				const bases = getGangBases().filter(base => base.Id !== GangBaseId.None);

				for (let i = 0; i < bases.length; i++) {
					const base = bases[i];
					container
						.addSectionComponents(section => section
							.addTexts([
								`### ${base.Name[language]}`,
								base.Description[language],
							])
							.setThumbnailAccessory(thumb => thumb
								.setURL(base.ImageUrl!),
							),
						)
						.addSectionComponents(section => section
							.addTexts([
								getModifierText(base.Modifier),
							])
							.setButtonAccessory(btn => btn
								.setStyle(ButtonStyle.Secondary)
								.setLabel(s.buy)
								.setDisabled(gang!.BaseId !== GangBaseId.None)
								.setCustomId(`buy${base.Id}`),
							),
						);

					if (i < bases.length - 1) {
						container.addLargeSeparator();
					}
				}

				container.addFooter({
					text: `${gang!.Name} • ${formatMoney(gang!.Money, language)}`,
				});

				return container;
			}

			let container = generateDefaultContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			collector?.on("collect", async btn => {
				await btn.deferUpdate();

				if (btn.customId === "back") {
					container = generateDefaultContainer();
					return replyWithContainer(interaction, container);
				}

				else if (btn.customId.startsWith("buy")) {
					const baseId = Number(btn.customId.replace("buy", "")) as GangBaseId;
					const base = GangBases[baseId];

					if (!gang) {
						return;
					}

					container = addBaseHeader()
						.addSectionComponents(section => section
							.addTexts([
								`### ${base.Name[language]}`,
								base.Description[language],
							])
							.setThumbnailAccessory(thumb => thumb
								.setURL(base.ImageUrl!),
							),
						)
						.addTexts([
							getModifierText(base.Modifier),
						])
						.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
							.addComponents(
								new ButtonBuilder()
									.setLabel(s.back)
									.setCustomId("back")
									.setStyle(ButtonStyle.Secondary),
								new ButtonBuilder()
									.setStyle(ButtonStyle.Success)
									.setLabel(s.confirm)
									.setDisabled(gang.Money < BASE_COST)
									.setCustomId(`confirm${base.Id}`),
							),
						)
						.addFooter({
							text: `${gang.Name} • ${formatMoney(gang.Money, language)}`,
						});

					return replyWithContainer(interaction, container);
				}

				else if (btn.customId.startsWith("confirm")) {
					const baseId = Number(btn.customId.replace("confirm", "")) as GangBaseId;
					const base = GangBases[baseId];

					gang = await Gang.GetById(gang!.Id);

					if (!gang) {
						return;
					}

					if (gang.Money < BASE_COST) {
						return warn(s.notEnoughMoneyBase(formatMoney(BASE_COST, language)));
					}

					gang.Money -= BASE_COST;
					gang.BaseId = base.Id;
					await gang.Update();

					container = addBaseHeader()
						.addSectionComponents(section => section
							.addTexts([
								s.baseBought(base.Name[language], gang!.Name),
							])
							.setThumbnailAccessory(thumb => thumb
								.setURL(base.ImageUrl!),
							),
						)
						.addFooter({
							text: `${gang.Name} • ${formatMoney(gang.Money, language)}`,
						});

					return replyWithContainer(interaction, container);
				}
			});
			return;
		}

		case CommandOption.Deposit: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const amount = interaction.options.getInteger("amount", true);

			const { canDeposit, text } = await gang.CanDeposit(user, amount);

			if (!canDeposit) {
				return warn(`${text} ${EmoteString.Gang}`);
			}

			await gang.Deposit(user, amount);


			const container = defaultComponent({
				color: GangColor[gang.Color].Color as ColorResolvable,
				description: s.depositSuccess(formatMoney(amount, language), gang.Name),
				user,
			});

			return replyWithContainer(interaction, container);
		}
		}

		async function checkGangExists(name: string | null, acronym: string | null) {
			if (name) {
				const existingGang = await Gang.CheckGangWithName(name);

				if (existingGang) {
					await warn(s.gangAlreadyExistsName(name));

					return true;
				}
			}

			if (acronym) {
				const existingGang = await Gang.CheckGangWithAcronym(acronym.toUpperCase());

				if (existingGang) {
					await warn(s.gangAlreadyExistsAcronym(acronym.toUpperCase()));

					return true;
				}
			}

			return false;
		}

		function validateGangName(name: string) {
			const regex = /^[a-zA-Z0-9\s]+$/;

			return regex.test(name);
		}

		function validateImageUrl(url: string) {
			const regex = /^https:\/\/.*\.(jpg|jpeg|png|webp)$/i;

			return !regex.test(url);
		}

		function warn(text: string) {
			const container = defaultComponent({
				color: Colors.Red,
				description: text,
				user,
			});

			return replyWithContainer(interaction, container, true);
		}
	},
};

const Strings = {
	[Language.English]: {
		gangTitle: `Gangs`,
		gangDescription: `Create your gang and work as a team! Participate in ~~group robberies and gang fights~~!\n\n**Cost to create a gang: ${formatMoney(Gang.CREATION_COST, Language.English)}**`,
		gangNotFound: `Gang not found with this Id ${EmoteString.Gang}`,
		gangNotFoundByName: (name: string) => `No gang found with name or acronym **${name}** ${EmoteString.Gang}`,
		notInGang: `You are not in a gang! To see a specific gang, use the \`gang info\` command ${EmoteString.Gang}`,
		errorGettingGang: `Error retrieving gang information ${EmoteString.Gang}`,
		errorSearchingGang: `Error while searching for gang ${EmoteString.Gang}`,
		name: `Name`,
		acronym: `Acronym`,
		base: `Base`,
		leader: `Leader`,
		level: `Level`,
		totalInBalance: "Total in balance",
		members: `Members`,
		created: `Created`,
		updated: `Last Updated`,
		description: `Description`,
		color: `Color`,
		image: `Image`,
		gangId: (id: number) => `Gang Id: ${id}`,
		noMembers: `This gang has no members!`,
		membersOf: `Members of`,
		pageFooter: (current: number, total: number, members: number) => `Page ${current}/${total} · ${members} members`,
		gangAlreadyExistsName: (name: string) => `A gang with the name **${name}** already exists ${EmoteString.Gang}`,
		gangAlreadyExistsAcronym: (acronym: string) => `A gang with the acronym **${acronym}** already exists ${EmoteString.Gang}`,
		alreadyInGang: `You are already in a gang! You need to leave your current gang before creating a new one ${EmoteString.Gang}`,
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** is already in a gang ${EmoteString.Gang}`,
		notEnoughMoneyCreate: (cost: string) => `You don't have enough money to create a gang! It costs ${cost} ${EmoteString.Gang}`,
		notEnoughMoneyBase: (cost: string) => `Your gang don't have enough money balance to buy a base! It costs ${cost} ${EmoteString.Gang}`,
		lettersAndNumbers: `Gang name can only contain letters and numbers ${EmoteString.Gang}`,
		invalidURLImage: `Invalid image URL! Please provide a valid image URL ending with .jpg, .jpeg, .webp or .png ${EmoteString.Gang}`,
		errorCreatingGang: `Error while creating the gang. Try again later ${EmoteString.Gang}`,
		gangCreated: `Gang created successfully! ${EmoteString.Gang}`,
		gangCreatedDetails: (name: string, cost: string) => `You've created the gang **${name}** for ${cost} ${EmoteString.Gang}\n-# Use \`/gang info\` to see more details about your gang.`,
		gangEditted: `Gang editted successfully! ${EmoteString.Gang}`,
		errorEdittingGang: `Error while editting the gang. Try again later ${EmoteString.Gang}`,
		errorEdittingGangPermission: `You don't have permission to edit the gang ${EmoteString.Gang}`,
		errorInviteGangPermission: `You don't have permission to invite users to the gang ${EmoteString.Gang}`,
		errorInviteGangYourself: `You cannot invite yourself to the gang ${EmoteString.Gang}`,
		errorInviteGangGeneric: `Error inviting user to the gang. Please try again later ${EmoteString.Gang}`,
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** has been invited to the gang **${gangName}**! ${EmoteString.Gang}`,
		confirm: `Confirm`,
		confirmLeave: (gangName: string) => `Confirm leaving the gang **${gangName}**? ${EmoteString.Gang}`,
		errorLeaveGang: `Error leaving the gang. Please try again later ${EmoteString.Gang}`,
		errorLeaveGangLeader: `You cannot leave the gang as the leader. You need to transfer leadership or disband the gang ${EmoteString.Gang}`,
		successLeaveGang: (gangName: string) => `You have left gang **${gangName}** successfully ${EmoteString.Gang}`,
		noResponseLeaveGang: (gangName: string) => `You took too long to respond and did not leave gang **${gangName}** ${EmoteString.Gang}`,
		confirmKick: (nickname: string, gangName: string) => `Are you sure you want to kick **${nickname}** from the gang **${gangName}**? ${EmoteString.Gang}`,
		errorKickGangPermission: `You don't have permission to kick users from the gang ${EmoteString.Gang}`,
		errorKickGangYourself: `You cannot kick yourself from the gang ${EmoteString.Gang}`,
		errorKickGangLeader: `You cannot kick the gang leader ${EmoteString.Gang}`,
		errorKickGang: (nickname: string, gangName: string) => `Error kicking **${nickname}** from the gang **${gangName}**. Please try again later ${EmoteString.Gang}`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** has been kicked from the gang **${gangName}**! ${EmoteString.Gang}`,
		noResponseKickGang: (nickname: string, gangName: string) => `You took too long to respond and did not kick **${nickname}** from the gang **${gangName}** ${EmoteString.Gang}`,
		errorCommunicateGangPermission: `You don't have permission to communicate with gang members ${EmoteString.Gang}`,
		messageSent: `Message sent to gang members! ${EmoteString.Gang}`,
		prisonModifier: `chance of escaping from prison`,
		perLevelModifier: "per gang level",
		gangBasesTitle: `Gang Bases`,
		gangBasesCost: (cost: string) => `Bases cost ${cost} from the gang balance`,
		buy: `Buy`,
		back: `Back`,
		baseBought: (baseName: string, gangName: string) => `You bought the base **${baseName}** for the gang **${gangName}** ${EmoteString.Gang}`,
		depositSuccess: (amount: string, gangName: string) => `You deposited **${amount}** into the gang **${gangName}** ${EmoteString.Gang}`,
	},
	[Language.Portuguese]: {
		gangTitle: `Gangues`,
		gangDescription: `Crie sua gangue e trabalhe em equipe! Participe de ~~assaltos em grupo e lutas generalizadas~~!\n\n**Custo para criar uma gangue: ${formatMoney(Gang.CREATION_COST, Language.Portuguese)}**`,
		gangNotFound: `Gangue não encontrada com este Id ${EmoteString.Gang}`,
		gangNotFoundByName: (name: string) => `Nenhuma gangue encontrada com o nome ou acrônimo **${name}** ${EmoteString.Gang}`,
		notInGang: `Você não está em uma gangue! Para ver uma gangue específica, use o comando \`gangue info\` ${EmoteString.Gang}`,
		errorGettingGang: `Erro ao buscar informações da gangue ${EmoteString.Gang}`,
		errorSearchingGang: `Erro ao procurar pela gangue ${EmoteString.Gang}`,
		name: `Nome`,
		acronym: `Acrônimo`,
		base: `Base`,
		leader: `Líder`,
		level: `Nível`,
		totalInBalance: "Total em caixa",
		members: `Membros`,
		created: `Criada em`,
		updated: `Atualizada em`,
		description: `Descrição`,
		color: `Cor`,
		image: `Imagem`,
		gangId: (id: number) => `Id da Gangue: ${id}`,
		noMembers: `Esta gangue não tem membros!`,
		membersOf: `Membros de`,
		pageFooter: (current: number, total: number, members: number) => `Página ${current}/${total} · ${members} membros`,
		gangAlreadyExistsName: (name: string) => `Uma gangue com o nome **${name}** já existe ${EmoteString.Gang}`,
		gangAlreadyExistsAcronym: (acronym: string) => `Uma gangue com o acrônimo **${acronym}** já existe ${EmoteString.Gang}`,
		alreadyInGang: `Você já está em uma gangue! Você precisa sair da sua gangue atual antes de criar uma nova ${EmoteString.Gang}`,
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** já está em uma gangue ${EmoteString.Gang}`,
		notEnoughMoneyCreate: (cost: string) => `Você não tem dinheiro suficiente para criar uma gangue! Custa ${cost} ${EmoteString.Gang}`,
		notEnoughMoneyBase: (cost: string) => `Sua gangue não tem dinheiro suficiente no caixa para comprar uma base! Custa ${cost} ${EmoteString.Gang}`,
		lettersAndNumbers: `Nome da gangue só pode conter letras e números ${EmoteString.Gang}`,
		invalidURLImage: `URL de imagem inválida! Por favor, forneça uma URL de imagem válida terminando com .jpg, .jpeg, .webp ou .png. ${EmoteString.Gang}`,
		errorCreatingGang: `Erro ao criar a gangue. Tente novamente mais tarde. ${EmoteString.Gang}`,
		gangCreated: `Gangue criada com sucesso! ${EmoteString.Gang}`,
		gangCreatedDetails: (name: string, cost: string) => `Você criou a gangue **${name}** por ${cost} ${EmoteString.Gang}\n-# Use \`/gang info\` para ver mais detalhes sobre sua gangue.`,
		gangEditted: `Gangue editada com sucesso! ${EmoteString.Gang}`,
		errorEdittingGang: `Erro ao editar a gangue. Tente novamente mais tarde ${EmoteString.Gang}`,
		errorEdittingGangPermission: `Você não possui permissão para editar a gangue ${EmoteString.Gang}`,
		errorInviteGangPermission: `Você não possui permissão para convidar usuários para a gangue ${EmoteString.Gang}`,
		errorInviteGangYourself: `Você não pode convidar a si mesmo para a gangue ${EmoteString.Gang}`,
		errorInviteGangGeneric: `Erro ao convidar usuário para a gangue. Tente novamente mais tarde ${EmoteString.Gang}`,
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** foi convidado para a gangue **${gangName}**! ${EmoteString.Gang}`,
		confirm: `Confirmar`,
		confirmLeave: (gangName: string) => `Confirmar saída da gangue **${gangName}**? ${EmoteString.Gang}`,
		errorLeaveGang: `Erro ao sair da gangue. Tente novamente mais tarde ${EmoteString.Gang}`,
		errorLeaveGangLeader: `Você não pode sair da gangue como líder. Você precisa transferir a liderança ou dissolver a gangue ${EmoteString.Gang}`,
		successLeaveGang: (gangName: string) => `Você saiu da gangue **${gangName}** com sucesso ${EmoteString.Gang}`,
		noResponseLeaveGang: (gangName: string) => `Você demorou para responder e não saiu da gangue **${gangName}** ${EmoteString.Gang}`,
		confirmKick: (nickname: string, gangName: string) => `Você tem certeza que deseja expulsar **${nickname}** da gangue **${gangName}**? ${EmoteString.Gang}`,
		errorKickGangPermission: `Você não possui permissão para expulsar usuários da gangue ${EmoteString.Gang}`,
		errorKickGangYourself: `Você não pode expulsar a si mesmo da gangue ${EmoteString.Gang}`,
		errorKickGangLeader: `Você não pode expulsar o líder da gangue ${EmoteString.Gang}`,
		errorKickGang: (nickname: string, gangName: string) => `Erro ao expulsar **${nickname}** da gangue **${gangName}**. Tente novamente mais tarde ${EmoteString.Gang}`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** foi expulso da gangue **${gangName}**! ${EmoteString.Gang}`,
		noResponseKickGang: (nickname: string, gangName: string) => `Você demorou para responder e não expulsou **${nickname}** da gangue **${gangName}** ${EmoteString.Gang}`,
		errorCommunicateGangPermission: `Você não possui permissão para comunicar com os membros da gangue ${EmoteString.Gang}`,
		messageSent: `Mensagem enviada para os membros da gangue! ${EmoteString.Gang}`,
		prisonModifier: `chance de fugir da prisão`,
		perLevelModifier: "por nível da gangue",
		gangBasesTitle: `Bases de Gangue`,
		gangBasesCost: (cost: string) => `Bases custam ${cost} do caixa da gangue`,
		buy: `Comprar`,
		back: `Voltar`,
		baseBought: (baseName: string, gangName: string) => `Você comprou a base **${baseName}** para a gangue **${gangName}** ${EmoteString.Gang}`,
		depositSuccess: (amount: string, gangName: string) => `Você depositou **${amount}** na gangue **${gangName}** ${EmoteString.Gang}`,
	},
	[Language.Spanish]: {
		gangTitle: `Cuadrillas`,
		gangDescription: `¡Crea tu cuadrilla y trabaja en equipo! ¡Participa en ~~atracos grupales y peleas de cuadrillas~~!\n\n**Costo para crear una cuadrilla: ${formatMoney(Gang.CREATION_COST, Language.Spanish)}**`,
		gangNotFound: `¡Cuadrilla no encontrada con este Id ${EmoteString.Gang}`,
		gangNotFoundByName: (name: string) => `¡No se encontró ninguna quadrilla con el nombre o acrónimo **${name}** ${EmoteString.Gang}`,
		notInGang: `¡No estás en una quadrilla! Para ver una cuadrilla específica, usa el comando \`cuadrilla info\` ${EmoteString.Gang}`,
		errorGettingGang: `Error al obtener información de la cuadrilla ${EmoteString.Gang}`,
		errorSearchingGang: `Error al buscar la cuadrilla ${EmoteString.Gang}`,
		name: `Nombre`,
		acronym: `Acrónimo`,
		base: `Base`,
		leader: `Líder`,
		level: `Nivel`,
		totalInBalance: "Total en el balance",
		members: `Miembros`,
		created: `Creada`,
		updated: `Actualizada`,
		description: `Descripción`,
		color: `Color`,
		image: `Imagen`,
		gangId: (id: number) => `Id de Cuadrilla: ${id}`,
		noMembers: "¡Esta cuadrilla no tiene miembros!",
		membersOf: `Miembros de`,
		pageFooter: (current: number, total: number, members: number) => `Página ${current}/${total} · ${members} miembros`,
		gangAlreadyExistsName: (name: string) => `¡Una cuadrilla con el nombre **${name}** ya existe ${EmoteString.Gang}`,
		gangAlreadyExistsAcronym: (acronym: string) => `¡Una cuadrilla con el acrónimo **${acronym}** ya existe ${EmoteString.Gang}`,
		alreadyInGang: `¡Ya estás en una cuadrilla! Necesitas salir de tu cuadrilla actual antes de crear una nueva ${EmoteString.Gang}`,
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** ya está en una cuadrilla ${EmoteString.Gang}`,
		notEnoughMoneyCreate: (cost: string) => `¡No tienes suficiente dinero para crear una cuadrilla! Cuesta ${cost} ${EmoteString.Gang}`,
		notEnoughMoneyBase: (cost: string) => `¡Tu cuadrilla no tiene suficiente dinero en el balance para comprar una base! Cuesta ${cost} ${EmoteString.Gang}`,
		lettersAndNumbers: `El nombre de la cuadrilla solo puede contener letras y números ${EmoteString.Gang}`,
		invalidURLImage: `¡URL de imagen inválida! Por favor, proporciona una URL de imagen válida que termine en .jpg, .jpeg, .webp o .png ${EmoteString.Gang}`,
		errorCreatingGang: `Error al crear la cuadrilla. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		gangCreated: `¡Cuadrilla creada con éxito! ${EmoteString.Gang}`,
		gangCreatedDetails: (name: string, cost: string) => `Has creado la cuadrilla **${name}** por ${cost} ${EmoteString.Gang}\n-# Usa \`/gang info\` para ver más detalles sobre tu cuadrilla.`,
		gangEditted: `¡Cuadrilla editada con éxito! ${EmoteString.Gang}`,
		errorEdittingGang: `Error al editar la cuadrilla. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		errorEdittingGangPermission: `No tienes permiso para editar la cuadrilla ${EmoteString.Gang}`,
		errorInviteGangPermission: `No tienes permiso para invitar usuarios a la cuadrilla ${EmoteString.Gang}`,
		errorInviteGangYourself: `No puedes invitarte a ti mismo a la cuadrilla ${EmoteString.Gang}`,
		errorInviteGangGeneric: `Error al invitar usuario a la cuadrilla. Por favor, inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** ha sido invitado a la cuadrilla **${gangName}**! ${EmoteString.Gang}`,
		confirm: `Confirmar`,
		confirmLeave: (gangName: string) => `¿Confirmar salida de la cuadrilla **${gangName}**? ${EmoteString.Gang}`,
		errorLeaveGang: `Error al salir de la cuadrilla. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		errorLeaveGangLeader: `No puedes salir de la cuadrilla como líder. Necesitas transferir el liderazgo o disolver la cuadrilla ${EmoteString.Gang}`,
		successLeaveGang: (gangName: string) => `Has salido de la cuadrilla **${gangName}** con éxito ${EmoteString.Gang}`,
		noResponseLeaveGang: (gangName: string) => `Te demoraste en responder y no saliste de la cuadrilla **${gangName}** ${EmoteString.Gang}`,
		confirmKick: (nickname: string, gangName: string) => `¿Estás seguro de que deseas expulsar a **${nickname}** de la cuadrilla **${gangName}**? ${EmoteString.Gang}`,
		errorKickGangPermission: `No tienes permiso para expulsar usuarios de la cuadrilla ${EmoteString.Gang}`,
		errorKickGangYourself: `No puedes expulsarte a ti mismo de la cuadrilla ${EmoteString.Gang}`,
		errorKickGangLeader: `No puedes expulsar al líder de la cuadrilla ${EmoteString.Gang}`,
		errorKickGang: (nickname: string, gangName: string) => `Error al expulsar a **${nickname}** de la cuadrilla **${gangName}**. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** ha sido expulsado de la cuadrilla **${gangName}**! ${EmoteString.Gang}`,
		noResponseKickGang: (nickname: string, gangName: string) => `Te demoraste en responder y no expulsaste a **${nickname}** de la cuadrilla **${gangName}** ${EmoteString.Gang}`,
		errorCommunicateGangPermission: `No tienes permiso para comunicarte con los miembros de la cuadrilla ${EmoteString.Gang}`,
		messageSent: `¡Mensaje enviado a los miembros de la cuadrilla! ${EmoteString.Gang}`,
		prisonModifier: `probabilidad de escapar de la cárcel`,
		perLevelModifier: "por nivel de cuadrilla",
		gangBasesTitle: `Bases de Cuadrilla`,
		gangBasesCost: (cost: string) => `Las bases cuestan ${cost} del saldo de la cuadrilla`,
		buy: `Comprar`,
		back: `Volver`,
		baseBought: (baseName: string, gangName: string) => `Compraste la base **${baseName}** para la cuadrilla **${gangName}** ${EmoteString.Gang}`,
		depositSuccess: (amount: string, gangName: string) => `Depositaste **${amount}** en la cuadrilla **${gangName}** ${EmoteString.Gang}`,
	},
} as const;
