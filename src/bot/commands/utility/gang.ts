import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { DEFAULT_GANG_IMAGE } from "#bot/ui/builders/GangImageCanvasBuilder";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors, GangColor, type IGangColor } from "#bot/utils/colors";
import { deferReply, deferUpdate, replyWithContainer, sendComplexPrivateMessage } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { convertHexNumberToString, defaultComponent, formatMoney, hexToRGB, showTime } from "#bot/utils/ui";
import { checkUser, searchUser } from "#bot/utils/userUtils";
import { Gang, GangPermission } from "#core/models/Gang";
import { InvestmentRobbery, InvestmentRobberyReason } from "#core/models/InvestmentRobbery";
import { Language, type Localization } from "#core/models/Language";
import { type User } from "#core/models/User";
import { GangBaseId, GangBases, type GangModifier, getGangBases } from "#core/types/GangBases";
import { addHours, isFuture } from "date-fns";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	type ColorResolvable,
	Colors,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

enum CommandOption {
	Info = "info",
	Create = "create",
	Edit = "edit",
	Invite = "invite",
	Leave = "leave",
	Kick = "kick",
	Communicate = "communicate",
	Base = "base",
	Deposit = "deposit",
	CreateRole = "create_role",
	ChangeRole = "change_role",
	EditRole = "edit_role",
	Roles = "roles",
	Transfer = "transfer",
	RobInvestment = "rob_investment",
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
		)
		.addSubcommand(createRole => createRole
			.setName(CommandOption.CreateRole)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "criar_cargo",
				[Locale.SpanishES]: "crear_cargo",
			})
			.setDescription("Create a new role for your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Cria um novo cargo para sua gangue",
				[Locale.SpanishES]: "Crea un nuevo cargo para tu cuadrilla",
			})
			.addStringOption(name => name
				.setName("name")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "nome",
					[Locale.SpanishES]: "nombre",
				})
				.setDescription("Role name")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Nome do cargo",
					[Locale.SpanishES]: "Nombre del cargo",
				})
				.setRequired(true)
				.setMinLength(2)
				.setMaxLength(20),
			),
		)
		.addSubcommand(changeRole => changeRole
			.setName(CommandOption.ChangeRole)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "mudar_cargo",
				[Locale.SpanishES]: "cambiar_cargo",
			})
			.setDescription("Change a member's role")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Muda o cargo de um membro",
				[Locale.SpanishES]: "Cambia el cargo de un miembro",
			})
			.addStringOption(user => user
				.setName("user")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "usuario",
					[Locale.SpanishES]: "usuario",
				})
				.setDescription("User to change role")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Usuário para mudar o cargo",
					[Locale.SpanishES]: "Usuario para cambiar el cargo",
				})
				.setRequired(true),
			),
		)
		.addSubcommand(editRole => editRole
			.setName(CommandOption.EditRole)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "editar_cargo",
				[Locale.SpanishES]: "editar_cargo",
			})
			.setDescription("Edit an existing role in your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Edita um cargo existente na sua gangue",
				[Locale.SpanishES]: "Edita un cargo existente en tu cuadrilla",
			})
			.addStringOption(role => role
				.setName("role")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "cargo",
					[Locale.SpanishES]: "cargo",
				})
				.setDescription("The name of the role to edit")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "O nome do cargo para editar",
					[Locale.SpanishES]: "El nombre del cargo para editar",
				})
				.setRequired(true),
			)
			.addStringOption(newName => newName
				.setName("new_name")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "novo_nome",
					[Locale.SpanishES]: "nuevo_nombre",
				})
				.setDescription("The new name for the role")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "O novo nome para o cargo",
					[Locale.SpanishES]: "El nuevo nombre para el cargo",
				})
				.setMinLength(2)
				.setMaxLength(20),
			),
		)
		.addSubcommand(roles => roles
			.setName(CommandOption.Roles)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "cargos",
				[Locale.SpanishES]: "cargos",
			})
			.setDescription("List all roles in your gang")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Lista todos os cargos da sua gangue",
				[Locale.SpanishES]: "Lista todos los cargos de tu cuadrilla",
			}),
		)
		.addSubcommand(transfer => transfer
			.setName(CommandOption.Transfer)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "transferir",
				[Locale.SpanishES]: "transferir",
			})
			.setDescription("Transfer the leadership of your gang to another member")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Transfere a liderança da sua gangue para outro membro",
				[Locale.SpanishES]: "Transfiere el liderazgo de tu cuadrilla a otro miembro",
			})
			.addStringOption(user => user
				.setName("user")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "usuario",
					[Locale.SpanishES]: "usuario",
				})
				.setDescription("User to transfer the leadership to")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Usuário para transferir a liderança",
					[Locale.SpanishES]: "Usuario a quien transferir el liderazgo",
				})
				.setRequired(true),
			),
		)
		.addSubcommand(robInvestment => robInvestment
			.setName(CommandOption.RobInvestment)
			.setNameLocalizations({
				[Locale.PortugueseBR]: "roubar_investimento",
				[Locale.SpanishES]: "robar_inversion",
			})
			.setDescription("Rob a user's investment (Nickname or Id)")
			.setDescriptionLocalizations({
				[Locale.PortugueseBR]: "Rouba o investimento de um usuário (Apelido ou Id)",
				[Locale.SpanishES]: "Roba la inversión de un usuario (Apodo o Id)",
			})
			.addStringOption(user => user
				.setName("user")
				.setNameLocalizations({
					[Locale.PortugueseBR]: "usuario",
					[Locale.SpanishES]: "usuario",
				})
				.setDescription("Target user to rob (Nickname or Id)")
				.setDescriptionLocalizations({
					[Locale.PortugueseBR]: "Usuário alvo do roubo (Apelido ou Id)",
					[Locale.SpanishES]: "Usuario objetivo a robar (Apodo o Id)",
				})
				.setRequired(true),
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
			.addFooter({
				text: formatMoney(user.Money, language),
			});

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

				enum MemberListType {
					Nickname = "nickname",
					Id = "id",
					Deposit = "deposit",
				}

				let currentType: string = MemberListType.Nickname;

				const membersList = (type: string) => gang.Members.map(member => {
					const underscore = member.UserId == interaction.user.id ? "__" : "";
					const emote = gang.GetMemberEmote(member);

					let info = "";
					let deposit = "";
					if (type === MemberListType.Nickname) {
						info = member.Nickname;
					}
					else if (type === MemberListType.Id) {
						info = member.UserId;
					}
					else if (type === MemberListType.Deposit) {
						info = member.Nickname;
						let textDeposit = s.canDeposit as string;
						if (member.Deposit.Time > new Date()) {
							textDeposit = `${s.canDepositAgain} ${showTime(member.Deposit.Time.getTime(), true)}`;
						}
						deposit = `\n-# ${formatMoney(member.Deposit.Amount, language)}. ${textDeposit}`;
					}

					return `${emote} ${underscore}${info}${underscore} - ${member.RoleName}${deposit}`;
				}).join("\n");

				const adminIdText = user.Id === process.env.JACOBI_ID ? ` • ${s.gangId(gang.Id)}` : "";

				const gangBase = GangBases[gang.BaseId];

				const gangBaseModifierText: string[] = [];

				if (gangBase.Modifier.PrisonEscape?.Positive) {
					gangBaseModifierText.push(`${EmoteString.Victory} +${gangBase.Modifier.PrisonEscape?.Positive * gang.Level}% ${s.prisonModifier} ${EmoteString.Escape}`);
				}
				if (gangBase.Modifier.Attack?.Positive) {
					gangBaseModifierText.push(`${EmoteString.Victory}${EmoteString.Attack}+${gangBase.Modifier.Attack?.Positive * gang.Level} ATK `);
				}
				if (gangBase.Modifier.Defense?.Positive) {
					gangBaseModifierText.push(`${EmoteString.Victory}${EmoteString.Defense}+${gangBase.Modifier.Defense?.Positive * gang.Level} DEF`);
				}

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
								`-# ${s.level} ${gang.Level} ${gang.GetExpBar(6, language)}`,
								``,
								gangBaseModifierText.join("\n"),
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

				const nickBtn = new ButtonBuilder()
					.setLabel("Nicknames")
					.setCustomId(MemberListType.Nickname)
					.setDisabled(true)
					.setStyle(ButtonStyle.Secondary);

				const idBtn = new ButtonBuilder()
					.setLabel("IDs")
					.setCustomId(MemberListType.Id)
					.setStyle(ButtonStyle.Secondary);

				const depositBtn = new ButtonBuilder()
					.setLabel(s.deposits)
					.setCustomId(MemberListType.Deposit)
					.setDisabled(user.GangId !== gang.Id)
					.setStyle(ButtonStyle.Secondary);

				container
					.addTexts([
						`### ${s.members} (${gang.Members.length}/${gang.GetMaxMembers()})`,
					])
					.addTexts([
						`${membersList(currentType)}`,
					], 10)
					.addButtonRow(
						() => nickBtn,
						() => idBtn,
						() => depositBtn,
					)
					.addFooter({
						text: `${s.created} ${showTime(gang.CreatedAt.getTime())}${adminIdText}`,
						button: new ButtonBuilder()
							.setLabel("Info")
							.setCustomId("info")
							.setStyle(ButtonStyle.Secondary),
					});

				let gotToInfo = false;
				const response = await replyWithContainer(interaction, container);

				const collector = createButtonCollector(interaction, response);

				collector?.on("end", async () => {
					if (gotToInfo) return;
					await disableButtons(interaction, container);
				});

				collector?.on("collect", async btn => {
					await deferUpdate(btn);

					if (btn.customId === "info") {
						gotToInfo = true;
						return replyWithContainer(interaction, containerInfo);
					}

					else if (btn.customId === MemberListType.Nickname) {
						currentType = btn.customId as MemberListType;
						container.changeTextFromSectionId(10, `${membersList(currentType)}`);
						nickBtn.setDisabled(true);
						idBtn.setDisabled(false);
						depositBtn.setDisabled(user.GangId !== gang.Id);
						return replyWithContainer(interaction, container);
					}

					else if (btn.customId === MemberListType.Id) {
						currentType = btn.customId as MemberListType;
						container.changeTextFromSectionId(10, `${membersList(currentType)}`);
						nickBtn.setDisabled(false);
						idBtn.setDisabled(true);
						depositBtn.setDisabled(user.GangId !== gang.Id);
						return replyWithContainer(interaction, container);
					}

					else if (btn.customId === MemberListType.Deposit) {
						currentType = btn.customId as MemberListType;
						container.changeTextFromSectionId(10, `${membersList(currentType)}`);
						nickBtn.setDisabled(false);
						idBtn.setDisabled(false);
						depositBtn.setDisabled(true);
						return replyWithContainer(interaction, container);
					}
				});

				return;
			}
			catch (err) {
				return warn(s.errorSearchingGang);
			}
		}

		case CommandOption.RobInvestment: {
			await deferReply(interaction);

			const targetId = interaction.options.getString("user", true);

			const targetUser = await searchUser(targetId, interaction, language);
			if (!targetUser) {
				return;
			}

			if (!user.IsInGang()) {
				return warn(s.notInGang);
			}

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			if (gang.LastInvestmentRobbery) {
				const cooldownTime = addHours(gang.LastInvestmentRobbery, 6);
				if (isFuture(cooldownTime)) {
					return warn(s.robberyCooldown(cooldownTime.getTime()));
				}
			}

			const robbery = new InvestmentRobbery(gang, user, targetUser);

			const validation = await robbery.Validate();
			if (!validation.success) {
				return warn(s.reason(validation.reason!));
			}

			robbery.Participants.set(user.Id, user);

			await robbery.ApplyAttackerState(user);

			let defenderJoined = false;
			let aborted = false;

			const calculateTotalAtk = () => {
				let total = 0;
				for (const p of robbery.Participants.values()) {
					total += p.Attributes.Attack;
				}
				return Math.round(total * 0.5);
			};

			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(GangColor[gang.Color].Color)
				.addTexts([
					`${EmoteString.InvestmentActive} ${s.robInvestment}`,
				])
				.addLargeSeparator()
				.addSectionComponents(section => section
					.setId(1)
					.addTexts([
						s.robberyInitiated(robbery.InvestmentBase!.Name[user.Language], targetUser.GetNameWithImage()),
						`-# ${s.participants(robbery.Participants.size)} • ${EmoteString.Attack}${calculateTotalAtk()} ATK`,
						Array.from(robbery.Participants.values()).map(p => `- ${p.GetNameWithImage()}`).join("\n"),
					], 2)
					.setThumbnailAccessory(thumb => thumb
						.setURL(robbery.InvestmentBase!.ImageUrl),
					),
				)
				.addSectionComponents(section => section
					.addTexts([
						`-# ${s.autoStartRobbery(60)}`,
					])
					.setButtonAccessory(
						btn => btn
							.setLabel(s.participate)
							.setStyle(ButtonStyle.Primary)
							.setCustomId("participate"),
					),
				)
				.addLargeSeparator()
				.addSectionComponents(section => section
					.addTexts([
						`-# ${EmoteString.Gang} ${gang.Name}`,
					])
					.setButtonAccessory(
						btn => btn
							.setLabel(s.abortRobbery)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("abort_robbery"),
					),
				);

			const reply = await replyWithContainer(interaction, container);

			const defenderLang = targetUser.Language;
			const sDef = Strings[defenderLang];

			// ── Phase 1: 60-second participant lobby ─────────────────────────────
			await new Promise<void>(resolve => {
				const collector = reply!.createMessageComponentCollector({ time: 60_000 });

				collector.on("collect", async (btn) => {
					if (btn.customId === "participate") {
						const participantId = btn.user.id;
						if (robbery.Participants.has(participantId)) {
							return btn.reply({ content: s.alreadyIn, flags: MessageFlags.Ephemeral });
						}

						const participantUser = await checkUser(participantId, interaction);
						if (!participantUser) return;

						const validationJoin = robbery.ValidateJoin(participantUser);

						if (!validationJoin.success) {
							return btn.reply({
								content: s.reason(validationJoin.reason!),
								flags: MessageFlags.Ephemeral,
							});
						}

						await robbery.ApplyAttackerState(participantUser);

						container.changeTextFromSectionId(1, [
							s.robberyInitiated(robbery.InvestmentBase!.Name[user.Language], targetUser.GetNameWithImage()),
							`-# ${s.participants(robbery.Participants.size)} • ${EmoteString.Attack}${calculateTotalAtk()} ATK`,
							Array.from(robbery.Participants.values()).map(p => `- ${p.GetNameWithImage()}`).join("\n"),
						]);

						await replyWithContainer(btn, container);
					}

					else if (btn.customId === "abort_robbery") {
						if (btn.user.id !== user.Id) {
							return btn.reply({ content: s.onlyLeaderCanAbort, flags: MessageFlags.Ephemeral });
						}
						await deferUpdate(btn);
						aborted = true;
						collector.stop();
					}
				});

				collector.on("end", async () => {
					await disableButtons(interaction, container);
					resolve();
				});
			});

			if (aborted) {
				const abortContainer = new CustomContainerBuilder()
					.setUser(user)
					.addTexts([
						`${EmoteString.InvestmentActive} ${s.robInvestment}`,
					])
					.addLargeSeparator()
					.setAccentColor(CrColors.Robbery)
					.addTexts([
						s.robberyAborted(user.GetNameWithImage()),
					])
					.addLargeSeparator()
					.addTexts([
						`-# ${EmoteString.Gang} ${gang.Name}`,
					]);

				await robbery.Abort();
				await replyWithContainer(interaction, abortContainer);

				return;
			}

			// ── Phase 2: Send DM to target, wait 60s for defence ─────────────────
			const hasHenchman = !!(robbery.InvestmentData!.henchmanEndsAt && isFuture(new Date(robbery.InvestmentData!.henchmanEndsAt)));

			const buildAttackingContainer = (defending: boolean) => {
				const lines: string[] = [
					s.robberyAttempting(robbery.InvestmentBase!.Name[user.Language], targetUser.GetNameWithImage()),
					`-# ${s.participants(robbery.Participants.size)} • ${EmoteString.Attack}${calculateTotalAtk()} ATK`,
					Array.from(robbery.Participants.values()).map(p => `- ${p.GetNameWithImage()}`).join("\n"),
					defending ? `\n${s.targetIsDefending(targetUser.GetNameWithImage())}` : "",
				];

				if (hasHenchman) {
					lines.push(`-# ${EmoteString.Henchman} ${s.targetHasHenchman}`);
				}

				return new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang.Color].Color)
					.addTexts([
						`${EmoteString.InvestmentActive} ${s.robInvestment} ${s.inProgress}`,
					])
					.addLargeSeparator()
					.addSectionComponents(section => section
						.addTexts(lines)
						.setThumbnailAccessory(thumb => thumb
							.setURL(robbery.InvestmentBase!.ImageUrl),
						),
					)
					.addLargeSeparator()
					.addTexts([
						`-# ${EmoteString.Gang}${gang.Name}`,
					]);
			};

			await replyWithContainer(interaction, buildAttackingContainer(false));

			const dmContainer = new CustomContainerBuilder()
				.setUser(targetUser)
				.setAccentColor(CrColors.Robbery)
				.addTexts([
					`${EmoteString.InvestmentActive} ${sDef.defendDMTitle}`,
				])
				.addLargeSeparator()
				.addTexts([
					sDef.defendDMDescription(gang.Name, robbery.InvestmentBase!.Name[defenderLang]),
				]);

			if (hasHenchman) {
				dmContainer.addTexts([`-# ${EmoteString.Henchman} ${sDef.targetHasHenchman}`]);
			}

			dmContainer
				.addButtonRow(btn => btn
					.setLabel(sDef.defend)
					.setEmoji(EmoteId.Defense)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("defend"),
				)
				.addFooter({
					text: `${sDef.nextYield}: ${formatMoney(robbery.InvestmentData!.accumulatedYield, defenderLang)}`,
				});

			const defenderMessage = await sendComplexPrivateMessage(targetUser.Id, {
				components: [dmContainer],
				flags: MessageFlags.IsComponentsV2,
			});

			await new Promise<void>(resolve => {
				const defendingCollector = defenderMessage?.createMessageComponentCollector({ time: 60_000, max: 1 });

				defendingCollector?.on("collect", async btn => {
					if (btn.customId === "defend") {
						if (!targetUser.IsIdling()) {
							return btn.reply({ content: `**${sDef.youMustBeIdling}**`, flags: MessageFlags.Ephemeral });
						}

						await deferUpdate(btn);

						defenderJoined = true;
						await robbery.ApplyDefenderState();

						// Update the public gang container to show the target is defending
						await replyWithContainer(interaction, buildAttackingContainer(true));

						const updatedDm = new CustomContainerBuilder()
							.setUser(targetUser)
							.setAccentColor(Colors.Green)
							.addTexts([
								`${EmoteString.InvestmentActive} ${sDef.defendDMTitle}`,
							])
							.addLargeSeparator()
							.addTexts([sDef.defendingSuccess])
							.addFooter({
								text: `${sDef.nextYield}: ${formatMoney(robbery.InvestmentData!.accumulatedYield, defenderLang)}`,
							});

						await btn.editReply({ components: [updatedDm] });
					}
				});

				defendingCollector?.on("end", () => resolve());

				// If DM failed (DMs closed), don't hang forever
				if (!defenderMessage) resolve();
			});

			const result = await robbery.CalculateAndApplyOutcome(defenderJoined);
			await gang.UpdateLastInvestmentRobbery();

			const resultContainer = new CustomContainerBuilder()
				.setUser(user)
				.addTexts([
					`${EmoteString.InvestmentActive} ${s.robInvestment} ${s.finished}`,
				])
				.addLargeSeparator();

			if (result.win) {
				resultContainer
					.setAccentColor(Colors.Green)
					.addSectionComponents(section => section
						.addTexts([
							`### ${EmoteString.Victory} ${s.successWin}!`,
							`**${s.stolen}**: ${formatMoney(result.robbedAmount, user.Language)}`,
							`-# ${EmoteString.Experience} +${result.expGain} EXP`,
						])
						.setThumbnailAccessory(thumb => thumb
							.setURL(robbery.InvestmentBase!.ImageUrl),
						),
					);

				if (result.henchmanHospitalized) {
					resultContainer
						.addLargeSeparator()
						.addTexts([`${EmoteString.Hospital} ${s.henchmanHospitalized}`]);
				}

				if (result.defenderHospitalized && result.defenderHospitalTime) {
					resultContainer
						.addLargeSeparator()
						.addTexts([`${EmoteString.Hospital} ${s.defenderHospitalized(targetUser.GetNameWithImage(), result.defenderHospitalTime)}`]);
				}
			}
			else {
				const mainTexts = [
					`${EmoteString.Police} ${s.attackersImprisoned(result.prisonHours)}`,
				];
				if (result.attackersHospitalized) {
					mainTexts.push(`-# ${EmoteString.Hospital} ${s.attackersHospitalized}`);
				}

				resultContainer
					.addTexts([
						`### ${EmoteString.Defeat} ${s.failureLose}`,
					])
					.setAccentColor(CrColors.Police)
					.addSectionComponents(section => section
						.addTexts(mainTexts)
						.setThumbnailAccessory(thumb => thumb
							.setURL(robbery.InvestmentBase!.ImageUrl),
						),
					);
			}

			resultContainer
				.addLargeSeparator()
				.addTexts([
					`-# ${EmoteString.Gang} ${gang.Name} • ${formatMoney(gang.Money, user.Language)}`,
				]);

			await replyWithContainer(interaction, resultContainer);

			// Send outcome DM to target
			const resultDm = new CustomContainerBuilder()
				.setUser(targetUser)
				.addTexts([
					`-# ${EmoteString.Gang} ${sDef.defendDMTitle}`,
				])
				.addLargeSeparator();

			if (result.win) {
				resultDm
					.setAccentColor(Colors.Red)
					.addTexts([
						`### ${EmoteString.Defeat} ${sDef.robberyResultLost}`,
						`**${sDef.stolen}**: ${formatMoney(result.robbedAmount, defenderLang)}`,
						`**${sDef.nextYield}**: ${formatMoney(result.remainingYield, defenderLang)}`,
					]);

				if (result.henchmanHospitalized) {
					resultDm.addTexts([`${EmoteString.Hospital} ${sDef.henchmanHospitalized}`]);
				}

				if (result.defenderHospitalized && result.defenderHospitalTime) {
					resultDm.addTexts([`${EmoteString.Hospital} ${sDef.youWereHospitalized(result.defenderHospitalTime)}`]);
				}
			}
			else {
				const dmTexts = [
					`### ${EmoteString.Victory} ${sDef.robberyResultWon}`,
					`${EmoteString.Police} ${sDef.attackersImprisoned(result.prisonHours)}`,
				];
				if (result.attackersHospitalized) {
					dmTexts.push(`-# ${EmoteString.Hospital} ${sDef.attackersHospitalized}`);
				}

				resultDm
					.setAccentColor(Colors.Green)
					.addTexts(dmTexts);

				if (result.henchmanHospitalized === false && hasHenchman) {
					resultDm
						.addLargeSeparator()
						.addTexts([`-# ${EmoteString.Henchman} ${sDef.henchmanStillActive}`]);
				}
			}

			resultDm.addFooter({
				text: `${sDef.nextYield}: ${formatMoney(result.remainingYield, defenderLang)}`,
			});

			await sendComplexPrivateMessage(targetUser.Id, {
				components: [resultDm],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
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

			if (user.Id === gang.LeaderId) {
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

			const collector = createButtonCollector(interaction, response, { maxClicks: 1 });

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

			if (target.Id === gang.LeaderId) {
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

			const collector = createButtonCollector(interaction, response, { maxClicks: 1 });

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
				await deferUpdate(btn);

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
						.addButtonRow(
							btn => btn
								.setLabel(s.back)
								.setCustomId("back")
								.setStyle(ButtonStyle.Secondary),
							btn => btn
								.setStyle(ButtonStyle.Success)
								.setLabel(s.confirm)
								.setDisabled(gang!.Money < BASE_COST)
								.setCustomId(`confirm${base.Id}`),
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
				footer: formatMoney(user.Money, language),
			});

			return replyWithContainer(interaction, container);
		}

		case CommandOption.CreateRole: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			if (user.Id !== gang.LeaderId) {
				return warn(s.errorCreateRoleLeader);
			}

			const roleName = interaction.options.getString("name", true);

			const permissions: GangPermission[] = [];

			const getContainer = () => {
				return new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang.Color].Color)
					.addTexts([
						`-# ${EmoteString.Gang} ${gang.Name}`,
					])
					.addLargeSeparator()
					.addTexts([
						`# ${s.createRoleTitle}`,
						s.createRoleDescription(roleName),
					])
					.addLargeSeparator()
					.addTexts([
						`### ${s.permissions}`,
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.permissionInvite)
							.setCustomId("invite")
							.setStyle(permissions.includes(GangPermission.Invite) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionKick)
							.setCustomId("kick")
							.setStyle(permissions.includes(GangPermission.Kick) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionPromote)
							.setCustomId("promote")
							.setStyle(permissions.includes(GangPermission.Promote) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionEditGang)
							.setCustomId("edit")
							.setStyle(permissions.includes(GangPermission.EditGang) ? ButtonStyle.Primary : ButtonStyle.Secondary),
					)
					.addButtonRow(
						btn => btn
							.setLabel(s.confirm)
							.setCustomId("confirm")
							.setStyle(ButtonStyle.Success),
					)
					.addFooter();
			};

			let container = getContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "confirm") {
					const success = await gang.CreateRole(user.Id, roleName, permissions);

					if (!success) {
						return warn(s.errorCreateRole);
					}

					container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successCreateRole(roleName),
						user,
					});

					return replyWithContainer(interaction, container);
				}

				const permissionMap: Record<string, GangPermission> = {
					invite: GangPermission.Invite,
					kick: GangPermission.Kick,
					promote: GangPermission.Promote,
					edit: GangPermission.EditGang,
				};

				const permission = permissionMap[btn.customId];

				if (permission !== undefined) {
					if (permissions.includes(permission)) {
						const index = permissions.indexOf(permission);
						permissions.splice(index, 1);
					}
					else {
						permissions.push(permission);
					}

					container = getContainer();
					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.ChangeRole: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const targetUserInput = interaction.options.getString("user", true);
			const target = await searchUser(targetUserInput, interaction);

			if (!target) {
				return;
			}

			if (target.Id === gang.LeaderId) {
				return warn(s.errorChangeRoleLeader);
			}

			const member = gang.Members.find(m => m.UserId === target.Id);
			if (!member) {
				return warn(s.userNotInGang(target.Nickname));
			}

			const roles = gang.Roles.sort((a, b) => a.Id - b.Id);
			const currentRole = roles.find(r => r.Id === member.RoleId);

			const getContainer = () => {
				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang.Color].Color)
					.addTexts([
						`-# ${EmoteString.Gang} ${gang.Name}`,
					])
					.addLargeSeparator()
					.addTexts([
						`# ${s.changeRoleTitle}`,
						s.changeRoleDescription(target.Nickname, currentRole?.Name || "???"),
					])
					.addLargeSeparator();

				const rows: ButtonBuilder[][] = [];
				let currentRow: ButtonBuilder[] = [];

				for (const role of roles) {
					const btn = new ButtonBuilder()
						.setLabel(role.Name)
						.setCustomId(`role_${role.Id}`)
						.setStyle(role.Id === member.RoleId ? ButtonStyle.Success : ButtonStyle.Secondary)
						.setDisabled(role.Id === member.RoleId);

					currentRow.push(btn);

					if (currentRow.length === 5) {
						rows.push(currentRow);
						currentRow = [];
					}
				}

				if (currentRow.length > 0) {
					rows.push(currentRow);
				}

				for (const row of rows) {
					container.addButtonRow(...row.map(btn => () => btn));
				}

				container.addFooter();

				return container;
			};

			let container = getContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response, { maxClicks: 1 });

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId.startsWith("role_")) {
					const roleId = parseInt(btn.customId.split("_")[1]);
					const success = await gang.ChangeRole(user.Id, target.Id, roleId);

					if (!success) {
						return warn(s.errorChangeRole);
					}

					const newRole = roles.find(r => r.Id === roleId);

					container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successChangeRole(target.Nickname, newRole?.Name || "???"),
						user,
					});

					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.EditRole: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			if (user.Id !== gang.LeaderId) {
				return warn(s.errorEditRoleLeader);
			}

			const roleName = interaction.options.getString("role", true);
			const newRoleName = interaction.options.getString("new_name");

			const role = gang.Roles.find(r => r.Name.toLowerCase() === roleName.toLowerCase());

			if (!role) {
				return warn(s.roleNotFound(roleName));
			}

			const permissions: GangPermission[] = [...role.Permissions];
			const targetName = newRoleName || role.Name;

			const getContainer = () => {
				return new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang.Color].Color)
					.addTexts([
						`# ${s.editRoleTitle}`,
						s.editRoleDescription(role.Name, targetName),
					])
					.addLargeSeparator()
					.addTexts([
						`### ${s.permissions}`,
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.permissionInvite)
							.setCustomId("invite")
							.setStyle(permissions.includes(GangPermission.Invite) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionKick)
							.setCustomId("kick")
							.setStyle(permissions.includes(GangPermission.Kick) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionPromote)
							.setCustomId("promote")
							.setStyle(permissions.includes(GangPermission.Promote) ? ButtonStyle.Primary : ButtonStyle.Secondary),
						btn => btn
							.setLabel(s.permissionEditGang)
							.setCustomId("edit")
							.setStyle(permissions.includes(GangPermission.EditGang) ? ButtonStyle.Primary : ButtonStyle.Secondary),
					)
					.addButtonRow(
						btn => btn
							.setLabel(s.confirm)
							.setCustomId("confirm")
							.setStyle(ButtonStyle.Success),
					)
					.addFooter();
			};

			let container = getContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response);

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "confirm") {
					const success = await gang.EditRole(user.Id, role.Id, permissions, newRoleName);

					if (!success) {
						return warn(s.errorEditRole);
					}

					container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successEditRole(targetName),
						user,
					});

					return replyWithContainer(interaction, container);
				}

				const permissionMap: Record<string, GangPermission> = {
					invite: GangPermission.Invite,
					kick: GangPermission.Kick,
					promote: GangPermission.Promote,
					edit: GangPermission.EditGang,
				};

				const permission = permissionMap[btn.customId];

				if (permission !== undefined) {
					if (permissions.includes(permission)) {
						const index = permissions.indexOf(permission);
						permissions.splice(index, 1);
					}
					else {
						permissions.push(permission);
					}
					container = getContainer();
					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.Transfer: {
			await deferReply(interaction);

			const gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			if (user.Id !== gang.LeaderId) {
				return warn(s.errorMustBeLeader);
			}

			const targetUserInput = interaction.options.getString("user", true);
			const target = await searchUser(targetUserInput, interaction);

			if (!target) {
				return;
			}

			if (target.Id === user.Id) {
				return warn(s.errorCantTransferToSelf);
			}

			const targetMember = gang.Members.find(m => m.UserId === target.Id);
			if (!targetMember) {
				return warn(s.userNotInGang(target.Nickname));
			}

			const getContainer = () => {
				return new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang.Color].Color)
					.addTexts([
						`-# ${EmoteString.Gang} ${gang.Name}`,
					])
					.addLargeSeparator()
					.addTexts([
						`# ${s.transferTitle}`,
						s.transferDescription(target.GetNameWithImage()),
					])
					.addButtonRow(
						btn => btn
							.setLabel(s.confirm)
							.setCustomId("confirm")
							.setStyle(ButtonStyle.Success),
					)
					.addFooter();
			};

			let container = getContainer();

			const response = await replyWithContainer(interaction, container);

			const collector = createButtonCollector(interaction, response, { idleTime: 60_000, maxClicks: 1 });

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				if (btn.customId === "confirm") {
					const success = await gang.TransferLeadership(user, target);

					if (!success) {
						return warn(s.errorTransferLeadership);
					}

					container = defaultComponent({
						color: GangColor[gang.Color].Color as ColorResolvable,
						description: s.successTransferLeadership(target.GetNameWithImage()),
						user,
					});

					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
		}

		case CommandOption.Roles: {
			await deferReply(interaction);

			let gang = await Gang.GetByUserId(user.Id);
			if (!gang) {
				return warn(s.notInGang);
			}

			const isLeader = user.Id === gang.LeaderId;

			const getContainer = () => {
				const container = new CustomContainerBuilder()
					.setUser(user)
					.setAccentColor(GangColor[gang!.Color].Color)
					.addTexts([
						`# ${s.rolesTitle(gang!.Name)}`,
					])
					.addLargeSeparator();

				const roles = gang!.Roles.sort((a, b) => b.Permissions.length - a.Permissions.length);

				for (const role of roles) {
					const permissions = role.Permissions.map(p => {
						const key = `permission${GangPermission[p]}` as keyof typeof s;
						return s[key];
					}).join(", ") || s.noPermissions;
					const memberCount = gang!.Members.filter(m => m.RoleId === role.Id).length;

					const canDelete = isLeader &&
						!Gang.RESERVED_ROLE_NAMES.map(n => n.toLowerCase()).includes(role.Name.toLowerCase()) &&
						gang!.Members.find(m => m.UserId === gang!.LeaderId)?.RoleId !== role.Id;

					container.addSectionComponents(section => section
						.addTexts([
							`### ${role.Name}`,
							`-# ${s.permissions}: ${permissions}`,
							`-# ${s.membersWithRole}: ${memberCount}`,
						])
						.setButtonAccessory(btn => btn
							.setLabel(s.delete)
							.setCustomId(`delete_role_${role.Id}`)
							.setStyle(ButtonStyle.Danger)
							.setDisabled(!canDelete),
						),
					);
				}
				container.addFooter();
				return container;
			};

			let container = getContainer();

			const response = await replyWithContainer(interaction, container);
			if (!isLeader) return;

			const collector = createButtonCollector(interaction, response);

			collector?.on("collect", async btn => {
				await deferUpdate(btn);

				const freshGang = await Gang.GetByUserId(user.Id);
				if (!freshGang) return warn(s.notInGang);
				gang = freshGang;

				if (btn.customId.startsWith("delete_role_")) {
					const roleId = parseInt(btn.customId.split("_")[2]);
					const role = gang.Roles.find(r => r.Id === roleId);
					if (!role) return;

					container = new CustomContainerBuilder()
						.setUser(user)
						.setAccentColor(Colors.Red)
						.addTexts([s.confirmDeleteRole(role.Name)])
						.addButtonRow(
							b => b
								.setCustomId(`confirm_delete_${roleId}`)
								.setLabel(s.confirm)
								.setStyle(ButtonStyle.Danger),
							b => b
								.setCustomId("cancel_delete")
								.setLabel(s.cancel)
								.setStyle(ButtonStyle.Secondary),
						)
						.addFooter();
					return replyWithContainer(interaction, container);
				}

				if (btn.customId.startsWith("confirm_delete_")) {
					const roleId = parseInt(btn.customId.split("_")[2]);
					const success = await gang.DeleteRole(user.Id, roleId);
					if (!success) {
						return warn(s.errorDeleteRole);
					}

					const updatedGang = await Gang.GetByUserId(user.Id);
					if (!updatedGang) return warn(s.notInGang);
					gang = updatedGang;
					container = getContainer();
					return replyWithContainer(interaction, container);
				}

				if (btn.customId === "cancel_delete") {
					container = getContainer();
					return replyWithContainer(interaction, container);
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});

			return;
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
		gangDescription: `Create your gang and work as a team! Participate in group robberies and ~~gang fights~~!\n\n**Cost to create a gang: ${formatMoney(Gang.CREATION_COST, Language.English)}**`,
		gangNotFoundByName: (name: string) => `No gang found with name or acronym **${name}** ${EmoteString.Gang}`,
		notInGang: `You are not in a gang! To see a specific gang, use the \`gang info\` command ${EmoteString.Gang}`,
		errorGettingGang: `Error retrieving gang information ${EmoteString.Gang}`,
		errorSearchingGang: `Error while searching for gang ${EmoteString.Gang}`,
		name: `Name`,
		acronym: `Acronym`,
		level: `Level`,
		totalInBalance: "Total in balance",
		members: `Members`,
		created: `Created`,
		description: `Description`,
		color: `Color`,
		image: `Image`,
		gangId: (id: number) => `Gang Id: ${id}`,
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
		deposits: "Deposits",
		canDeposit: "Can deposit",
		canDepositAgain: "Can deposit again",
		createRoleTitle: "Create Role",
		createRoleDescription: (name: string) => `Creating role **${name}**. Select the permissions below:`,
		permissions: "Permissions",
		permissionInvite: "Invite Members",
		permissionKick: "Kick Members",
		permissionPromote: "Promote Members",
		permissionEditGang: "Edit Gang",
		errorCreateRoleLeader: `Only the leader can create roles ${EmoteString.Gang}`,
		errorCreateRole: `Error creating role. Please try again later ${EmoteString.Gang}`,
		successCreateRole: (name: string) => `Role **${name}** created successfully! ${EmoteString.Gang}`,
		changeRoleTitle: "Change Role",
		changeRoleDescription: (user: string, currentRole: string) => `Changing role for **${user}**.\nCurrent role: **${currentRole}**`,
		userNotInGang: (user: string) => `**${user}** is not in your gang ${EmoteString.Gang}`,
		errorChangeRole: `Error changing role. Please try again later ${EmoteString.Gang}`,
		successChangeRole: (user: string, role: string) => `Role for **${user}** changed to **${role}** successfully! ${EmoteString.Gang}`,
		errorChangeRoleLeader: `You cannot change the role of the leader ${EmoteString.Gang}`,
		editRoleTitle: "Edit Role",
		editRoleDescription: (oldName: string, newName: string) => `Editing role **${oldName}**${oldName !== newName ? ` to **${newName}**` : ""}. Select the permissions below:`,
		errorEditRoleLeader: `Only the leader can edit roles ${EmoteString.Gang}`,
		roleNotFound: (name: string) => `Role **${name}** not found in your gang ${EmoteString.Gang}`,
		errorEditRole: `Error editing role. Please try again later ${EmoteString.Gang}`,
		successEditRole: (name: string) => `Role **${name}** edited successfully! ${EmoteString.Gang}`,
		rolesTitle: (name: string) => `Roles of ${name}`,
		membersWithRole: "Members",
		delete: "Delete",
		noPermissions: "No permissions",
		confirmDeleteRole: (name: string) => `Are you sure you want to delete the role **${name}**?\n-# Members with this role will be reassigned to the default **Member** role.`,
		errorDeleteRole: `Error deleting role. It might be a protected role (like Leader or Member) or another error occurred.`,
		cancel: "Cancel",
		transferTitle: "Transfer Leadership",
		transferDescription: (target: string) => `Are you sure you want to transfer the leadership of the gang to **${target}**?\n-# This action cannot be undone. You'll become a regular Member.`,
		errorMustBeLeader: `Only the leader can transfer the leadership of the gang ${EmoteString.Gang}`,
		errorCantTransferToSelf: `You can't transfer the leadership to yourself ${EmoteString.Gang}`,
		errorTransferLeadership: `Error transferring the leadership. Please try again later ${EmoteString.Gang}`,
		successTransferLeadership: (target: string) => `You've successfully transferred the leadership of the gang to **${target}**! ${EmoteString.Gang}`,
		robInvestment: "Robbery to investment",
		inProgress: "in progress",
		finished: "finished",
		robberyInitiated: (invName: string, targetName: string) => `Organizing robbery against ${EmoteString.InvestmentActive} **${invName}** from **${targetName}**`,
		robberyAttempting: (invName: string, targetName: string) => `Attempting to rob ${EmoteString.InvestmentActive} **${invName}** from **${targetName}** ${EmoteString.Waiting}`,
		participants: (count: number) => `Participants: ${count}`,
		participate: "Join",
		abortRobbery: "Abort robbery",
		autoStartRobbery: (seconds: number) => `Starts automatically in ${seconds} seconds.`,
		alreadyIn: "You are already participating.",
		reason: (type: InvestmentRobberyReason) => {
			const reasons = {
				[InvestmentRobberyReason.NoPermission]: "You don't have permission to start a robbery.",
				[InvestmentRobberyReason.CantRobYourself]: "You can't rob your own investment.",
				[InvestmentRobberyReason.LeaderNotIdling]: "You need to be idling to start a robbery.",
				[InvestmentRobberyReason.TargetSameGang]: "The target is in your gang.",
				[InvestmentRobberyReason.WithoutItem]: "You can't rob without a weapon!",
				[InvestmentRobberyReason.TargetWithoutNick]: "The target doesn't have a nickname.",
				[InvestmentRobberyReason.TargetWithoutClass]: "The target doesn't have a class.",
				[InvestmentRobberyReason.TargetAlreadyUnderAttack]: "The target is already being attacked.",
				[InvestmentRobberyReason.TargetNoInvestment]: "The target doesn't have an investment.",
				[InvestmentRobberyReason.TargetNoYield]: "The target's investment has no profit.",
				[InvestmentRobberyReason.NotInGang]: "You are not in this gang.",
				[InvestmentRobberyReason.ParticipateNotIdling]: "You must be idling to participate.",
				[InvestmentRobberyReason.LeaderIsWanted]: "You are wanted by the police and cannot start a robbery.",
				[InvestmentRobberyReason.ParticipateIsWanted]: "You are wanted by the police and cannot participate.",
			};
			return reasons[type] || "Unknown error while starting the robbery.";
		},
		onlyLeaderCanAbort: "Only the user who started the robbery can abort it.",
		robberyAborted: (user: string) => `The robbery has been aborted by **${user}**.`,
		defendDMTitle: "Investment Attack!",
		defendDMDescription: (gangName: string, invName: string) => `The gang **${gangName}** is attacking your investment **${invName}**! You can defend, gaining ${EmoteString.Defense}+5 DEF, but if you lose, you'll be hospitalized for 30 minutes.`,
		defend: "Defend",
		youMustBeIdling: "You must be idling to join the defense.",
		defendingSuccess: "You are now defending your investment! Await results.",
		chance: "Success chance",
		successWin: "Success",
		stolen: "Stolen for gang bank",
		expGained: "Gang EXP gained",
		henchmanHospitalized: "The henchman was hospitalized.",
		defenderHospitalized: (name: string, date: Date) => `**${name}** was hospitalized! Will be cured ${showTime(date.getTime(), true)}`,
		youWereHospitalized: (date: Date) => `You were hospitalized! Will be cured ${showTime(date.getTime(), true)}`,
		failureLose: "Failure",
		attackersImprisoned: (hours: number) => `All attackers were sent to prison!\n-# They will be free ${showTime(addHours(Date.now(), hours).getTime(), true)}`,
		attackersHospitalized: "Also hospitalized for 30 minutes.",
		waitingForTarget: `Robbery in progress ${EmoteString.Waiting}`,
		targetIsDefending: (name: string) => `**${name}** is defending! ${EmoteString.Defense}`,
		targetHasHenchman: `Target has an active henchman`,
		nextYield: "Next profit",
		robberyResultLost: "Your investment was successfully robbed!",
		robberyResultWon: "You successfully defended your investment!",
		henchmanStillActive: "Your henchman protected you and remains active!",
		robberyCooldown: (time: number) => `${EmoteString.Police} The police is searching for your gang. You can rob again ${showTime(time, true)}`,
	},
	[Language.Portuguese]: {
		gangTitle: `Gangues`,
		gangDescription: `Crie sua gangue e trabalhe em equipe! Participe de assaltos em grupo e ~~lutas generalizadas~~!\n\n**Custo para criar uma gangue: ${formatMoney(Gang.CREATION_COST, Language.Portuguese)}**`,
		gangNotFoundByName: (name: string) => `Nenhuma gangue encontrada com o nome ou acrônimo **${name}** ${EmoteString.Gang}`,
		notInGang: `Você não está em uma gangue! Para ver uma gangue específica, use o comando \`gangue info\` ${EmoteString.Gang}`,
		errorGettingGang: `Erro ao buscar informações da gangue ${EmoteString.Gang}`,
		errorSearchingGang: `Erro ao procurar pela gangue ${EmoteString.Gang}`,
		name: `Nome`,
		acronym: `Acrônimo`,
		level: `Nível`,
		totalInBalance: "Total em caixa",
		members: `Membros`,
		created: `Criada em`,
		description: `Descrição`,
		color: `Cor`,
		image: `Imagem`,
		gangId: (id: number) => `Id da Gangue: ${id}`,
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
		deposits: "Depósitos",
		canDeposit: "Pode depositar",
		canDepositAgain: "Pode depositar novamente",
		createRoleTitle: "Criar Cargo",
		createRoleDescription: (name: string) => `Criando cargo **${name}**. Selecione as permissões abaixo:`,
		permissions: "Permissões",
		permissionInvite: "Convidar Membros",
		permissionKick: "Expulsar Membros",
		permissionPromote: "Promover Membros",
		permissionEditGang: "Editar Gangue",
		errorCreateRoleLeader: `Apenas o líder pode criar cargos ${EmoteString.Gang}`,
		errorCreateRole: `Erro ao criar cargo. Tente novamente mais tarde ${EmoteString.Gang}`,
		successCreateRole: (name: string) => `Cargo **${name}** criado com sucesso! ${EmoteString.Gang}`,
		changeRoleTitle: "Mudar Cargo",
		changeRoleDescription: (user: string, currentRole: string) => `Mudando cargo de **${user}**.\nCargo atual: **${currentRole}**`,
		userNotInGang: (user: string) => `**${user}** não está na sua gangue ${EmoteString.Gang}`,
		errorChangeRole: `Erro ao mudar cargo. Tente novamente mais tarde ${EmoteString.Gang}`,
		successChangeRole: (user: string, role: string) => `Cargo de **${user}** alterado para **${role}** com sucesso! ${EmoteString.Gang}`,
		errorChangeRoleLeader: `Você não pode mudar o cargo do líder ${EmoteString.Gang}`,
		editRoleTitle: "Editar Cargo",
		editRoleDescription: (oldName: string, newName: string) => `Editando cargo **${oldName}**${oldName !== newName ? ` para **${newName}**` : ""}. Selecione as permissões abaixo:`,
		errorEditRoleLeader: `Apenas o líder pode editar cargos ${EmoteString.Gang}`,
		roleNotFound: (name: string) => `Cargo **${name}** não encontrado na sua gangue ${EmoteString.Gang}`,
		errorEditRole: `Erro ao editar cargo. Tente novamente mais tarde ${EmoteString.Gang}`,
		successEditRole: (name: string) => `Cargo **${name}** editado com sucesso! ${EmoteString.Gang}`,
		rolesTitle: (name: string) => `Cargos de ${name}`,
		membersWithRole: "Membros",
		delete: "Deletar",
		noPermissions: "Nenhuma permissão",
		confirmDeleteRole: (name: string) => `Você tem certeza que quer deletar o cargo **${name}**?\n-# Membros com este cargo serão movidos para o cargo padrão de **Membro**.`,
		errorDeleteRole: `Erro ao deletar cargo. Pode ser um cargo protegido (como Líder ou Membro) ou outro erro ocorreu.`,
		cancel: "Cancelar",
		transferTitle: "Transferir Liderança",
		transferDescription: (target: string) => `Você tem certeza que deseja transferir a liderança da gangue para **${target}**?\n-# Esta ação não pode ser desfeita. Você se tornará um Membro regular.`,
		errorMustBeLeader: `Apenas o líder pode transferir a liderança da gangue ${EmoteString.Gang}`,
		errorCantTransferToSelf: `Você não pode transferir a liderança para si mesmo ${EmoteString.Gang}`,
		errorTransferLeadership: `Erro ao transferir a liderança. Tente novamente mais tarde ${EmoteString.Gang}`,
		successTransferLeadership: (target: string) => `Você transferiu a liderança da gangue para **${target}** com sucesso! ${EmoteString.Gang}`,
		robInvestment: "Roubo à investimento",
		inProgress: "em andamento",
		finished: "finalizado",
		robberyInitiated: (invName: string, targetName: string) => `Organizando roubo contra ${EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${EmoteString.Waiting}`,
		robberyAttempting: (invName: string, targetName: string) => `Tentando roubar ${EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${EmoteString.Waiting}`,
		participants: (count: number) => `Participantes: ${count}`,
		participate: "Participar",
		abortRobbery: "Abortar roubo",
		autoStartRobbery: (seconds: number) => `Inicia automaticamente em ${seconds} segundos.`,
		alreadyIn: "Você já está participando.",
		reason: (type: InvestmentRobberyReason) => {
			const reasons = {
				[InvestmentRobberyReason.NoPermission]: "Você não tem permissão para iniciar um roubo.",
				[InvestmentRobberyReason.CantRobYourself]: "Você não pode roubar seu próprio investimento.",
				[InvestmentRobberyReason.LeaderNotIdling]: "Você precisa estar vadiando para iniciar um roubo.",
				[InvestmentRobberyReason.TargetSameGang]: "O alvo está na sua gangue.",
				[InvestmentRobberyReason.WithoutItem]: "Você não pode roubar sem uma arma.",
				[InvestmentRobberyReason.TargetWithoutNick]: "O alvo não tem um nickname.",
				[InvestmentRobberyReason.TargetWithoutClass]: "O alvo não tem uma classe.",
				[InvestmentRobberyReason.TargetAlreadyUnderAttack]: "O alvo já está sendo atacado.",
				[InvestmentRobberyReason.TargetNoInvestment]: "O alvo não tem um investimento.",
				[InvestmentRobberyReason.TargetNoYield]: "O investimento do alvo não tem lucros.",
				[InvestmentRobberyReason.NotInGang]: "Você não está nesta gangue.",
				[InvestmentRobberyReason.ParticipateNotIdling]: "Você precisa estar vadiando para participar.",
				[InvestmentRobberyReason.LeaderIsWanted]: "Você está sendo procurado pela polícia e não pode iniciar um assalto.",
				[InvestmentRobberyReason.ParticipateIsWanted]: "Você está sendo procurado pela polícia e não pode participar.",
			};
			return reasons[type] || "Erro desconhecido ao iniciar o roubo.";
		},
		onlyLeaderCanAbort: "Apenas quem iniciou o roubo pode abortá-lo.",
		robberyAborted: (user: string) => `O roubo foi abortado por **${user}**`,
		defendDMTitle: "Ataque ao Investimento!",
		defendDMDescription: (gangName: string, invName: string) => `A gangue **${gangName}** está atacando o seu investimento **${invName}**! Você pode defender, ganhando ${EmoteString.Defense}+5 DEF, mas se perder, será hospitalizado por 30 minutos.`,
		defend: "Defender",
		youMustBeIdling: "Você precisa estar Vadiando para defender.",
		defendingSuccess: "Você está ajudando na defesa! Aguarde os resultados.",
		chance: "Chance de sucesso",
		successWin: "Sucesso",
		stolen: "Roubado para o caixa da gangue",
		expGained: "EXP ganho pela gangue",
		henchmanHospitalized: "O capanga foi hospitalizado.",
		defenderHospitalized: (name: string, date: Date) => `**${name}** foi hospitalizado! Será curado ${showTime(date.getTime(), true)}`,
		youWereHospitalized: (date: Date) => `Você foi hospitalizado! Será curado ${showTime(date.getTime(), true)}`,
		failureLose: "Fracasso",
		attackersImprisoned: (hours: number) => `Todos os atacantes foram presos!\n-# Eles serão liberados ${showTime(addHours(Date.now(), hours).getTime(), true)}`,
		attackersHospitalized: "Também foram hospitalizados por 30 minutos.",
		targetIsDefending: (name: string) => `**${name}** está defendendo! ${EmoteString.Defense}`,
		targetHasHenchman: `O alvo tem um capanga ativo!`,
		nextYield: "Próximo lucro",
		robberyResultLost: "Seu investimento foi roubado com sucesso!",
		robberyResultWon: "Você defendeu seu investimento com sucesso!",
		henchmanStillActive: "Seu capanga protegeu você e continua ativo!",
		robberyCooldown: (time: number) => `${EmoteString.Police} A polícia está procurando por sua gangue. Você poderá roubar novamente ${showTime(time, true)}`,
	},
	[Language.Spanish]: {
		gangTitle: `Cuadrillas`,
		gangDescription: `¡Crea tu cuadrilla y trabaja en equipo! ¡Participa en atracos grupales y ~~peleas de cuadrillas~~!\n\n**Costo para crear una cuadrilla: ${formatMoney(Gang.CREATION_COST, Language.Spanish)}**`,
		gangNotFoundByName: (name: string) => `¡No se encontró ninguna cuadrilla con el nombre o acrónimo **${name}** ${EmoteString.Gang}`,
		notInGang: `¡No estás en una cuadrilla! Para ver una cuadrilla específica, usa el comando \`cuadrilla info\` ${EmoteString.Gang}`,
		errorGettingGang: `Error al obtener información de la cuadrilla ${EmoteString.Gang}`,
		errorSearchingGang: `Error al buscar la cuadrilla ${EmoteString.Gang}`,
		name: `Nombre`,
		acronym: `Acrónimo`,
		level: `Nivel`,
		totalInBalance: "Total en el balance",
		members: `Miembros`,
		created: `Creada`,
		description: `Descripción`,
		color: `Color`,
		image: `Imagen`,
		gangId: (id: number) => `Id de Cuadrilla: ${id}`,
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
		deposits: "Depósitos",
		canDeposit: "Puede depositar",
		canDepositAgain: "Puede depositar nuevamente",
		createRoleTitle: "Crear Cargo",
		createRoleDescription: (name: string) => `Creando cargo **${name}**. Selecciona los permisos abajo:`,
		permissions: "Permisos",
		permissionInvite: "Invitar Miembros",
		permissionKick: "Expulsar Miembros",
		permissionPromote: "Promover Miembros",
		permissionEditGang: "Editar Cuadrilla",
		errorCreateRoleLeader: `Solo el líder puede crear cargos ${EmoteString.Gang}`,
		errorCreateRole: `Error al crear cargo. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successCreateRole: (name: string) => `¡Cargo **${name}** creado con éxito! ${EmoteString.Gang}`,
		changeRoleTitle: "Cambiar Cargo",
		changeRoleDescription: (user: string, currentRole: string) => `Cambiando cargo de **${user}**.\nCargo actual: **${currentRole}**`,
		userNotInGang: (user: string) => `**${user}** no está en tu cuadrilla ${EmoteString.Gang}`,
		errorChangeRole: `Error al cambiar cargo. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successChangeRole: (user: string, role: string) => `¡Cargo de **${user}** cambiado a **${role}** con éxito! ${EmoteString.Gang}`,
		errorChangeRoleLeader: `No puedes cambiar el cargo del líder ${EmoteString.Gang}`,
		editRoleTitle: "Editar Cargo",
		editRoleDescription: (oldName: string, newName: string) => `Editando cargo **${oldName}**${oldName !== newName ? ` a **${newName}**` : ""}. Selecciona los permisos abajo:`,
		errorEditRoleLeader: `Solo el líder puede editar cargos ${EmoteString.Gang}`,
		roleNotFound: (name: string) => `Cargo **${name}** no encontrado en tu cuadrilla ${EmoteString.Gang}`,
		errorEditRole: `Error al editar cargo. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successEditRole: (name: string) => `¡Cargo **${name}** editado con éxito! ${EmoteString.Gang}`,
		rolesTitle: (name: string) => `Cargos de ${name}`,
		membersWithRole: "Miembros",
		delete: "Borrar",
		noPermissions: "Sin permisos",
		confirmDeleteRole: (name: string) => `¿Estás seguro de que quieres borrar el cargo **${name}**?\n-# Los miembros con este cargo serán reasignados al cargo de **Miembro** por defecto.`,
		errorDeleteRole: `Error al borrar el cargo. Puede ser un cargo protegido (como Líder o Miembro) u otro error ha ocurrido.`,
		cancel: "Cancelar",
		transferTitle: "Transferir Liderazgo",
		transferDescription: (target: string) => `¿Estás seguro de que deseas transferir el liderazgo de la cuadrilla a **${target}**?\n-# Esta acción no se puede deshacer. Te convertirás en un Miembro regular.`,
		errorMustBeLeader: `Solo el líder puede transferir el liderazgo de la cuadrilla ${EmoteString.Gang}`,
		errorCantTransferToSelf: `No puedes transferir el liderazgo a ti mismo ${EmoteString.Gang}`,
		errorTransferLeadership: `Error al transferir el liderazgo. Inténtalo de nuevo más tarde ${EmoteString.Gang}`,
		successTransferLeadership: (target: string) => `¡Has transferido el liderazgo de la cuadrilla a **${target}** con éxito! ${EmoteString.Gang}`,
		robInvestment: "Robo a inversión",
		inProgress: "en progreso",
		finished: "finalizado",
		robberyInitiated: (invName: string, targetName: string) => `Organizando robo contra ${EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${EmoteString.Waiting}`,
		robberyAttempting: (invName: string, targetName: string) => `Intentando robar ${EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${EmoteString.Waiting}`,
		participants: (count: number) => `Participantes: ${count}`,
		participate: "Participar",
		abortRobbery: "Abortar robo",
		autoStartRobbery: (seconds: number) => `Inicia automáticamente en ${seconds} segundos.`,
		alreadyIn: "Ya estás participando.",
		reason: (type: InvestmentRobberyReason) => {
			const reasons = {
				[InvestmentRobberyReason.NoPermission]: "No tienes permiso para iniciar un robo.",
				[InvestmentRobberyReason.CantRobYourself]: "No puedes robar tu propia inversión.",
				[InvestmentRobberyReason.LeaderNotIdling]: "Debes estar vagando para iniciar un robo.",
				[InvestmentRobberyReason.TargetSameGang]: "El objetivo está en tu cuadrilla.",
				[InvestmentRobberyReason.WithoutItem]: "No puedes robar sin un arma.",
				[InvestmentRobberyReason.TargetWithoutNick]: "El objetivo no tiene un apodo.",
				[InvestmentRobberyReason.TargetWithoutClass]: "El objetivo no tiene una clase.",
				[InvestmentRobberyReason.TargetAlreadyUnderAttack]: "El objetivo ya está siendo atacado.",
				[InvestmentRobberyReason.TargetNoInvestment]: "El objetivo no tiene un investimento.",
				[InvestmentRobberyReason.TargetNoYield]: "El investimento del objetivo no tiene lucros.",
				[InvestmentRobberyReason.NotInGang]: "No estás en esta cuadrilla.",
				[InvestmentRobberyReason.ParticipateNotIdling]: "Debes estar vagando para participar.",
				[InvestmentRobberyReason.LeaderIsWanted]: "Estás siendo buscado por la policía y no puedes iniciar un atraco.",
				[InvestmentRobberyReason.ParticipateIsWanted]: "Estás siendo buscado por la policía y no puedes participar.",
			};
			return reasons[type] || "Error desconocido al iniciar el robo.";
		},
		onlyLeaderCanAbort: "Solo quien inició el robo puede abortarlo.",
		robberyAborted: (user: string) => `El robo fue abortado por **${user}**`,
		defendDMTitle: "¡Ataque a Inversión!",
		defendDMDescription: (gangName: string, invName: string) => `¡La cuadrilla **${gangName}** está atacando tu inversión **${invName}**! Puedes defender, ganando ${EmoteString.Defense}+5 DEF, pero si pierdes, serás hospitalizado por 30 minutos.`,
		defend: "Defender",
		youMustBeIdling: "Debes estar vagando para unirte a la defensa.",
		defendingSuccess: "¡Ahora estás defendiendo tu inversión! Espera los resultados.",
		chance: "Probabilidad de éxito",
		successWin: "Éxito",
		stolen: "Robado para el banco de cuadrilla",
		expGained: "EXP ganada",
		henchmanHospitalized: "El secuaz fue hospitalizado.",
		defenderHospitalized: (name: string, date: Date) => `¡**${name}** fue hospitalizado! Será curado ${showTime(date.getTime(), true)}`,
		youWereHospitalized: (date: Date) => `¡Fuiste hospitalizado! Serás curado ${showTime(date.getTime(), true)}`,
		failureLose: "Fracaso",
		attackersImprisoned: (hours: number) => `Todos los atacantes fueron enviados a prisión!\n-# Serán liberados ${showTime(addHours(Date.now(), hours).getTime(), true)}`,
		attackersHospitalized: "También fueron hospitalizados por 30 minutos.",
		targetIsDefending: (name: string) => `¡**${name}** está defendiendo! ${EmoteString.Defense}`,
		targetHasHenchman: `¡El objetivo tiene un secuaz activo!`,
		nextYield: "Próximo lucro",
		robberyResultLost: "¡Tu inversión fue robada con éxito!",
		robberyResultWon: "¡Defendiste tu inversión con éxito!",
		henchmanStillActive: "¡Tu secuaz te protegió y sigue activo!",
		robberyCooldown: (time: number) => `${EmoteString.Police} La policía está buscando a tu cuadrilla. Podrás robar de nuevo ${showTime(time, true)}`,
	},
} as const satisfies Localization;
