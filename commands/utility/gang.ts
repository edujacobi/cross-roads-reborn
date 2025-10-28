import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ColorResolvable,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { Gang } from "../../models/Gang";
import {
	convertHexNumberToString,
	DEFAULT_GANG_IMAGE,
	defaultComponent,
	formatMoney,
	hexToRGB,
	showTime,
} from "../../utils/ui";
import { disableButtons, replyInteraction, searchUser } from "../../utils/logic";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { GangColor, IGangColor } from "../../utils/colors";

enum CommandOption {
	Info = "info",
	Create = "create",
	Edit = "edit",
	Invite = "invite",
	Leave = "leave",
	Kick = "kick",
	Communicate = "communicate",
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
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const containerInfo = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(Colors.Green)
			.addSectionComponents(main => main
				.addTextDisplayComponents(
					title => title
						.setContent(`# ${s.gangTitle}`),
					description => description
						.setContent(s.gangDescription),
				)
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://i.imgur.com/k2KSJsE.png")
					.setDescription("Gang icon"),
				),
			)
			.addFooter();

		const subCommand = interaction.options.getSubcommand();

		switch (subCommand) {
		case CommandOption.Info: {
			await interaction.deferReply();

			const searchName = interaction.options.getString("name");

			try {
				let gang: Gang | null;

				if (!searchName) {
					// If no name provided, check user's gang
					gang = await Gang.GetByUserId(user.Id);

					if (!gang) {
						return replyInteraction(interaction, {
							components: [containerInfo],
							flags: MessageFlags.IsComponentsV2,
						});
					}
				}
				else {
					// Search gang by name
					gang = await Gang.FindByName(searchName);
					if (!gang) {
						return warn(s.gangNotFoundByName(searchName));
					}
				}

				const buttonInfo = new ButtonBuilder()
					.setLabel("Info")
					.setCustomId("info")
					.setStyle(ButtonStyle.Secondary);

				const row = new ActionRowBuilder<ButtonBuilder>()
					.addComponents([buttonInfo]);

				const membersList = gang.Members.map(member => {
					const underscore = member.UserId == interaction.user.id ? "__" : "";
					const emote = gang!.GetMemberEmote(member);

					return `${emote} ${underscore}${member.Nickname}${underscore} - ${member.RoleName}`;
				}).join("\n");

				const adminIdText = user.Id === process.env.JACOBI_ID ? ` • ${s.gangId(gang.Id)}` : "";

				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(hexToRGB(convertHexNumberToString(GangColor[gang.Color].Color)))
					.addSectionComponents(header => header
						.addTextDisplayComponents(
							headerText => headerText
								.setContent(`# [${gang!.Acronym}] ${gang!.Name}${GangColor[gang!.Color].Emote.String}\n_${gang!.Description}_`),
							levelBar => levelBar
								.setContent(`-# ${s.level} ${gang!.Level} ${gang!.GetExpBar(6)}`),
						)
						.setThumbnailAccessory(image => image
							.setURL(gang!.Image || DEFAULT_GANG_IMAGE)
							.setDescription(`Gang Image`),
						),
					)
					.addLargeSeparator()
					.addTextDisplayComponents(members => members
						.setContent(`### ${s.members} (${gang!.Members.length}/${gang!.GetMaxMembers()})\n${membersList}`),
					)
					.addFooter({
						text: `${s.created} ${showTime(gang.CreatedAt.getTime())}${adminIdText}`,
					});

				let responded = false;
				const response = await replyInteraction(interaction, {
					components: user.GangId === gang.Id ? [container, row] : [container],
					flags: MessageFlags.IsComponentsV2,
				});

				const collector = response?.createMessageComponentCollector({
					filter: (i: MessageComponentInteraction) => i.user.id === user.Id,
					max: 1,
					componentType: ComponentType.Button,
					time: 60_000,
				});

				collector?.on("collect", async btn => {
					if (btn.customId === "info") {
						responded = true;

						await replyInteraction(interaction, {
							components: [containerInfo],
							flags: MessageFlags.IsComponentsV2,
						});
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
			await interaction.deferReply();

			// Verificar se o usuário já está em uma gangue
			if (user.IsInGang()) {
				return warn(s.alreadyInGang);
			}

			// Verificar se o usuário tem dinheiro suficiente
			if (user.Money < Gang.CREATION_COST) {
				return warn(s.notEnoughMoney(formatMoney(Gang.CREATION_COST, language)));
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
				.addTextDisplayComponents(
					title => title
						.setContent(s.gangCreated),
					description => description
						.setContent(s.gangCreatedDetails(gang.Name, formatMoney(Gang.CREATION_COST, language))),
				)
				.addTextDisplayComponents(Name => Name
					.setContent(`### ${s.name}\n${gang.Name}`),
				)
				.addTextDisplayComponents(Acronym => Acronym
					.setContent(`### ${s.acronym}\n${gang.Acronym.toUpperCase()}`),
				)
				.addTextDisplayComponents(Description => Description
					.setContent(`### ${s.description}\n${gang.Description}`),
				)
				.addTextDisplayComponents(Color => Color
					.setContent(`### ${s.color}\n${GangColor[gang.Color].Emote.String} ${GangColor[gang.Color].Description[language]}`),
				);

			if (image) {
				container.addTextDisplayComponents(Image => Image
					.setContent(`### ${s.image}\n${gang.Image}`),
				);
			}

			container.addFooter();

			return replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		case CommandOption.Edit: {
			await interaction.deferReply();

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
				.addTextDisplayComponents(title => title
					.setContent(`-# ${s.gangEditted}`),
				)
				.addLargeSeparator();

			if (name) {
				container.addTextDisplayComponents(newName => newName
					.setContent(`### ${s.name}\n-# ~~${old.name}~~\n${gang.Name}`));
			}
			if (acronym) {
				container.addTextDisplayComponents(newAcronym => newAcronym
					.setContent(`### ${s.acronym}\n-# ~~${old.acronym.toUpperCase()}~~\n${gang.Acronym.toUpperCase()}`));
			}
			if (description) {
				container.addTextDisplayComponents(newDescription => newDescription
					.setContent(`### ${s.description}\n-# ~~${old.description}~~\n${gang.Description}`));
			}
			if (color != null) {
				container.addTextDisplayComponents(newColor => newColor
					.setContent(`### ${s.color}\n-# ~~${GangColor[old.color].Emote.String} ${GangColor[old.color].Description[language]}~~\n${GangColor[gang.Color].Emote.String} ${GangColor[gang.Color].Description[language]}`));
			}
			if (image) {
				container.addTextDisplayComponents(newImage => newImage
					.setContent(`### ${s.image}\n-# ~~${old.image}~~\n${gang.Image}`));
			}

			container.addFooter();

			return replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}

		case CommandOption.Invite: {
			await interaction.deferReply();

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

			return replyInteraction(interaction, {
				components: [defaultComponent({
					color: GangColor[gang.Color].Color as ColorResolvable,
					description: s.successInviteGang(target.GetNameWithImage(), gang.Name),
					user,
				})],
				flags: [
					MessageFlags.IsComponentsV2,
				],
			});
		}

		case CommandOption.Leave: {
			await interaction.deferReply();

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

			const response = await replyInteraction(interaction, {
				components: [
					defaultComponent({
						user,
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.confirmLeave(gang.Name),
						buttons: row,
					}),
				],
				flags: MessageFlags.IsComponentsV2,
			});

			const collector = response?.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === user.Id,
				max: 1,
				componentType: ComponentType.Button,
				time: 60_000,
			});

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

					return replyInteraction(interaction, {
						components: [defaultComponent({
							color: GangColor[gang.Color].Color as ColorResolvable,
							description: s.successLeaveGang(gang.Name),
							user,
						})],
						flags: [
							MessageFlags.IsComponentsV2,
						],
					});
				}
			});

			collector?.on("end", async () => {
				if (responded) return;

				await disableButtons(
					interaction,
					defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.noResponseLeaveGang(gang.Name),
						user,
					}),
				);
			});

			return;
		}

		case CommandOption.Kick: {
			await interaction.deferReply();

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

			const response = await replyInteraction(interaction, {
				components: [
					defaultComponent({
						user,
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.confirmKick(target.Nickname, gang.Name),
						buttons: row,
					}),
				],
				flags: MessageFlags.IsComponentsV2,
			});

			const collector = response?.createMessageComponentCollector({
				filter: (i: MessageComponentInteraction) => i.user.id === user.Id,
				max: 1,
				componentType: ComponentType.Button,
				time: 60_000,
			});

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

					return replyInteraction(interaction, {
						components: [defaultComponent({
							color: GangColor[gang.Color].Color as ColorResolvable,
							description: s.successKickGang(target.Nickname, gang.Name),
							user,
						})],
						flags: [
							MessageFlags.IsComponentsV2,
						],
					});
				}
			});

			collector?.on("end", async () => {
				if (responded) return;

				await disableButtons(
					interaction,
					defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.noResponseKickGang(target.Nickname, gang.Name),
						user,
					}),
				);
			});

			return;
		}

		case CommandOption.Communicate: {
			await interaction.deferReply();

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

			return replyInteraction(interaction, {
				components: [defaultComponent({
					color: GangColor[gang.Color].Color as ColorResolvable,
					description: `> ${text}\n${s.messageSent}`,
					user,
				})],
				flags: [MessageFlags.IsComponentsV2],
			});
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
			return replyInteraction(interaction, {
				components: [defaultComponent({
					color: Colors.Red,
					description: text,
					user,
				})],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};

const Strings = {
	[Language.English]: {
		gangTitle: "Gangs",
		gangDescription: `Create your gang and work as a team! Participate in ~~group robberies and gang fights~~!\n\n**Cost to create a gang: ${formatMoney(Gang.CREATION_COST, Language.English)}**`,
		gangNotFound: "Gang not found with this Id!",
		gangNotFoundByName: (name: string) => `No gang found with name or acronym **${name}**!`,
		notInGang: "You are not in a gang! To see a specific gang, use the `name` parameter.",
		errorGettingGang: "Error retrieving gang information.",
		errorSearchingGang: "Error while searching for gang.",
		name: "Name",
		acronym: "Acronym",
		base: "Base",
		leader: "Leader",
		level: "Level",
		members: "Members",
		created: "Created",
		updated: "Last Updated",
		description: "Description",
		color: "Color",
		image: "Image",
		gangId: (id: number) => `Gang Id: ${id}`,
		noMembers: "This gang has no members!",
		membersOf: "Members of",
		pageFooter: (current: number, total: number, members: number) => `Page ${current}/${total} · ${members} members`,
		gangAlreadyExistsName: (name: string) => `A gang with the name **${name}** already exists!`,
		gangAlreadyExistsAcronym: (acronym: string) => `A gang with the acronym **${acronym}** already exists!`,
		alreadyInGang: "You are already in a gang! You need to leave your current gang before creating a new one.",
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** is already in a gang!`,
		notEnoughMoney: (cost: string) => `You don't have enough money to create a gang! It costs ${cost}.`,
		lettersAndNumbers: "Gang name can only contain letters and numbers.",
		invalidURLImage: "Invalid image URL! Please provide a valid image URL ending with .jpg, .jpeg, .webp or .png.",
		errorCreatingGang: "Error while creating the gang. Try again later.",
		gangCreated: "Gang created successfully!",
		gangCreatedDetails: (name: string, cost: string) => `You've created the gang **${name}** for ${cost}.\nUse \`/gang info\` to see more details about your gang.`,
		gangEditted: "Gang editted successfully!",
		errorEdittingGang: "Error while editting the gang. Try again later.",
		errorEdittingGangPermission: "You don't have permission to edit the gang.",
		errorInviteGangPermission: "You don't have permission to invite users to the gang.",
		errorInviteGangYourself: "You cannot invite yourself to the gang.",
		errorInviteGangGeneric: "Error inviting user to the gang. Please try again later.",
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** has been invited to the gang **${gangName}**!`,
		confirm: "Confirm",
		confirmLeave: (gangName: string) => `Confirm leaving the gang **${gangName}**?`,
		errorLeaveGang: "Error leaving the gang. Please try again later.",
		errorLeaveGangLeader: `You cannot leave the gang as the leader. You need to transfer leadership or disband the gang.`,
		successLeaveGang: (gangName: string) => `You have left gang **${gangName}** successfully.`,
		noResponseLeaveGang: (gangName: string) => `You took too long to respond and did not leave gang **${gangName}**.`,
		confirmKick: (nickname: string, gangName: string) => `Are you sure you want to kick **${nickname}** from the gang **${gangName}**?`,
		errorKickGangPermission: "You don't have permission to kick users from the gang.",
		errorKickGangYourself: "You cannot kick yourself from the gang.",
		errorKickGangLeader: "You cannot kick the gang leader.",
		errorKickGang: (nickname: string, gangName: string) => `Error kicking **${nickname}** from the gang **${gangName}**. Please try again later.`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** has been kicked from the gang **${gangName}**!`,
		noResponseKickGang: (nickname: string, gangName: string) => `You took too long to respond and did not kick **${nickname}** from the gang **${gangName}**.`,
		errorCommunicateGangPermission: "You don't have permission to communicate with gang members.",
		messageSent: "Message sent to gang members!",
	},
	[Language.Portuguese]: {
		gangTitle: "Gangues",
		gangDescription: `Crie sua gangue e trabalhe em equipe! Participe de ~~assaltos em grupo e lutas generalizadas~~!\n\n**Custo para criar uma gangue: ${formatMoney(Gang.CREATION_COST, Language.Portuguese)}**`,
		gangNotFound: "Gangue não encontrada com este Id!",
		gangNotFoundByName: (name: string) => `Nenhuma gangue encontrada com o nome ou acrônimo **${name}**!`,
		notInGang: "Você não está em uma gangue! Para ver uma gangue específica, use o parâmetro `name`.",
		errorGettingGang: "Erro ao buscar informações da gangue.",
		errorSearchingGang: "Erro ao procurar pela gangue.",
		name: "Nome",
		acronym: "Acrônimo",
		base: "Base",
		leader: "Líder",
		level: "Nível",
		members: "Membros",
		created: "Criada em",
		updated: "Atualizada em",
		description: "Descrição",
		color: "Cor",
		image: "Imagem",
		gangId: (id: number) => `Id da Gangue: ${id}`,
		noMembers: "Esta gangue não tem membros!",
		membersOf: "Membros de",
		pageFooter: (current: number, total: number, members: number) => `Página ${current}/${total} · ${members} membros`,
		gangAlreadyExistsName: (name: string) => `Uma gangue com o nome **${name}** já existe!`,
		gangAlreadyExistsAcronym: (acronym: string) => `Uma gangue com o acrônimo **${acronym}** já existe!`,
		alreadyInGang: "Você já está em uma gangue! Você precisa sair da sua gangue atual antes de criar uma nova.",
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** já está em uma gangue!`,
		notEnoughMoney: (cost: string) => `Você não tem dinheiro suficiente para criar uma gangue! Custa ${cost}.`,
		lettersAndNumbers: "Nome da gangue só pode conter letras e números.",
		invalidURLImage: "URL de imagem inválida! Por favor, forneça uma URL de imagem válida terminando com .jpg, .jpeg, .webp ou .png.",
		errorCreatingGang: "Erro ao criar a gangue. Tente novamente mais tarde.",
		gangCreated: "Gangue criada com sucesso!",
		gangCreatedDetails: (name: string, cost: string) => `Você criou a gangue **${name}** por ${cost}.\nUse \`/gang info\` para ver mais detalhes sobre sua gangue.`,
		gangEditted: "Gangue editada com sucesso!",
		errorEdittingGang: "Erro ao editar a gangue. Tente novamente mais tarde.",
		errorEdittingGangPermission: "Você não possui permissão para editar a gangue",
		errorInviteGangPermission: "Você não possui permissão para convidar usuários para a gangue.",
		errorInviteGangYourself: "Você não pode convidar a si mesmo para a gangue.",
		errorInviteGangGeneric: "Erro ao convidar usuário para a gangue. Tente novamente mais tarde.",
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** foi convidado para a gangue **${gangName}**!`,
		confirm: "Confirmar",
		confirmLeave: (gangName: string) => `Confirmar saída da gangue **${gangName}**?`,
		errorLeaveGang: "Erro ao sair da gangue. Tente novamente mais tarde.",
		errorLeaveGangLeader: `Você não pode sair da gangue como líder. Você precisa transferir a liderança ou dissolver a gangue.`,
		successLeaveGang: (gangName: string) => `Você saiu da gangue **${gangName}** com sucesso.`,
		noResponseLeaveGang: (gangName: string) => `Você demorou para responder e não saiu da gangue **${gangName}**`,
		confirmKick: (nickname: string, gangName: string) => `Você tem certeza que deseja expulsar **${nickname}** da gangue **${gangName}**?`,
		errorKickGangPermission: "Você não possui permissão para expulsar usuários da gangue.",
		errorKickGangYourself: "Você não pode expulsar a si mesmo da gangue.",
		errorKickGangLeader: "Você não pode expulsar o líder da gangue.",
		errorKickGang: (nickname: string, gangName: string) => `Erro ao expulsar **${nickname}** da gangue **${gangName}**. Tente novamente mais tarde.`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** foi expulso da gangue **${gangName}**!`,
		noResponseKickGang: (nickname: string, gangName: string) => `Você demorou para responder e não expulsou **${nickname}** da gangue **${gangName}**.`,
		errorCommunicateGangPermission: "Você não possui permissão para comunicar com os membros da gangue.",
		messageSent: "Mensagem enviada para os membros da gangue!",
	},
	[Language.Spanish]: {
		gangTitle: "Cuadrillas",
		gangDescription: `¡Crea tu cuadrilla y trabaja en equipo! ¡Participa en ~~atracos grupales y peleas de cuadrillas~~!\n\n**Costo para crear una cuadrilla: ${formatMoney(Gang.CREATION_COST, Language.Spanish)}**`,
		gangNotFound: "¡Cuadrilla no encontrada con este Id!",
		gangNotFoundByName: (name: string) => `¡No se encontró ninguna quadrilla con el nombre o acrónimo **${name}**!`,
		notInGang: "¡No estás en una quadrilla! Para ver una cuadrilla específica, usa el parámetro `name`.",
		errorGettingGang: "Error al obtener información de la cuadrilla.",
		errorSearchingGang: "Error al buscar la cuadrilla.",
		name: "Nombre",
		acronym: "Acrónimo",
		base: "Base",
		leader: "Líder",
		level: "Nivel",
		members: "Miembros",
		created: "Creada",
		updated: "Actualizada",
		description: "Descripción",
		color: "Color",
		image: "Imagen",
		gangId: (id: number) => `Id de Cuadrilla: ${id}`,
		noMembers: "¡Esta cuadrilla no tiene miembros!",
		membersOf: "Miembros de",
		pageFooter: (current: number, total: number, members: number) => `Página ${current}/${total} · ${members} miembros`,
		gangAlreadyExistsName: (name: string) => `¡Una cuadrilla con el nombre **${name}** ya existe!`,
		gangAlreadyExistsAcronym: (acronym: string) => `¡Una cuadrilla con el acrónimo **${acronym}** ya existe!`,
		alreadyInGang: "¡Ya estás en una cuadrilla! Necesitas salir de tu cuadrilla actual antes de crear una nueva.",
		userAlreadyInGang: (user: User) => `**${user.GetNameWithImage()}** ya está en una cuadrilla!`,
		notEnoughMoney: (cost: string) => `¡No tienes suficiente dinero para crear una cuadrilla! Cuesta ${cost}.`,
		lettersAndNumbers: "El nombre de la cuadrilla solo puede contener letras y números.",
		invalidURLImage: "¡URL de imagen inválida! Por favor, proporciona una URL de imagen válida que termine en .jpg, .jpeg, .webp o .png.",
		errorCreatingGang: "Error al crear la cuadrilla. Inténtalo de nuevo más tarde.",
		gangCreated: "¡Cuadrilla creada con éxito!",
		gangCreatedDetails: (name: string, cost: string) => `Has creado la cuadrilla **${name}** por ${cost}.\nUsa \`/gang info\` para ver más detalles sobre tu cuadrilla.`,
		gangEditted: "¡Cuadrilla editada con éxito!",
		errorEdittingGang: "Error al editar la cuadrilla. Inténtalo de nuevo más tarde.",
		errorEdittingGangPermission: "No tienes permiso para editar la cuadrilla",
		errorInviteGangPermission: "No tienes permiso para invitar usuarios a la cuadrilla.",
		errorInviteGangYourself: "No puedes invitarte a ti mismo a la cuadrilla.",
		errorInviteGangGeneric: "Error al invitar usuario a la cuadrilla. Por favor, inténtalo de nuevo más tarde.",
		successInviteGang: (nickname: string, gangName: string) => `**${nickname}** ha sido invitado a la cuadrilla **${gangName}**!`,
		confirm: "Confirmar",
		confirmLeave: (gangName: string) => `¿Confirmar salida de la cuadrilla **${gangName}**?`,
		errorLeaveGang: "Error al salir de la cuadrilla. Inténtalo de nuevo más tarde.",
		errorLeaveGangLeader: `No puedes salir de la cuadrilla como líder. Necesitas transferir el liderazgo o disolver la cuadrilla.`,
		successLeaveGang: (gangName: string) => `Has salido de la cuadrilla **${gangName}** con éxito.`,
		noResponseLeaveGang: (gangName: string) => `Te demoraste en responder y no saliste de la cuadrilla **${gangName}**.`,
		confirmKick: (nickname: string, gangName: string) => `¿Estás seguro de que deseas expulsar a **${nickname}** de la cuadrilla **${gangName}**?`,
		errorKickGangPermission: "No tienes permiso para expulsar usuarios de la cuadrilla.",
		errorKickGangYourself: "No puedes expulsarte a ti mismo de la cuadrilla.",
		errorKickGangLeader: "No puedes expulsar al líder de la cuadrilla.",
		errorKickGang: (nickname: string, gangName: string) => `Error al expulsar a **${nickname}** de la cuadrilla **${gangName}**. Inténtalo de nuevo más tarde.`,
		successKickGang: (nickname: string, gangName: string) => `**${nickname}** ha sido expulsado de la cuadrilla **${gangName}**!`,
		noResponseKickGang: (nickname: string, gangName: string) => `Te demoraste en responder y no expulsaste a **${nickname}** de la cuadrilla **${gangName}**.`,
		errorCommunicateGangPermission: "No tienes permiso para comunicarte con los miembros de la cuadrilla.",
		messageSent: "¡Mensaje enviado a los miembros de la cuadrilla!",
	},
} as const;
