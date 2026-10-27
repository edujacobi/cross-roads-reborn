"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const GangImageCanvasBuilder_1 = require("#bot/ui/builders/GangImageCanvasBuilder");
const ProgressBarCanvasBuilder_1 = require("#bot/ui/builders/ProgressBarCanvasBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Gang_1 = require("#core/models/Gang");
const InvestmentRobbery_1 = require("#core/models/InvestmentRobbery");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const log_1 = require("#shared/log");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const GangBases_1 = require("#core/types/GangBases");
const GangColors_1 = require("#core/types/GangColors");
const Investments_1 = require("#core/types/Investments");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
Gang_1.Gang.Notifier = async (userId, gangInfo, message, sender, specialMessage) => {
    const recipient = new User_1.User(userId);
    await recipient.GetSimpleInfo();
    const language = recipient.Language;
    const messageText = typeof message === "string" ? message : message[language];
    let specialMessageText = "";
    if (specialMessage) {
        specialMessageText = typeof specialMessage === "string" ? specialMessage : specialMessage[language];
    }
    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
        .setAccentColor(GangColors_1.GangColor[gangInfo.colorId].Color)
        .addTexts([
        messageText,
    ])
        .addLargeSeparator()
        .addTexts([
        `-# ${sender ? `${sender.GetNameWithImage()} • ` : ""}${emotes_1.EmoteString.Gang} ${gangInfo.name} (${gangInfo.acronym})${specialMessageText ? ` • **${specialMessageText}**` : ""}`,
    ]);
    return await (0, discordInteractions_1.sendComplexPrivateMessage)(userId, {
        components: [container],
        flags: [discord_js_1.MessageFlags.IsComponentsV2],
    });
};
var CommandOption;
(function (CommandOption) {
    CommandOption["Info"] = "info";
    CommandOption["Create"] = "create";
    CommandOption["Edit"] = "edit";
    CommandOption["Invite"] = "invite";
    CommandOption["Leave"] = "leave";
    CommandOption["Kick"] = "kick";
    CommandOption["Communicate"] = "communicate";
    CommandOption["Base"] = "base";
    CommandOption["Deposit"] = "deposit";
    CommandOption["CreateRole"] = "create_role";
    CommandOption["ChangeRole"] = "change_role";
    CommandOption["EditRole"] = "edit_role";
    CommandOption["Roles"] = "roles";
    CommandOption["Transfer"] = "transfer";
    CommandOption["RobInvestment"] = "rob_investment";
    CommandOption["Import"] = "import";
})(CommandOption || (CommandOption = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("gang")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "gangue",
        [discord_js_1.Locale.SpanishES]: "cuadrilla",
    })
        .setDescription("View information about gangs")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Visualize informações sobre gangues",
        [discord_js_1.Locale.SpanishES]: "Ver información sobre cuadrillas",
    })
        .addSubcommand(info => info
        .setName(CommandOption.Info)
        .setDescription("Show information about a gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Mostra informações sobre uma gangue",
        [discord_js_1.Locale.SpanishES]: "Muestra información sobre una cuadrilla",
    })
        .addStringOption(name => name
        .setName("name")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "nome",
        [discord_js_1.Locale.SpanishES]: "nombre",
    })
        .setDescription("Gang name or acronym to search for")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Nome ou acrônimo da gangue para buscar",
        [discord_js_1.Locale.SpanishES]: "Nombre o acrónimo de la cuadrilla para buscar",
    })))
        .addSubcommand(importCmd => importCmd
        .setName(CommandOption.Import)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "importar",
        [discord_js_1.Locale.SpanishES]: "importar",
    })
        .setDescription("Manage gang item imports")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Gerencie importações de itens da gangue",
        [discord_js_1.Locale.SpanishES]: "Gestiona las importaciones de objetos de la cuadrilla",
    }))
        .addSubcommand(create => create
        .setName(CommandOption.Create)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "criar",
        [discord_js_1.Locale.SpanishES]: "crear",
    })
        .setDescription("Create a new gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Cria uma nova gangue",
        [discord_js_1.Locale.SpanishES]: "Crea una nueva cuadrilla",
    })
        .addStringOption(name => name
        .setName("name")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "nome",
        [discord_js_1.Locale.SpanishES]: "nombre",
    })
        .setDescription("Gang name (max. 25 characters)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Nome da gangue (máx. 25 caracteres)",
        [discord_js_1.Locale.SpanishES]: "Nombre de la cuadrilla (máx. 25 caracteres)",
    })
        .setRequired(true)
        .setMinLength(4)
        .setMaxLength(50))
        .addStringOption(acronym => acronym
        .setName("acronym")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "acrônimo",
        [discord_js_1.Locale.SpanishES]: "acrónimo",
    })
        .setDescription("Gang acronym (max. 3 characters)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Acrônimo da gangue (máx. 3 caracteres)",
        [discord_js_1.Locale.SpanishES]: "Acrónimo de la cuadrilla (máx. 3 caracteres)",
    })
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(3))
        .addStringOption(description => description
        .setName("description")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "descricao",
        [discord_js_1.Locale.SpanishES]: "descripcion",
    })
        .setDescription("Gang description")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Descrição da gangue",
        [discord_js_1.Locale.SpanishES]: "Descripción de la cuadrilla",
    })
        .setRequired(true))
        .addIntegerOption(color => color
        .setName("color")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "cor",
        [discord_js_1.Locale.SpanishES]: "color",
    })
        .setDescription("Gang color")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Cor da gangue",
        [discord_js_1.Locale.SpanishES]: "Color de la cuadrilla",
    })
        .setRequired(true)
        .addChoices(Object.values(GangColors_1.GangColor)
        .filter(color => !color.Special)
        .map((color) => ({
        name: color.Description[Language_1.Language.English],
        value: color.Id,
        name_localizations: {
            [discord_js_1.Locale.PortugueseBR]: color.Description[Language_1.Language.Portuguese],
            [discord_js_1.Locale.SpanishES]: color.Description[Language_1.Language.Spanish],
        },
    }))))
        .addStringOption(image => image
        .setName("image")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "imagem",
        [discord_js_1.Locale.SpanishES]: "imagen",
    })
        .setDescription("Gang image URL (optional)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "URL da imagem da gangue (opcional)",
        [discord_js_1.Locale.SpanishES]: "URL de la imagen de la cuadrilla (opcional)",
    })
        .setRequired(false)))
        .addSubcommand(edit => edit
        .setName(CommandOption.Edit)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "editar",
        [discord_js_1.Locale.SpanishES]: "editar",
    })
        .setDescription("Edit your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Edita sua gangue",
        [discord_js_1.Locale.SpanishES]: "Edita tu cuadrilla",
    })
        .addStringOption(name => name
        .setName("name")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "nome",
        [discord_js_1.Locale.SpanishES]: "nombre",
    })
        .setDescription("Gang name (max. 25 characters)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Nome da gangue (máx. 25 caracteres)",
        [discord_js_1.Locale.SpanishES]: "Nombre de la cuadrilla (máx. 25 caracteres)",
    })
        .setMinLength(4)
        .setMaxLength(50))
        .addStringOption(acronym => acronym
        .setName("acronym")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "acrônimo",
        [discord_js_1.Locale.SpanishES]: "acrónimo",
    })
        .setDescription("Gang acronym (max. 3 characters)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Acrônimo da gangue (máx. 3 caracteres)",
        [discord_js_1.Locale.SpanishES]: "Acrónimo de la cuadrilla (máx. 3 caracteres)",
    })
        .setMinLength(2)
        .setMaxLength(3))
        .addStringOption(description => description
        .setName("description")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "descricao",
        [discord_js_1.Locale.SpanishES]: "descripcion",
    })
        .setDescription("Gang description")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Descrição da gangue",
        [discord_js_1.Locale.SpanishES]: "Descripción de la cuadrilla",
    }))
        .addIntegerOption(color => color
        .setName("color")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "cor",
        [discord_js_1.Locale.SpanishES]: "color",
    })
        .setDescription("Gang color")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Cor da gangue",
        [discord_js_1.Locale.SpanishES]: "Color de la cuadrilla",
    })
        .addChoices(Object.values(GangColors_1.GangColor)
        .filter(color => !color.Special)
        .map((color) => ({
        name: color.Description[Language_1.Language.English],
        value: color.Id,
        name_localizations: {
            [discord_js_1.Locale.PortugueseBR]: color.Description[Language_1.Language.Portuguese],
            [discord_js_1.Locale.SpanishES]: color.Description[Language_1.Language.Spanish],
        },
    }))))
        .addStringOption(image => image
        .setName("image")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "imagem",
        [discord_js_1.Locale.SpanishES]: "imagen",
    })
        .setDescription("Gang image URL")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "URL da imagem da gangue",
        [discord_js_1.Locale.SpanishES]: "URL de la imagen de la cuadrilla",
    })))
        .addSubcommand(invite => invite
        .setName(CommandOption.Invite)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "convidar",
        [discord_js_1.Locale.SpanishES]: "invitar",
    })
        .setDescription("Invite a user to your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Convida um usuário para sua gangue",
        [discord_js_1.Locale.SpanishES]: "Invita a un usuario a tu cuadrilla",
    })
        .addStringOption(user => user
        .setName("user")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "usuario",
        [discord_js_1.Locale.SpanishES]: "usuario",
    })
        .setDescription("User to invite to your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Usuário para convidar para sua gangue",
        [discord_js_1.Locale.SpanishES]: "Usuario para invitar a tu cuadrilla",
    })
        .setRequired(true)))
        .addSubcommand(leave => leave
        .setName(CommandOption.Leave)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "sair",
        [discord_js_1.Locale.SpanishES]: "salir",
    })
        .setDescription("Leave your current gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Sai da sua gangue atual",
        [discord_js_1.Locale.SpanishES]: "Sale de tu cuadrilla actual",
    }))
        .addSubcommand(kick => kick
        .setName(CommandOption.Kick)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "expulsar",
        [discord_js_1.Locale.SpanishES]: "expulsar",
    })
        .setDescription("Kick a user from your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Expulsa um usuário da sua gangue",
        [discord_js_1.Locale.SpanishES]: "Expulsa a un usuario de tu cuadrilla",
    })
        .addStringOption(user => user
        .setName("user")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "usuario",
        [discord_js_1.Locale.SpanishES]: "usuario",
    })
        .setDescription("User to kick from your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Usuário para expulsar da sua gangue",
        [discord_js_1.Locale.SpanishES]: "Usuario para expulsar de tu cuadrilla",
    })
        .setRequired(true)))
        .addSubcommand(communicate => communicate
        .setName(CommandOption.Communicate)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "comunicar",
        [discord_js_1.Locale.SpanishES]: "comunicar",
    })
        .setDescription("Communicate with your gang members")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Comunica com os membros da sua gangue",
        [discord_js_1.Locale.SpanishES]: "Comunica con los miembros de tu cuadrilla",
    })
        .addStringOption(message => message
        .setName("message")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "mensagem",
        [discord_js_1.Locale.SpanishES]: "mensaje",
    })
        .setDescription("Message to send to your gang members")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Mensagem para enviar aos membros da sua gangue",
        [discord_js_1.Locale.SpanishES]: "Mensaje para enviar a los miembros de tu cuadrilla",
    })
        .setMinLength(2)
        .setMaxLength(1024)
        .setRequired(true)))
        .addSubcommand(base => base
        .setName(CommandOption.Base)
        .setDescription("Buy a base for your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Compre uma base para sua gangue",
        [discord_js_1.Locale.SpanishES]: "Compra una base para tu cuadrilla",
    }))
        .addSubcommand(deposit => deposit
        .setName(CommandOption.Deposit)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "depositar",
        [discord_js_1.Locale.SpanishES]: "depositar",
    })
        .setDescription("Deposit money into your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Deposite dinheiro na sua gangue",
        [discord_js_1.Locale.SpanishES]: "Deposita dinero en tu cuadrilla",
    })
        .addIntegerOption(amount => amount
        .setName("amount")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "quantidade",
        [discord_js_1.Locale.SpanishES]: "cantidad",
    })
        .setDescription("Amount to deposit")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Quantidade para depositar",
        [discord_js_1.Locale.SpanishES]: "Cantidad para depositar",
    })
        .setRequired(false)
        .setMinValue(1)))
        .addSubcommand(createRole => createRole
        .setName(CommandOption.CreateRole)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "criar_cargo",
        [discord_js_1.Locale.SpanishES]: "crear_cargo",
    })
        .setDescription("Create a new role for your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Cria um novo cargo para sua gangue",
        [discord_js_1.Locale.SpanishES]: "Crea un nuevo cargo para tu cuadrilla",
    })
        .addStringOption(name => name
        .setName("name")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "nome",
        [discord_js_1.Locale.SpanishES]: "nombre",
    })
        .setDescription("Role name")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Nome do cargo",
        [discord_js_1.Locale.SpanishES]: "Nombre del cargo",
    })
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(20)))
        .addSubcommand(changeRole => changeRole
        .setName(CommandOption.ChangeRole)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "mudar_cargo",
        [discord_js_1.Locale.SpanishES]: "cambiar_cargo",
    })
        .setDescription("Change a member's role")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Muda o cargo de um membro",
        [discord_js_1.Locale.SpanishES]: "Cambia el cargo de un miembro",
    })
        .addStringOption(user => user
        .setName("user")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "usuario",
        [discord_js_1.Locale.SpanishES]: "usuario",
    })
        .setDescription("User to change role")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Usuário para mudar o cargo",
        [discord_js_1.Locale.SpanishES]: "Usuario para cambiar el cargo",
    })
        .setRequired(true)))
        .addSubcommand(editRole => editRole
        .setName(CommandOption.EditRole)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "editar_cargo",
        [discord_js_1.Locale.SpanishES]: "editar_cargo",
    })
        .setDescription("Edit an existing role in your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Edita um cargo existente na sua gangue",
        [discord_js_1.Locale.SpanishES]: "Edita un cargo existente en tu cuadrilla",
    })
        .addStringOption(role => role
        .setName("role")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "cargo",
        [discord_js_1.Locale.SpanishES]: "cargo",
    })
        .setDescription("The name of the role to edit")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "O nome do cargo para editar",
        [discord_js_1.Locale.SpanishES]: "El nombre del cargo para editar",
    })
        .setRequired(true))
        .addStringOption(newName => newName
        .setName("new_name")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "novo_nome",
        [discord_js_1.Locale.SpanishES]: "nuevo_nombre",
    })
        .setDescription("The new name for the role")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "O novo nome para o cargo",
        [discord_js_1.Locale.SpanishES]: "El nuevo nombre para el cargo",
    })
        .setMinLength(2)
        .setMaxLength(20)))
        .addSubcommand(roles => roles
        .setName(CommandOption.Roles)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "cargos",
        [discord_js_1.Locale.SpanishES]: "cargos",
    })
        .setDescription("List all roles in your gang")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Lista todos os cargos da sua gangue",
        [discord_js_1.Locale.SpanishES]: "Lista todos los cargos de tu cuadrilla",
    }))
        .addSubcommand(transfer => transfer
        .setName(CommandOption.Transfer)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "transferir",
        [discord_js_1.Locale.SpanishES]: "transferir",
    })
        .setDescription("Transfer the leadership of your gang to another member")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Transfere a liderança da sua gangue para outro membro",
        [discord_js_1.Locale.SpanishES]: "Transfiere el liderazgo de tu cuadrilla a otro miembro",
    })
        .addStringOption(user => user
        .setName("user")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "usuario",
        [discord_js_1.Locale.SpanishES]: "usuario",
    })
        .setDescription("User to transfer the leadership to")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Usuário para transferir a liderança",
        [discord_js_1.Locale.SpanishES]: "Usuario a quien transferir el liderazgo",
    })
        .setRequired(true)))
        .addSubcommand(robInvestment => robInvestment
        .setName(CommandOption.RobInvestment)
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "roubar_investimento",
        [discord_js_1.Locale.SpanishES]: "robar_inversion",
    })
        .setDescription("Rob a user's investment (Nickname or Id)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Rouba o investimento de um usuário (Apelido ou Id)",
        [discord_js_1.Locale.SpanishES]: "Roba la inversión de un usuario (Apodo o Id)",
    })
        .addStringOption(user => user
        .setName("user")
        .setNameLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "usuario",
        [discord_js_1.Locale.SpanishES]: "usuario",
    })
        .setDescription("Target user to rob (Nickname or Id)")
        .setDescriptionLocalizations({
        [discord_js_1.Locale.PortugueseBR]: "Usuário alvo do roubo (Apelido ou Id)",
        [discord_js_1.Locale.SpanishES]: "Usuario objetivo a robar (Apodo o Id)",
    })
        .setRequired(true))),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const containerInfo = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(discord_js_1.Colors.Green)
            .addSectionComponents(main => main
            .addTexts([
            `# ${s.gangTitle}`,
            s.gangDescription,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://cdn.discordapp.com/attachments/1233604589064818808/1457724304383938611/GangImage.png")))
            .addFooter({
            text: (0, ui_1.formatMoney)(user.Money, language),
        });
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case CommandOption.Info: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const searchName = interaction.options.getString("name");
                try {
                    let gang;
                    if (!searchName) {
                        // If no name provided, check user's gang
                        gang = await Gang_1.Gang.GetByUserId(user.Id);
                        if (!gang) {
                            return (0, discordInteractions_1.replyWithContainer)(interaction, containerInfo, true);
                        }
                    }
                    else {
                        // Search gang by name
                        gang = await Gang_1.Gang.FindByName(searchName);
                        if (!gang) {
                            return warn(s.gangNotFoundByName(searchName));
                        }
                    }
                    if (!gang) {
                        return;
                    }
                    let MemberListType;
                    (function (MemberListType) {
                        MemberListType["Nickname"] = "nickname";
                        MemberListType["Id"] = "id";
                        MemberListType["Deposit"] = "deposit";
                    })(MemberListType || (MemberListType = {}));
                    let currentType = MemberListType.Nickname;
                    const membersList = (type) => gang.Members.map(member => {
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
                            let textDeposit = s.canDeposit;
                            if (member.Deposit.Time > new Date()) {
                                textDeposit = `${s.canDepositAgain} ${(0, discord_js_1.time)(member.Deposit.Time, discord_js_1.TimestampStyles.RelativeTime)}`;
                            }
                            deposit = `\n-# ${(0, ui_1.formatMoney)(member.Deposit.Amount, language)}. ${textDeposit}`;
                        }
                        return `${emote} ${underscore}${info}${underscore} - ${member.RoleName}${deposit}`;
                    }).join("\n");
                    const adminIdText = user.Id === process.env.JACOBI_ID ? ` • ${s.gangId(gang.Id)}` : "";
                    const gangBase = GangBases_1.GangBases[gang.BaseId];
                    const gangBaseModifierText = [];
                    if (gangBase.Modifier.PrisonEscape?.Positive) {
                        gangBaseModifierText.push(`${emotes_1.EmoteString.Victory} +${gangBase.Modifier.PrisonEscape?.Positive * gang.Level}% ${s.prisonModifier} ${emotes_1.EmoteString.Escape}`);
                    }
                    if (gangBase.Modifier.Attack?.Positive) {
                        gangBaseModifierText.push(`${emotes_1.EmoteString.Victory}${emotes_1.EmoteString.Attack}+${gangBase.Modifier.Attack?.Positive * gang.Level} ATK `);
                    }
                    if (gangBase.Modifier.Defense?.Positive) {
                        gangBaseModifierText.push(`${emotes_1.EmoteString.Victory}${emotes_1.EmoteString.Defense}+${gangBase.Modifier.Defense?.Positive * gang.Level} DEF`);
                    }
                    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor((0, ui_1.hexToRGB)((0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.Color].Color)))
                        .addSectionComponents(header => header
                        .addTexts([
                        `# [${gang.Acronym}] ${gang.Name}${GangColors_1.GangColor[gang.Color].Emote.String}`,
                        `_${gang.Description}_`,
                        `## ${(0, ui_1.formatMoney)(gang.Money, language)}`,
                        // `-# ${s.totalInBalance}`,
                    ])
                        .setThumbnailAccessory(image => image
                        .setURL(gang.Image || GangImageCanvasBuilder_1.DEFAULT_GANG_IMAGE)))
                        .addLargeSeparator();
                    if (gang.BaseId !== GangBases_1.GangBaseId.None) {
                        container
                            .addSectionComponents(section => section
                            .addTexts([
                            `### ${gangBase.Name[language]}`,
                            `-# ${s.level} ${gang.Level} ${gang.GetExpBar(6, language)}`,
                            ``,
                            gangBaseModifierText.join("\n"),
                        ])
                            .setThumbnailAccessory(thumb => thumb
                            .setURL(gangBase.ImageUrl)))
                            .addLargeSeparator();
                    }
                    else {
                        container
                            .addTexts([
                            `### ${gangBase.Name[language]}`,
                        ])
                            .addLargeSeparator();
                    }
                    const nickBtn = new discord_js_1.ButtonBuilder()
                        .setLabel("Nicknames")
                        .setCustomId(MemberListType.Nickname)
                        .setDisabled(true)
                        .setStyle(discord_js_1.ButtonStyle.Secondary);
                    const idBtn = new discord_js_1.ButtonBuilder()
                        .setLabel("IDs")
                        .setCustomId(MemberListType.Id)
                        .setStyle(discord_js_1.ButtonStyle.Secondary);
                    const depositBtn = new discord_js_1.ButtonBuilder()
                        .setLabel(s.deposits)
                        .setCustomId(MemberListType.Deposit)
                        .setDisabled(user.GangId !== gang.Id)
                        .setStyle(discord_js_1.ButtonStyle.Secondary);
                    container
                        .addTexts([
                        `### ${s.members} (${gang.Members.length}/${gang.GetMaxMembers()})`,
                    ])
                        .addTexts([
                        `${membersList(currentType)}`,
                    ], 10)
                        .addButtonRow(() => nickBtn, () => idBtn, () => depositBtn)
                        .addFooter({
                        text: `${s.created} ${(0, discord_js_1.time)(gang.CreatedAt, discord_js_1.TimestampStyles.ShortDateTime)}${adminIdText}`,
                        button: new discord_js_1.ButtonBuilder()
                            .setLabel("Info")
                            .setCustomId("info")
                            .setStyle(discord_js_1.ButtonStyle.Secondary),
                    });
                    let gotToInfo = false;
                    const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                    collector?.on("end", async () => {
                        if (gotToInfo)
                            return;
                        await (0, collectors_1.disableButtons)(interaction, container);
                    });
                    collector?.on("collect", async (btn) => {
                        await (0, discordInteractions_1.deferUpdate)(btn);
                        if (btn.customId === "info") {
                            gotToInfo = true;
                            return (0, discordInteractions_1.replyWithContainer)(interaction, containerInfo);
                        }
                        else if (btn.customId === MemberListType.Nickname) {
                            currentType = btn.customId;
                            container.changeTextFromSectionId(10, `${membersList(currentType)}`);
                            nickBtn.setDisabled(true);
                            idBtn.setDisabled(false);
                            depositBtn.setDisabled(user.GangId !== gang.Id);
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        else if (btn.customId === MemberListType.Id) {
                            currentType = btn.customId;
                            container.changeTextFromSectionId(10, `${membersList(currentType)}`);
                            nickBtn.setDisabled(false);
                            idBtn.setDisabled(true);
                            depositBtn.setDisabled(user.GangId !== gang.Id);
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        else if (btn.customId === MemberListType.Deposit) {
                            currentType = btn.customId;
                            container.changeTextFromSectionId(10, `${membersList(currentType)}`);
                            nickBtn.setDisabled(false);
                            idBtn.setDisabled(false);
                            depositBtn.setDisabled(true);
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                    });
                    return;
                }
                catch (err) {
                    return warn(s.errorSearchingGang);
                }
            }
            case CommandOption.RobInvestment: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const targetId = interaction.options.getString("user", true);
                const targetUser = await (0, userUtils_1.searchUser)(targetId, interaction, language);
                if (!targetUser)
                    return;
                return runInvestmentRobberySession(interaction, user, targetUser);
            }
            case CommandOption.Import: {
                await (0, discordInteractions_1.deferReply)(interaction);
                let gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                if (gang.BaseId === GangBases_1.GangBaseId.None) {
                    return warn(s.gangHasNoBase);
                }
                const hasImportPermission = gang.CanImportShipments(user.Id);
                const gangBase = GangBases_1.GangBases[gang.BaseId];
                const importImageMapper = {
                    [GangBases_1.GangBaseId.None]: "",
                    [GangBases_1.GangBaseId.Airport]: "ui/assets/images/ui_elements/airport.png",
                    [GangBases_1.GangBaseId.BikeClub]: "ui/assets/images/ui_elements/bikeclub.png",
                    [GangBases_1.GangBaseId.Bunker]: "ui/assets/images/ui_elements/bunker.png",
                };
                const getStatusContainer = async (currentGang) => {
                    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setAccentColor(GangColors_1.GangColor[currentGang.Color].Color)
                        .addSectionComponents(section => section
                        .addTexts([
                        `# ${s.importTitle}`,
                        s.importDescription,
                    ])
                        .setThumbnailAccessory(thumb => thumb
                        .setURL(gangBase.ImageUrl)))
                        .addLargeSeparator();
                    const files = [];
                    if (currentGang.ImportArrivesAt) {
                        const now = Date.now();
                        const total = 24 * 60 * 60 * 1000;
                        const start = currentGang.ImportArrivesAt.getTime() - total;
                        const current = now - start;
                        const imagePath = importImageMapper[currentGang.BaseId];
                        const colorHex = (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[currentGang.Color].Color);
                        const progressBarBuilder = new ProgressBarCanvasBuilder_1.ProgressBarCanvasBuilder(600, 40, current / total, imagePath, colorHex, language);
                        const buffer = await progressBarBuilder.GenerateImage();
                        files.push(new discord_js_1.AttachmentBuilder(buffer, { name: "progress.webp" }));
                        container
                            .addSectionComponents(section => section
                            .addTexts([
                            s.importActive,
                            `-# ${s.importInfoArrivesIn((0, discord_js_1.time)(currentGang.ImportArrivesAt, discord_js_1.TimestampStyles.RelativeTime))}`,
                            `-# ${s.importInfoSuccessChance(`${Math.floor(currentGang.GetImportSuccessChance() * 100)}%`)}`,
                        ])
                            .setButtonAccessory(btn => btn
                            .setCustomId("cancel_import")
                            .setLabel(s.cancelImport)
                            .setDisabled(!hasImportPermission)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)))
                            .addImage("attachment://progress.webp");
                    }
                    else {
                        const successChance = currentGang.GetImportSuccessChance();
                        const cost = currentGang.GetImportCost();
                        // Check cooldowns
                        if (currentGang.LastImportSuccess) {
                            const cooldownEnd = (0, date_fns_1.addHours)(currentGang.LastImportSuccess, Gang_1.Gang.IMPORT_COOLDOWN_HOURS);
                            if ((0, date_fns_1.isFuture)(cooldownEnd)) {
                                container
                                    .addTexts([s.importCooldown((0, discord_js_1.time)(cooldownEnd, discord_js_1.TimestampStyles.RelativeTime))])
                                    .addFooter({
                                    text: `${currentGang.Name} • ${(0, ui_1.formatMoney)(currentGang.Money, language)}`,
                                });
                                return { container, files };
                            }
                        }
                        if (currentGang.LastImportCancelled) {
                            const cooldownEnd = (0, date_fns_1.addHours)(currentGang.LastImportCancelled, Gang_1.Gang.IMPORT_CANCEL_COOLDOWN_HOURS);
                            if ((0, date_fns_1.isFuture)(cooldownEnd)) {
                                container
                                    .addTexts([s.importCancelCooldown((0, discord_js_1.time)(cooldownEnd, discord_js_1.TimestampStyles.RelativeTime))])
                                    .addFooter({
                                    text: `${currentGang.Name} • ${(0, ui_1.formatMoney)(currentGang.Money, language)}`,
                                });
                                return { container, files };
                            }
                        }
                        container
                            .addSectionComponents(section => section
                            .addTexts([
                            `# ${s.importTitle}`,
                            s.importReady((0, ui_1.formatMoney)(cost, language), Gang_1.Gang.IMPORT_WAIT_HOURS.toString(), `${Math.floor(successChance * 100)}%`),
                        ])
                            .setButtonAccessory(btn => btn
                            .setCustomId("start_import")
                            .setLabel(s.startImport)
                            .setStyle(discord_js_1.ButtonStyle.Success)
                            .setDisabled(!hasImportPermission || currentGang.Money < cost)));
                    }
                    container.addFooter({
                        text: `${currentGang.Name} • ${(0, ui_1.formatMoney)(currentGang.Money, language)}`,
                    });
                    return { container, files };
                };
                let { container, files } = await getStatusContainer(gang);
                const response = await (0, discordInteractions_1.replyInteraction)(interaction, {
                    components: [container],
                    files: files,
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
                if (!hasImportPermission)
                    return;
                const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    gang = await Gang_1.Gang.GetByUserId(user.Id);
                    if (!gang) {
                        return warn(s.notInGang);
                    }
                    if (btn.customId === "start_import") {
                        const check = await gang.CanStartImport();
                        if (!check.can && check.reason !== undefined) {
                            let data = {};
                            if (check.reason === Gang_1.GangImportFailureReason.Cooldown && gang.LastImportSuccess) {
                                data = { time: (0, discord_js_1.time)((0, date_fns_1.addHours)(gang.LastImportSuccess, Gang_1.Gang.IMPORT_COOLDOWN_HOURS), discord_js_1.TimestampStyles.ShortDateTime) };
                            }
                            else if (check.reason === Gang_1.GangImportFailureReason.CancelCooldown && gang.LastImportCancelled) {
                                data = { time: (0, discord_js_1.time)((0, date_fns_1.addHours)(gang.LastImportCancelled, Gang_1.Gang.IMPORT_CANCEL_COOLDOWN_HOURS), discord_js_1.TimestampStyles.ShortDateTime) };
                            }
                            else if (check.reason === Gang_1.GangImportFailureReason.NotEnoughMoney) {
                                data = { cost: (0, ui_1.formatMoney)(gang.GetImportCost(), language) };
                            }
                            const container = (0, ui_1.defaultComponent)({
                                user,
                                color: GangColors_1.GangColor[gang.Color].Color,
                                description: s.importReason(check.reason, data),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        await gang.StartImport();
                        const status = await getStatusContainer(gang);
                        container = status.container;
                        files = status.files;
                        return (0, discordInteractions_1.replyInteraction)(interaction, {
                            components: [container],
                            files: files,
                        });
                    }
                    if (btn.customId === "cancel_import") {
                        const refund = Math.floor(gang.GetImportCost() * Gang_1.Gang.IMPORT_CANCEL_REFUND_RATIO);
                        // Confirm cancel
                        container = new CustomContainerBuilder_1.CustomContainerBuilder()
                            .setUser(user)
                            .setAccentColor(discord_js_1.Colors.Red)
                            .addTexts([s.confirmCancelImport((0, ui_1.formatMoney)(refund, language))])
                            .addButtonRow(btn => btn
                            .setCustomId("confirm_cancel")
                            .setLabel(s.confirm)
                            .setStyle(discord_js_1.ButtonStyle.Danger), btn => btn
                            .setCustomId("back")
                            .setLabel(s.back)
                            .setStyle(discord_js_1.ButtonStyle.Secondary))
                            .addFooter();
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    if (btn.customId === "confirm_cancel") {
                        const refund = await gang.CancelImport();
                        container = (0, ui_1.defaultComponent)({
                            user,
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successCancelImport((0, ui_1.formatMoney)(refund, language)),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    if (btn.customId === "back") {
                        const status = await getStatusContainer(gang);
                        container = status.container;
                        files = status.files;
                        return (0, discordInteractions_1.replyInteraction)(interaction, {
                            components: [container],
                            files: files,
                        });
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.Create: {
                await (0, discordInteractions_1.deferReply)(interaction);
                // Verificar se o usuário já está em uma gangue
                if (user.IsInGang()) {
                    return warn(s.alreadyInGang);
                }
                // Verificar se o usuário tem dinheiro suficiente
                if (user.Money < Gang_1.Gang.CREATION_COST) {
                    return warn(s.notEnoughMoneyCreate((0, ui_1.formatMoney)(Gang_1.Gang.CREATION_COST, language)));
                }
                // Obter os parâmetros da gangue
                const name = interaction.options.getString("name", true);
                const acronym = interaction.options.getString("acronym", true);
                const description = interaction.options.getString("description", true);
                const color = interaction.options.getInteger("color", true);
                const image = interaction.options.getString("image");
                // Check if gang with the same name or acronym already exists
                const exists = await checkGangExists(name, acronym);
                if (exists)
                    return;
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
                const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                    .addTexts([
                    `-# ${s.gangCreated}`,
                ])
                    .addLargeSeparator()
                    .addTexts([
                    s.gangCreatedDetails(gang.Name, (0, ui_1.formatMoney)(Gang_1.Gang.CREATION_COST, language)),
                    `### ${s.name}`,
                    `${gang.Name}`,
                    `### ${s.acronym}`,
                    `${gang.Acronym.toUpperCase()}`,
                    `### ${s.description}`,
                    `${gang.Description}`,
                    `### ${s.color}`,
                    `${GangColors_1.GangColor[gang.Color].Emote.String} ${GangColors_1.GangColor[gang.Color].Description[language]}`,
                ]);
                if (image) {
                    container.addTexts([
                        `### ${s.image}`,
                        `${gang.Image}`,
                    ]);
                }
                container.addFooter();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            case CommandOption.Edit: {
                await (0, discordInteractions_1.deferReply)(interaction);
                // Obter os parâmetros da gangue
                const name = interaction.options.getString("name");
                const acronym = interaction.options.getString("acronym");
                const description = interaction.options.getString("description");
                const color = interaction.options.getInteger("color");
                const image = interaction.options.getString("image");
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const canEdit = gang.CanEdit(user.Id);
                if (!canEdit) {
                    return warn(s.errorEdittingGangPermission);
                }
                // Check if gang with the same name or acronym already exists
                const exists = await checkGangExists(name, acronym);
                if (exists)
                    return;
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
                const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
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
                        `-# ${GangColors_1.GangColor[old.color].Emote.String} ~~${GangColors_1.GangColor[old.color].Description[language]}~~`,
                        `${GangColors_1.GangColor[gang.Color].Emote.String} ${GangColors_1.GangColor[gang.Color].Description[language]}`,
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
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            case CommandOption.Invite: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const canInvite = gang.CanInvite(user.Id);
                if (!canInvite) {
                    return warn(s.errorInviteGangPermission);
                }
                const targetUserInput = interaction.options.getString("user", true);
                const target = await (0, userUtils_1.searchUser)(targetUserInput, interaction);
                if (!target) {
                    return;
                }
                if (target.Id === user.Id) {
                    return warn(s.errorInviteGangYourself);
                }
                const validation = await gang.CanInviteUser(target);
                if (!validation.canInvite) {
                    return warn(s.errorInviteGangGeneric);
                }
                const COOLDOWN_INVITE = 3 * 60_000;
                const sI = Gang_1.Strings[user.Language];
                const sT = Gang_1.Strings[target.Language];
                // Check cooldown
                const cooldownInvite = interaction.client.invites;
                if (!cooldownInvite.has(gang.Id)) {
                    cooldownInvite.set(gang.Id, new discord_js_1.Collection());
                }
                const timestamp = cooldownInvite.get(gang.Id);
                const now = Date.now();
                if (!timestamp) {
                    return warn(s.errorInviteGangGeneric);
                }
                if (timestamp.has(target.Id)) {
                    const lastInviteTime = timestamp.get(target.Id) || 0;
                    if (now - lastInviteTime < COOLDOWN_INVITE) {
                        return warn(s.errorInviteGangGeneric);
                    }
                }
                timestamp.set(target.Id, now);
                const buttonAccept = new discord_js_1.ButtonBuilder()
                    .setCustomId("accept")
                    .setLabel(sT.acceptText)
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const buttonDecline = new discord_js_1.ButtonBuilder()
                    .setCustomId("decline")
                    .setLabel(sT.declineText)
                    .setStyle(discord_js_1.ButtonStyle.Secondary);
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents([buttonAccept, buttonDecline]);
                const response = await (0, discordInteractions_1.sendComplexPrivateMessage)(target.Id, {
                    components: [
                        (0, ui_1.defaultComponent)({
                            user,
                            description: sT.invitation.description(gang.Name, gang.Acronym, gang.GetJoinCost()),
                            footer: sT.invitation.footer,
                            buttons: row,
                        }),
                    ],
                    flags: [discord_js_1.MessageFlags.IsComponentsV2],
                });
                const collector = response?.createMessageComponentCollector({
                    filter: (i) => i.user.id === target.Id,
                    max: 1,
                    componentType: discord_js_1.ComponentType.Button,
                    idle: COOLDOWN_INVITE,
                });
                let responded = false;
                collector?.on("collect", async (btn) => {
                    let descriptionPrivate = "";
                    let descriptionChannel = "";
                    responded = true;
                    await target.GetInfo();
                    collector?.stop();
                    if (btn.customId === "accept") {
                        const joinCost = gang.GetJoinCost();
                        if (target.Money < joinCost) {
                            descriptionPrivate = sT.notEnoughMoney.private(gang.Name, gang.Acronym, joinCost);
                            descriptionChannel = sI.notEnoughMoney.channel(target.GetNameWithImage());
                        }
                        else {
                            const success = await gang.AcceptInvite(target);
                            if (!success) {
                                descriptionPrivate = sT.notSuccess.private(gang.Name, gang.Acronym);
                                descriptionChannel = sI.notSuccess.channel(target.GetNameWithImage());
                            }
                            else {
                                descriptionPrivate = sT.success.private(gang.Name, gang.Acronym);
                                descriptionChannel = sI.success.channel(target.GetNameWithImage());
                            }
                        }
                    }
                    else if (btn.customId === "decline") {
                        descriptionPrivate = sT.decline.private(gang.Name, gang.Acronym);
                        descriptionChannel = sI.decline.channel(target.GetNameWithImage());
                    }
                    response?.edit({
                        components: [(0, ui_1.defaultComponent)({
                                user,
                                description: descriptionPrivate,
                            })],
                    });
                    await (0, discordInteractions_1.sendComplexPrivateMessage)(user.Id, {
                        components: [
                            (0, ui_1.defaultComponent)({
                                user,
                                description: descriptionChannel,
                                footer: gang.Name,
                            }),
                        ],
                        flags: [discord_js_1.MessageFlags.IsComponentsV2],
                    });
                });
                collector?.on("end", async () => {
                    if (responded)
                        return;
                    response?.edit({
                        components: [(0, ui_1.defaultComponent)({
                                user,
                                description: sT.timeout.private(gang.Name, gang.Acronym),
                            })],
                    });
                    await (0, discordInteractions_1.sendComplexPrivateMessage)(user.Id, {
                        components: [
                            (0, ui_1.defaultComponent)({
                                user,
                                description: sI.timeout.channel(target.GetNameWithImage(), gang.Name, gang.Acronym),
                                footer: gang.Name,
                            }),
                        ],
                        flags: [discord_js_1.MessageFlags.IsComponentsV2],
                    });
                });
                const container = (0, ui_1.defaultComponent)({
                    color: GangColors_1.GangColor[gang.Color].Color,
                    description: s.successInviteGang(target.GetNameWithImage(), gang.Name),
                    user,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            case CommandOption.Leave: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const isLeader = user.Id === gang.LeaderId;
                const isAlone = gang.Members.length === 1;
                if (isLeader && !isAlone) {
                    return warn(s.errorLeaveGangLeader);
                }
                const buttonConfirm = new discord_js_1.ButtonBuilder()
                    .setCustomId("confirm")
                    .setLabel(s.confirm)
                    .setStyle(isLeader ? discord_js_1.ButtonStyle.Danger : discord_js_1.ButtonStyle.Success);
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents([buttonConfirm]);
                const container = (0, ui_1.defaultComponent)({
                    user,
                    color: GangColors_1.GangColor[gang.Color].Color,
                    description: isLeader ? s.confirmDisband(gang.Name) : s.confirmLeave(gang.Name),
                    buttons: row,
                });
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
                let responded = false;
                collector?.on("collect", async (btn) => {
                    responded = true;
                    if (!await Gang_1.Gang.GetByUserId(user.Id)) {
                        return warn(s.notInGang);
                    }
                    if (btn.customId === "confirm") {
                        const success = await gang.LeaveGang(user);
                        if (!success) {
                            return warn(isLeader ? s.errorDisbandGang : s.errorLeaveGang);
                        }
                        const container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: isLeader ? s.successDisband(gang.Name) : s.successLeaveGang(gang.Name),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    if (responded)
                        return;
                    const container = (0, ui_1.defaultComponent)({
                        color: GangColors_1.GangColor[gang.Color].Color,
                        description: s.noResponseLeaveGang(gang.Name),
                        user,
                    });
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.Kick: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const canKick = gang.CanKick(user.Id);
                if (!canKick) {
                    return warn(s.errorKickGangPermission);
                }
                const targetUserInput = interaction.options.getString("user", true);
                const target = await (0, userUtils_1.searchUser)(targetUserInput, interaction);
                if (!target) {
                    return;
                }
                if (target.Id === user.Id) {
                    return warn(s.errorKickGangYourself);
                }
                if (target.Id === gang.LeaderId) {
                    return warn(s.errorKickGangLeader);
                }
                const buttonConfirm = new discord_js_1.ButtonBuilder()
                    .setCustomId("confirm")
                    .setLabel(s.confirm)
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents([buttonConfirm]);
                const container = (0, ui_1.defaultComponent)({
                    user,
                    color: GangColors_1.GangColor[gang.Color].Color,
                    description: s.confirmKick(target.Nickname, gang.Name),
                    buttons: row,
                });
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
                let responded = false;
                collector?.on("collect", async (btn) => {
                    responded = true;
                    if (!await Gang_1.Gang.GetByUserId(user.Id)) {
                        return warn(s.notInGang);
                    }
                    if (btn.customId === "confirm") {
                        const success = await gang.KickMember(user, target);
                        if (!success) {
                            return warn(s.errorKickGang(target.Nickname, gang.Name));
                        }
                        const container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successKickGang(target.Nickname, gang.Name),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    if (responded)
                        return;
                    const container = (0, ui_1.defaultComponent)({
                        color: GangColors_1.GangColor[gang.Color].Color,
                        description: s.noResponseKickGang(target.Nickname, gang.Name),
                        user,
                    });
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.Communicate: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const canCommunicate = gang.CanCommunicate(user.Id);
                if (!canCommunicate) {
                    return warn(s.errorCommunicateGangPermission);
                }
                const text = interaction.options.getString("message", true);
                await gang.OfficialCommunication(user, text);
                const container = (0, ui_1.defaultComponent)({
                    color: GangColors_1.GangColor[gang.Color].Color,
                    description: `> ${text}\n${s.messageSent}`,
                    user,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            case CommandOption.Base: {
                await (0, discordInteractions_1.deferReply)(interaction);
                let gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const canEdit = gang.CanEdit(user.Id);
                if (!canEdit) {
                    return warn(s.errorEdittingGangPermission);
                }
                function getModifierText(modifier) {
                    const text = [];
                    if (!modifier) {
                        return "";
                    }
                    if (modifier.PrisonEscape?.Positive) {
                        text.push(`${emotes_1.EmoteString.Victory} +${modifier.PrisonEscape?.Positive}% ${s.prisonModifier} ${s.perLevelModifier} ${emotes_1.EmoteString.Escape}`);
                    }
                    if (modifier.Attack?.Positive) {
                        text.push(`${emotes_1.EmoteString.Victory}${emotes_1.EmoteString.Attack}+${modifier.Attack?.Positive} ATK ${s.perLevelModifier}`);
                    }
                    if (modifier.Defense?.Positive) {
                        text.push(`${emotes_1.EmoteString.Victory}${emotes_1.EmoteString.Defense}+${modifier.Defense?.Positive} DEF ${s.perLevelModifier}`);
                    }
                    return text.join("\n");
                }
                const BASE_COST = 1_000_000;
                function addBaseHeader() {
                    return new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `# ${s.gangBasesTitle}`,
                        s.gangBasesCost((0, ui_1.formatMoney)(BASE_COST, language)),
                    ])
                        .addLargeSeparator();
                }
                function generateDefaultContainer() {
                    const container = addBaseHeader();
                    const bases = (0, GangBases_1.getGangBases)().filter(base => base.Id !== GangBases_1.GangBaseId.None);
                    for (let i = 0; i < bases.length; i++) {
                        const base = bases[i];
                        container
                            .addSectionComponents(section => section
                            .addTexts([
                            `### ${base.Name[language]}`,
                            base.Description[language],
                        ])
                            .setThumbnailAccessory(thumb => thumb
                            .setURL(base.ImageUrl)))
                            .addSectionComponents(section => section
                            .addTexts([
                            getModifierText(base.Modifier),
                        ])
                            .setButtonAccessory(btn => btn
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setLabel(s.buy)
                            .setDisabled(gang.BaseId !== GangBases_1.GangBaseId.None)
                            .setCustomId(`buy${base.Id}`)));
                        if (i < bases.length - 1) {
                            container.addLargeSeparator();
                        }
                    }
                    container.addFooter({
                        text: `${gang.Name} • ${(0, ui_1.formatMoney)(gang.Money, language)}`,
                    });
                    return container;
                }
                let container = generateDefaultContainer();
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                let isProcessing = false;
                collector?.on("collect", async (btn) => {
                    if (isProcessing)
                        return;
                    isProcessing = true;
                    try {
                        await (0, discordInteractions_1.deferUpdate)(btn);
                        if (btn.customId === "back") {
                            container = generateDefaultContainer();
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        else if (btn.customId.startsWith("buy")) {
                            const baseId = Number(btn.customId.replace("buy", ""));
                            const base = GangBases_1.GangBases[baseId];
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
                                .setURL(base.ImageUrl)))
                                .addTexts([
                                getModifierText(base.Modifier),
                            ])
                                .addButtonRow(btn => btn
                                .setLabel(s.back)
                                .setCustomId("back")
                                .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                                .setStyle(discord_js_1.ButtonStyle.Success)
                                .setLabel(s.confirm)
                                .setDisabled(gang.Money < BASE_COST)
                                .setCustomId(`confirm${base.Id}`))
                                .addFooter({
                                text: `${gang.Name} • ${(0, ui_1.formatMoney)(gang.Money, language)}`,
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        else if (btn.customId.startsWith("confirm")) {
                            const baseId = Number(btn.customId.replace("confirm", ""));
                            const base = GangBases_1.GangBases[baseId];
                            gang = await Gang_1.Gang.GetById(gang.Id);
                            if (!gang) {
                                return;
                            }
                            if (gang.BaseId === base.Id) {
                                return;
                            }
                            if (gang.Money < BASE_COST) {
                                return warn(s.notEnoughMoneyBase((0, ui_1.formatMoney)(BASE_COST, language)));
                            }
                            gang.Money -= BASE_COST;
                            gang.BaseId = base.Id;
                            await gang.Update();
                            container = addBaseHeader()
                                .addSectionComponents(section => section
                                .addTexts([
                                s.baseBought(base.Name[language], gang.Name),
                            ])
                                .setThumbnailAccessory(thumb => thumb
                                .setURL(base.ImageUrl)))
                                .addFooter({
                                text: `${gang.Name} • ${(0, ui_1.formatMoney)(gang.Money, language)}`,
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                    }
                    finally {
                        isProcessing = false;
                    }
                });
                return;
            }
            case CommandOption.Deposit: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                let amount = interaction.options.getInteger("amount");
                if (amount === null) {
                    amount = Math.min(user.Money, Gang_1.Gang.MAX_DEPOSIT_PER_DAY * gang.Level);
                }
                if (amount <= 0) {
                    return warn(s.notEnoughMoneyDeposit((0, ui_1.formatMoney)(1, language)));
                }
                const { canDeposit, text } = await gang.CanDeposit(user, amount);
                if (!canDeposit) {
                    return warn(`${text} ${emotes_1.EmoteString.Gang}`);
                }
                const buttonConfirm = new discord_js_1.ButtonBuilder()
                    .setCustomId("confirm")
                    .setLabel(s.confirm)
                    .setStyle(discord_js_1.ButtonStyle.Success);
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents([buttonConfirm]);
                const container = (0, ui_1.defaultComponent)({
                    user,
                    color: GangColors_1.GangColor[gang.Color].Color,
                    description: s.confirmDeposit((0, ui_1.formatMoney)(amount, language), gang.Name),
                    buttons: row,
                });
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
                let responded = false;
                collector?.on("collect", async (btn) => {
                    responded = true;
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    const currentGang = await Gang_1.Gang.GetByUserId(user.Id);
                    if (!currentGang) {
                        return warn(s.notInGang);
                    }
                    await user.GetInfo();
                    const { canDeposit: canDepositAgain, text: failText } = await currentGang.CanDeposit(user, amount);
                    if (!canDepositAgain) {
                        return warn(`${failText} ${emotes_1.EmoteString.Gang}`);
                    }
                    if (btn.customId === "confirm") {
                        await currentGang.Deposit(user, amount);
                        const successContainer = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[currentGang.Color].Color,
                            description: s.depositSuccess((0, ui_1.formatMoney)(amount, language), currentGang.Name),
                            user,
                            footer: (0, ui_1.formatMoney)(user.Money, language),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, successContainer);
                    }
                });
                collector?.on("end", async () => {
                    if (responded)
                        return;
                    const endContainer = (0, ui_1.defaultComponent)({
                        color: GangColors_1.GangColor[gang.Color].Color,
                        description: s.noResponseDeposit(gang.Name),
                        user,
                    });
                    await (0, collectors_1.disableButtons)(interaction, endContainer);
                });
                return;
            }
            case CommandOption.CreateRole: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                if (user.Id !== gang.LeaderId) {
                    return warn(s.errorCreateRoleLeader);
                }
                const roleName = interaction.options.getString("name", true);
                const permissions = [];
                const getContainer = () => {
                    return new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `-# ${emotes_1.EmoteString.Gang} ${gang.Name}`,
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
                        .addButtonRow(btn => btn
                        .setLabel(s.permissionInvite)
                        .setCustomId("invite")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Invite) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionKick)
                        .setCustomId("kick")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Kick) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionPromote)
                        .setCustomId("promote")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Promote) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionEditGang)
                        .setCustomId("edit")
                        .setStyle(permissions.includes(Gang_1.GangPermission.EditGang) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionImportShipments)
                        .setCustomId("import_shipments")
                        .setStyle(permissions.includes(Gang_1.GangPermission.ImportShipments) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary))
                        .addButtonRow(btn => btn
                        .setLabel(s.confirm)
                        .setCustomId("confirm")
                        .setStyle(discord_js_1.ButtonStyle.Success))
                        .addFooter();
                };
                let container = getContainer();
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId === "confirm") {
                        const success = await gang.CreateRole(user.Id, roleName, permissions);
                        if (!success) {
                            return warn(s.errorCreateRole);
                        }
                        container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successCreateRole(roleName),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    const permissionMap = {
                        invite: Gang_1.GangPermission.Invite,
                        kick: Gang_1.GangPermission.Kick,
                        promote: Gang_1.GangPermission.Promote,
                        edit: Gang_1.GangPermission.EditGang,
                        import_shipments: Gang_1.GangPermission.ImportShipments,
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
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.ChangeRole: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const targetUserInput = interaction.options.getString("user", true);
                const target = await (0, userUtils_1.searchUser)(targetUserInput, interaction);
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
                    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `-# ${emotes_1.EmoteString.Gang} ${gang.Name}`,
                    ])
                        .addLargeSeparator()
                        .addTexts([
                        `# ${s.changeRoleTitle}`,
                        s.changeRoleDescription(target.Nickname, currentRole?.Name || "???"),
                    ])
                        .addLargeSeparator();
                    const rows = [];
                    let currentRow = [];
                    for (const role of roles) {
                        const btn = new discord_js_1.ButtonBuilder()
                            .setLabel(role.Name)
                            .setCustomId(`role_${role.Id}`)
                            .setStyle(role.Id === member.RoleId ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary)
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
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response, { maxClicks: 1 });
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId.startsWith("role_")) {
                        const roleId = parseInt(btn.customId.split("_")[1]);
                        const success = await gang.ChangeRole(user.Id, target.Id, roleId);
                        if (!success) {
                            return warn(s.errorChangeRole);
                        }
                        const newRole = roles.find(r => r.Id === roleId);
                        container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successChangeRole(target.Nickname, newRole?.Name || "???"),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.EditRole: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
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
                const permissions = [...role.Permissions];
                const targetName = newRoleName || role.Name;
                const getContainer = () => {
                    return new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `# ${s.editRoleTitle}`,
                        s.editRoleDescription(role.Name, targetName),
                    ])
                        .addLargeSeparator()
                        .addTexts([
                        `### ${s.permissions}`,
                    ])
                        .addButtonRow(btn => btn
                        .setLabel(s.permissionInvite)
                        .setCustomId("invite")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Invite) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionKick)
                        .setCustomId("kick")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Kick) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionPromote)
                        .setCustomId("promote")
                        .setStyle(permissions.includes(Gang_1.GangPermission.Promote) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionEditGang)
                        .setCustomId("edit")
                        .setStyle(permissions.includes(Gang_1.GangPermission.EditGang) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary), btn => btn
                        .setLabel(s.permissionImportShipments)
                        .setCustomId("import_shipments")
                        .setStyle(permissions.includes(Gang_1.GangPermission.ImportShipments) ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary))
                        .addButtonRow(btn => btn
                        .setLabel(s.confirm)
                        .setCustomId("confirm")
                        .setStyle(discord_js_1.ButtonStyle.Success))
                        .addFooter();
                };
                let container = getContainer();
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId === "confirm") {
                        const success = await gang.EditRole(user.Id, role.Id, permissions, newRoleName);
                        if (!success) {
                            return warn(s.errorEditRole);
                        }
                        container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successEditRole(targetName),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    const permissionMap = {
                        invite: Gang_1.GangPermission.Invite,
                        kick: Gang_1.GangPermission.Kick,
                        promote: Gang_1.GangPermission.Promote,
                        edit: Gang_1.GangPermission.EditGang,
                        import_shipments: Gang_1.GangPermission.ImportShipments,
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
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.Transfer: {
                await (0, discordInteractions_1.deferReply)(interaction);
                const gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                if (user.Id !== gang.LeaderId) {
                    return warn(s.errorMustBeLeader);
                }
                const targetUserInput = interaction.options.getString("user", true);
                const target = await (0, userUtils_1.searchUser)(targetUserInput, interaction);
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
                    return new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `-# ${emotes_1.EmoteString.Gang} ${gang.Name}`,
                    ])
                        .addLargeSeparator()
                        .addTexts([
                        `# ${s.transferTitle}`,
                        s.transferDescription(target.GetNameWithImage()),
                    ])
                        .addButtonRow(btn => btn
                        .setLabel(s.confirm)
                        .setCustomId("confirm")
                        .setStyle(discord_js_1.ButtonStyle.Success))
                        .addFooter();
                };
                let container = getContainer();
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                const collector = (0, collectors_1.createButtonCollector)(interaction, response, { idleTime: 60_000, maxClicks: 1 });
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId === "confirm") {
                        const success = await gang.TransferLeadership(user, target);
                        if (!success) {
                            return warn(s.errorTransferLeadership);
                        }
                        container = (0, ui_1.defaultComponent)({
                            color: GangColors_1.GangColor[gang.Color].Color,
                            description: s.successTransferLeadership(target.GetNameWithImage()),
                            user,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
            case CommandOption.Roles: {
                await (0, discordInteractions_1.deferReply)(interaction);
                let gang = await Gang_1.Gang.GetByUserId(user.Id);
                if (!gang) {
                    return warn(s.notInGang);
                }
                const isLeader = user.Id === gang.LeaderId;
                const getContainer = () => {
                    const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                        .setUser(user)
                        .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
                        .addTexts([
                        `# ${s.rolesTitle(gang.Name)}`,
                    ])
                        .addLargeSeparator();
                    const roles = gang.Roles.sort((a, b) => b.Permissions.length - a.Permissions.length);
                    for (const role of roles) {
                        const permissions = role.Permissions.map(p => {
                            const key = `permission${Gang_1.GangPermission[p]}`;
                            return s[key];
                        }).join(", ") || s.noPermissions;
                        const memberCount = gang.Members.filter(m => m.RoleId === role.Id).length;
                        const canDelete = isLeader &&
                            !Gang_1.Gang.RESERVED_ROLE_NAMES.map(n => n.toLowerCase()).includes(role.Name.toLowerCase()) &&
                            gang.Members.find(m => m.UserId === gang.LeaderId)?.RoleId !== role.Id;
                        container.addSectionComponents(section => section
                            .addTexts([
                            `### ${role.Name}`,
                            `-# ${s.permissions}: ${permissions}`,
                            `-# ${s.membersWithRole}: ${memberCount}`,
                        ])
                            .setButtonAccessory(btn => btn
                            .setLabel(s.delete)
                            .setCustomId(`delete_role_${role.Id}`)
                            .setStyle(discord_js_1.ButtonStyle.Danger)
                            .setDisabled(!canDelete)));
                    }
                    container.addFooter();
                    return container;
                };
                let container = getContainer();
                const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                if (!isLeader)
                    return;
                const collector = (0, collectors_1.createButtonCollector)(interaction, response);
                collector?.on("collect", async (btn) => {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    const freshGang = await Gang_1.Gang.GetByUserId(user.Id);
                    if (!freshGang)
                        return warn(s.notInGang);
                    gang = freshGang;
                    if (btn.customId.startsWith("delete_role_")) {
                        const roleId = parseInt(btn.customId.split("_")[2]);
                        const role = gang.Roles.find(r => r.Id === roleId);
                        if (!role)
                            return;
                        container = new CustomContainerBuilder_1.CustomContainerBuilder()
                            .setUser(user)
                            .setAccentColor(discord_js_1.Colors.Red)
                            .addTexts([s.confirmDeleteRole(role.Name)])
                            .addButtonRow(b => b
                            .setCustomId(`confirm_delete_${roleId}`)
                            .setLabel(s.confirm)
                            .setStyle(discord_js_1.ButtonStyle.Danger), b => b
                            .setCustomId("cancel_delete")
                            .setLabel(s.cancel)
                            .setStyle(discord_js_1.ButtonStyle.Secondary))
                            .addFooter();
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    if (btn.customId.startsWith("confirm_delete_")) {
                        const roleId = parseInt(btn.customId.split("_")[2]);
                        const success = await gang.DeleteRole(user.Id, roleId);
                        if (!success) {
                            return warn(s.errorDeleteRole);
                        }
                        const updatedGang = await Gang_1.Gang.GetByUserId(user.Id);
                        if (!updatedGang)
                            return warn(s.notInGang);
                        gang = updatedGang;
                        container = getContainer();
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    if (btn.customId === "cancel_delete") {
                        container = getContainer();
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                });
                collector?.on("end", async () => {
                    await (0, collectors_1.disableButtons)(interaction, container);
                });
                return;
            }
        }
        async function checkGangExists(name, acronym) {
            if (name) {
                const existingGang = await Gang_1.Gang.CheckGangWithName(name);
                if (existingGang) {
                    await warn(s.gangAlreadyExistsName(name));
                    return true;
                }
            }
            if (acronym) {
                const existingGang = await Gang_1.Gang.CheckGangWithAcronym(acronym.toUpperCase());
                if (existingGang) {
                    await warn(s.gangAlreadyExistsAcronym(acronym.toUpperCase()));
                    return true;
                }
            }
            return false;
        }
        function validateGangName(name) {
            const regex = /^[a-zA-Z0-9\s]+$/;
            return regex.test(name);
        }
        function validateImageUrl(url) {
            const regex = /^https:\/\/.*\.(jpg|jpeg|png|webp)$/i;
            return !regex.test(url);
        }
        function warn(text) {
            const container = (0, ui_1.defaultComponent)({
                color: discord_js_1.Colors.Red,
                description: text,
                user,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container, true);
        }
    },
};
const Strings = {
    [Language_1.Language.English]: {
        gangTitle: `Gangs`,
        gangDescription: `Create your gang and work as a team! Participate in group robberies and ~~gang fights~~!\n\n**Cost to create a gang: ${(0, ui_1.formatMoney)(Gang_1.Gang.CREATION_COST, Language_1.Language.English)}**`,
        gangNotFoundByName: (name) => `No gang found with name or acronym **${name}** ${emotes_1.EmoteString.Gang}`,
        notInGang: `You are not in a gang! To see a specific gang, use the \`gang info\` command ${emotes_1.EmoteString.Gang}`,
        errorGettingGang: `Error retrieving gang information ${emotes_1.EmoteString.Gang}`,
        errorSearchingGang: `Error while searching for gang ${emotes_1.EmoteString.Gang}`,
        name: `Name`,
        acronym: `Acronym`,
        level: `Level`,
        totalInBalance: "Total in balance",
        members: `Members`,
        created: `Created`,
        description: `Description`,
        color: `Color`,
        image: `Image`,
        gangId: (id) => `Gang Id: ${id}`,
        gangAlreadyExistsName: (name) => `A gang with the name **${name}** already exists ${emotes_1.EmoteString.Gang}`,
        gangAlreadyExistsAcronym: (acronym) => `A gang with the acronym **${acronym}** already exists ${emotes_1.EmoteString.Gang}`,
        alreadyInGang: `You are already in a gang! You need to leave your current gang before creating a new one ${emotes_1.EmoteString.Gang}`,
        userAlreadyInGang: (user) => `**${user.GetNameWithImage()}** is already in a gang ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyCreate: (cost) => `You don't have enough money to create a gang! It costs ${cost} ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyBase: (cost) => `Your gang don't have enough money balance to buy a base! It costs ${cost} ${emotes_1.EmoteString.Gang}`,
        lettersAndNumbers: `Gang name can only contain letters and numbers ${emotes_1.EmoteString.Gang}`,
        invalidURLImage: `Invalid image URL! Please provide a valid image URL ending with .jpg, .jpeg, .webp or .png ${emotes_1.EmoteString.Gang}`,
        errorCreatingGang: `Error while creating the gang. Try again later ${emotes_1.EmoteString.Gang}`,
        gangCreated: `Gang created successfully! ${emotes_1.EmoteString.Gang}`,
        gangCreatedDetails: (name, cost) => `You've created the gang **${name}** for ${cost} ${emotes_1.EmoteString.Gang}\n-# Use \`/gang info\` to see more details about your gang.`,
        gangEditted: `Gang editted successfully! ${emotes_1.EmoteString.Gang}`,
        errorEdittingGang: `Error while editting the gang. Try again later ${emotes_1.EmoteString.Gang}`,
        errorEdittingGangPermission: `You don't have permission to edit the gang ${emotes_1.EmoteString.Gang}`,
        errorInviteGangPermission: `You don't have permission to invite users to the gang ${emotes_1.EmoteString.Gang}`,
        errorInviteGangYourself: `You cannot invite yourself to the gang ${emotes_1.EmoteString.Gang}`,
        errorInviteGangGeneric: `Error inviting user to the gang. Please try again later ${emotes_1.EmoteString.Gang}`,
        successInviteGang: (nickname, gangName) => `**${nickname}** has been invited to the gang **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        confirm: `Confirm`,
        confirmLeave: (gangName) => `Confirm leaving the gang **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorLeaveGang: `Error leaving the gang. Please try again later ${emotes_1.EmoteString.Gang}`,
        errorLeaveGangLeader: `You cannot leave the gang as the leader. You need to transfer leadership or be the only member ${emotes_1.EmoteString.Gang}`,
        successLeaveGang: (gangName) => `You have left gang **${gangName}** successfully ${emotes_1.EmoteString.Gang}`,
        noResponseLeaveGang: (gangName) => `You took too long to respond and did not leave gang **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDisband: (gangName) => `Are you sure you want to disband the gang **${gangName}**? This action cannot be undone and all gang progress will be lost. ${emotes_1.EmoteString.Gang}`,
        successDisband: (gangName) => `The gang **${gangName}** has been disbanded successfully ${emotes_1.EmoteString.Gang}`,
        errorDisbandGang: `Error while disbanding the gang. Try again later ${emotes_1.EmoteString.Gang}`,
        confirmKick: (nickname, gangName) => `Are you sure you want to kick **${nickname}** from the gang **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorKickGangPermission: `You don't have permission to kick users from the gang ${emotes_1.EmoteString.Gang}`,
        errorKickGangYourself: `You cannot kick yourself from the gang ${emotes_1.EmoteString.Gang}`,
        errorKickGangLeader: `You cannot kick the gang leader ${emotes_1.EmoteString.Gang}`,
        errorKickGang: (nickname, gangName) => `Error kicking **${nickname}** from the gang **${gangName}**. Please try again later ${emotes_1.EmoteString.Gang}`,
        successKickGang: (nickname, gangName) => `**${nickname}** has been kicked from the gang **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        noResponseKickGang: (nickname, gangName) => `You took too long to respond and did not kick **${nickname}** from the gang **${gangName}** ${emotes_1.EmoteString.Gang}`,
        errorCommunicateGangPermission: `You don't have permission to communicate with gang members ${emotes_1.EmoteString.Gang}`,
        messageSent: `Message sent to gang members! ${emotes_1.EmoteString.Gang}`,
        prisonModifier: `chance of escaping from prison`,
        perLevelModifier: "per gang level",
        gangBasesTitle: `Gang Bases`,
        gangBasesCost: (cost) => `Bases cost ${cost} from the gang balance`,
        buy: `Buy`,
        back: `Back`,
        baseBought: (baseName, gangName) => `You bought the base **${baseName}** for the gang **${gangName}** ${emotes_1.EmoteString.Gang}`,
        depositSuccess: (amount, gangName) => `You deposited **${amount}** into the gang **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDeposit: (amount, gangName) => `Are you sure you want to deposit **${amount}** into the gang **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        noResponseDeposit: (gangName) => `You took too long to respond and did not deposit into the gang **${gangName}** ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyDeposit: (amount) => `You don't have **${amount}** to deposit`,
        deposits: "Deposits",
        canDeposit: "Can deposit",
        canDepositAgain: "Can deposit again",
        createRoleTitle: "Create Role",
        createRoleDescription: (name) => `Creating role **${name}**. Select the permissions below:`,
        permissions: "Permissions",
        permissionInvite: "Invite Members",
        permissionKick: "Kick Members",
        permissionPromote: "Promote Members",
        permissionEditGang: "Edit Gang",
        permissionImportShipments: "Import Shipments",
        errorCreateRoleLeader: `Only the leader can create roles ${emotes_1.EmoteString.Gang}`,
        errorCreateRole: `Error creating role. Please try again later ${emotes_1.EmoteString.Gang}`,
        successCreateRole: (name) => `Role **${name}** created successfully! ${emotes_1.EmoteString.Gang}`,
        changeRoleTitle: "Change Role",
        changeRoleDescription: (user, currentRole) => `Changing role for **${user}**.\nCurrent role: **${currentRole}**`,
        userNotInGang: (user) => `**${user}** is not in your gang ${emotes_1.EmoteString.Gang}`,
        errorChangeRole: `Error changing role. Please try again later ${emotes_1.EmoteString.Gang}`,
        successChangeRole: (user, role) => `Role for **${user}** changed to **${role}** successfully! ${emotes_1.EmoteString.Gang}`,
        errorChangeRoleLeader: `You cannot change the role of the leader ${emotes_1.EmoteString.Gang}`,
        editRoleTitle: "Edit Role",
        editRoleDescription: (oldName, newName) => `Editing role **${oldName}**${oldName !== newName ? ` to **${newName}**` : ""}. Select the permissions below:`,
        errorEditRoleLeader: `Only the leader can edit roles ${emotes_1.EmoteString.Gang}`,
        roleNotFound: (name) => `Role **${name}** not found in your gang ${emotes_1.EmoteString.Gang}`,
        errorEditRole: `Error editing role. Please try again later ${emotes_1.EmoteString.Gang}`,
        successEditRole: (name) => `Role **${name}** edited successfully! ${emotes_1.EmoteString.Gang}`,
        rolesTitle: (name) => `Roles of ${name}`,
        membersWithRole: "Members",
        delete: "Delete",
        noPermissions: "No permissions",
        confirmDeleteRole: (name) => `Are you sure you want to delete the role **${name}**?\n-# Members with this role will be reassigned to the default **Member** role.`,
        errorDeleteRole: `Error deleting role. It might be a protected role (like Leader or Member) or another error occurred.`,
        cancel: "Cancel",
        transferTitle: "Transfer Leadership",
        transferDescription: (target) => `Are you sure you want to transfer the leadership of the gang to **${target}**?\n-# This action cannot be undone. You'll become a regular Member.`,
        errorMustBeLeader: `Only the leader can transfer the leadership of the gang ${emotes_1.EmoteString.Gang}`,
        errorCantTransferToSelf: `You can't transfer the leadership to yourself ${emotes_1.EmoteString.Gang}`,
        errorTransferLeadership: `Error transferring the leadership. Please try again later ${emotes_1.EmoteString.Gang}`,
        successTransferLeadership: (target) => `You've successfully transferred the leadership of the gang to **${target}**! ${emotes_1.EmoteString.Gang}`,
        robInvestment: "Robbery to investment",
        inProgress: "in progress",
        finished: "finished",
        robberyInitiated: (invName, targetName) => `Organizing robbery against ${emotes_1.EmoteString.InvestmentActive} **${invName}** from **${targetName}**`,
        robberyAttempting: (invName, targetName) => `Attempting to rob ${emotes_1.EmoteString.InvestmentActive} **${invName}** from **${targetName}** ${emotes_1.EmoteString.Waiting}`,
        participants: (count) => `Participants: ${count}`,
        participate: "Join",
        abortRobbery: "Abort robbery",
        autoStartRobbery: (seconds) => `Starts automatically in ${seconds} seconds.`,
        alreadyIn: "You are already participating.",
        reason: (type) => {
            const reasons = {
                [InvestmentRobbery_1.InvestmentRobberyReason.NoPermission]: "You don't have permission to start a robbery.",
                [InvestmentRobbery_1.InvestmentRobberyReason.CantRobYourself]: "You can't rob your own investment.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderNotIdling]: "You need to be idling to start a robbery.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetSameGang]: "The target is in your gang.",
                [InvestmentRobbery_1.InvestmentRobberyReason.WithoutItem]: "You can't rob without a weapon!",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutNick]: "The target doesn't have a nickname.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutClass]: "The target doesn't have a class.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetAlreadyUnderAttack]: "The target is already being attacked.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoInvestment]: "The target doesn't have an investment.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoYield]: "The target's investment has no profit.",
                [InvestmentRobbery_1.InvestmentRobberyReason.NotInGang]: "You are not in this gang.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateNotIdling]: "You must be idling to participate.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderIsWanted]: "You are wanted by the police and cannot start a robbery.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateIsWanted]: "You are wanted by the police and cannot participate.",
            };
            return reasons[type] || "Unknown error while starting the robbery.";
        },
        onlyLeaderCanAbort: "Only the user who started the robbery can abort it.",
        robberyAborted: (user) => `The robbery has been aborted by **${user}**.`,
        defendDMTitle: "Investment Attack!",
        defendDMDescription: (gangName, invName) => `The gang **${gangName}** is attacking your investment **${invName}**! You can defend, gaining ${emotes_1.EmoteString.Defense}+5 DEF, but if you lose, you'll be hospitalized for 30 minutes.`,
        defend: "Defend",
        youMustBeIdling: `You must be ${emotes_1.EmoteString.Idle} idling to join the defense.`,
        defendingSuccess: "You are now defending your investment! Await results.",
        chance: "Success chance",
        successWin: "Success",
        stolen: "Stolen for gang bank",
        expGained: "Gang EXP gained",
        henchmanHospitalized: "The henchman was hospitalized.",
        defenderHospitalized: (name, date) => `**${name}** was hospitalized! Will be cured ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        youWereHospitalized: (date) => `You were hospitalized! Will be cured ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        failureLose: "Failure",
        attackersImprisoned: (hours) => `All attackers were sent to prison!\n-# They will be free ${(0, discord_js_1.time)((0, date_fns_1.addHours)(Date.now(), hours), discord_js_1.TimestampStyles.RelativeTime)}`,
        attackersHospitalized: "Also hospitalized for 30 minutes.",
        waitingForTarget: `Robbery in progress ${emotes_1.EmoteString.Waiting}`,
        targetIsDefending: (name) => `**${name}** is defending! ${emotes_1.EmoteString.Defense}`,
        targetHasHenchman: `Target has an active henchman`,
        nextYield: "Next profit",
        robberyResultLost: (gangName) => `${emotes_1.EmoteString.Gang} Gang **${gangName}** robbed your investment!`,
        robberyResultWon: "You successfully defended your investment!",
        henchmanStillActive: "Your henchman protected you and remains active!",
        robberyCooldown: (date) => `${emotes_1.EmoteString.Police} The police is searching for your gang. You can rob again ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        importTitle: "Gang import",
        importReady: (cost, time, chance) => `Ready to start a new item import.\n\n- **Cost:** ${cost}\n- **Wait time:** ${time}h\n- **Success chance:** ${chance}`,
        importActive: `A import is currently in transit.`,
        importInfoArrivesIn: (time) => `Arrives ${time}`,
        importInfoSuccessChance: (chance) => `Success chance: ${chance}`,
        importCooldown: (time) => `Your gang recently had a successful import.\n-# Next one available ${time}.`,
        importCancelCooldown: (time) => `Your gang recently cancelled an import.\n-# Next one available ${time}.`,
        startImport: "Start import",
        cancelImport: "Cancel import",
        confirmCancelImport: (refund) => `Are you sure you want to cancel the active import? You will receive a partial refund of **${refund}**.`,
        successStartImport: (time) => `Import started! It will arrive ${time}.`,
        successCancelImport: (refund) => `Import cancelled. **${refund}** has been refunded to the gang treasury.`,
        onlyLeaderImport: "Only the gang leader can start or cancel imports.",
        importReason: (type, data = {}) => {
            const reasons = {
                [Gang_1.GangImportFailureReason.NoBase]: "Your gang must have a base to import items.",
                [Gang_1.GangImportFailureReason.ActiveImport]: "There is already an active import in transit.",
                [Gang_1.GangImportFailureReason.Cooldown]: `You must wait until ${data.time} to start another import.`,
                [Gang_1.GangImportFailureReason.CancelCooldown]: `You cancelled an import recently. You must wait until ${data.time} to start another.`,
                [Gang_1.GangImportFailureReason.NotEnoughMoney]: `The gang treasury does not have enough money. Cost: ${data.cost}`,
            };
            return reasons[type] || "Unknown error while starting the import.";
        },
        gangHasNoBase: "Your gang must have a base to start an import.",
        importDescription: "Import weapons and equipment from abroad. With luck, the shipment will arrive and all members will receive items!",
    },
    [Language_1.Language.Portuguese]: {
        gangTitle: `Gangues`,
        gangDescription: `Crie sua gangue e trabalhe em equipe! Participe de assaltos em grupo e ~~lutas generalizadas~~!\n\n**Custo para criar uma gangue: ${(0, ui_1.formatMoney)(Gang_1.Gang.CREATION_COST, Language_1.Language.Portuguese)}**`,
        gangNotFoundByName: (name) => `Nenhuma gangue encontrada com o nome ou acrônimo **${name}** ${emotes_1.EmoteString.Gang}`,
        notInGang: `Você não está em uma gangue! Para ver uma gangue específica, use o comando \`gangue info\` ${emotes_1.EmoteString.Gang}`,
        errorGettingGang: `Erro ao buscar informações da gangue ${emotes_1.EmoteString.Gang}`,
        errorSearchingGang: `Erro ao procurar pela gangue ${emotes_1.EmoteString.Gang}`,
        name: `Nome`,
        acronym: `Acrônimo`,
        level: `Nível`,
        totalInBalance: "Total em caixa",
        members: `Membros`,
        created: `Criada em`,
        description: `Descrição`,
        color: `Cor`,
        image: `Imagem`,
        gangId: (id) => `Id da Gangue: ${id}`,
        gangAlreadyExistsName: (name) => `Uma gangue com o nome **${name}** já existe ${emotes_1.EmoteString.Gang}`,
        gangAlreadyExistsAcronym: (acronym) => `Uma gangue com o acrônimo **${acronym}** já existe ${emotes_1.EmoteString.Gang}`,
        alreadyInGang: `Você já está em uma gangue! Você precisa sair da sua gangue atual antes de criar uma nova ${emotes_1.EmoteString.Gang}`,
        userAlreadyInGang: (user) => `**${user.GetNameWithImage()}** já está em uma gangue ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyCreate: (cost) => `Você não tem dinheiro suficiente para criar uma gangue! Custa ${cost} ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyBase: (cost) => `Sua gangue não tem dinheiro suficiente no caixa para comprar uma base! Custa ${cost} ${emotes_1.EmoteString.Gang}`,
        lettersAndNumbers: `Nome da gangue só pode conter letras e números ${emotes_1.EmoteString.Gang}`,
        invalidURLImage: `URL de imagem inválida! Por favor, forneça uma URL de imagem válida terminando com .jpg, .jpeg, .webp ou .png. ${emotes_1.EmoteString.Gang}`,
        errorCreatingGang: `Erro ao criar a gangue. Tente novamente mais tarde. ${emotes_1.EmoteString.Gang}`,
        gangCreated: `Gangue criada com sucesso! ${emotes_1.EmoteString.Gang}`,
        gangCreatedDetails: (name, cost) => `Você criou a gangue **${name}** por ${cost} ${emotes_1.EmoteString.Gang}\n-# Use \`/gang info\` para ver mais detalhes sobre sua gangue.`,
        gangEditted: `Gangue editada com sucesso! ${emotes_1.EmoteString.Gang}`,
        errorEdittingGang: `Erro ao editar a gangue. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        errorEdittingGangPermission: `Você não possui permissão para editar a gangue ${emotes_1.EmoteString.Gang}`,
        errorInviteGangPermission: `Você não possui permissão para convidar usuários para a gangue ${emotes_1.EmoteString.Gang}`,
        errorInviteGangYourself: `Você não pode convidar a si mesmo para a gangue ${emotes_1.EmoteString.Gang}`,
        errorInviteGangGeneric: `Erro ao convidar usuário para a gangue. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successInviteGang: (nickname, gangName) => `**${nickname}** foi convidado para a gangue **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        confirm: `Confirmar`,
        confirmLeave: (gangName) => `Confirmar saída da gangue **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorLeaveGang: `Erro ao sair da gangue. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        errorLeaveGangLeader: `Você não pode sair da gangue como líder. Você precisa transferir a liderança ou ser o único membro ${emotes_1.EmoteString.Gang}`,
        successLeaveGang: (gangName) => `Você saiu da gangue **${gangName}** com sucesso ${emotes_1.EmoteString.Gang}`,
        noResponseLeaveGang: (gangName) => `Você demorou para responder e não saiu da gangue **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDisband: (gangName) => `Tem certeza que deseja dissolver a gangue **${gangName}**? Esta ação não pode ser desfeita e todo o progresso da gangue será perdido. ${emotes_1.EmoteString.Gang}`,
        successDisband: (gangName) => `A gangue **${gangName}** foi dissolvida com sucesso ${emotes_1.EmoteString.Gang}`,
        errorDisbandGang: `Erro ao dissolver a gangue. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        confirmKick: (nickname, gangName) => `Você tem certeza que deseja expulsar **${nickname}** da gangue **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorKickGangPermission: `Você não possui permissão para expulsar usuários da gangue ${emotes_1.EmoteString.Gang}`,
        errorKickGangYourself: `Você não pode expulsar a si mesmo da gangue ${emotes_1.EmoteString.Gang}`,
        errorKickGangLeader: `Você não pode expulsar o líder da gangue ${emotes_1.EmoteString.Gang}`,
        errorKickGang: (nickname, gangName) => `Erro ao expulsar **${nickname}** da gangue **${gangName}**. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successKickGang: (nickname, gangName) => `**${nickname}** foi expulso da gangue **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        noResponseKickGang: (nickname, gangName) => `Você demorou para responder e não expulsou **${nickname}** da gangue **${gangName}** ${emotes_1.EmoteString.Gang}`,
        errorCommunicateGangPermission: `Você não possui permissão para comunicar com os membros da gangue ${emotes_1.EmoteString.Gang}`,
        messageSent: `Mensagem enviada para os membros da gangue! ${emotes_1.EmoteString.Gang}`,
        prisonModifier: `chance de fugir da prisão`,
        perLevelModifier: "por nível da gangue",
        gangBasesTitle: `Bases de Gangue`,
        gangBasesCost: (cost) => `Bases custam ${cost} do caixa da gangue`,
        buy: `Comprar`,
        back: `Voltar`,
        baseBought: (baseName, gangName) => `Você comprou a base **${baseName}** para a gangue **${gangName}** ${emotes_1.EmoteString.Gang}`,
        depositSuccess: (amount, gangName) => `Você depositou **${amount}** na gangue **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDeposit: (amount, gangName) => `Tem certeza de que deseja depositar **${amount}** na gangue **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        noResponseDeposit: (gangName) => `Você demorou para responder e não depositou na gangue **${gangName}** ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyDeposit: (amount) => `Você não tem **${amount}** para depositar`,
        deposits: "Depósitos",
        canDeposit: "Pode depositar",
        canDepositAgain: "Pode depositar novamente",
        createRoleTitle: "Criar Cargo",
        createRoleDescription: (name) => `Criando cargo **${name}**. Selecione as permissões abaixo:`,
        permissions: "Permissões",
        permissionInvite: "Convidar Membros",
        permissionKick: "Expulsar Membros",
        permissionPromote: "Promover Membros",
        permissionEditGang: "Editar Gangue",
        permissionImportShipments: "Importar Carregamentos",
        errorCreateRoleLeader: `Apenas o líder pode criar cargos ${emotes_1.EmoteString.Gang}`,
        errorCreateRole: `Erro ao criar cargo. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successCreateRole: (name) => `Cargo **${name}** criado com sucesso! ${emotes_1.EmoteString.Gang}`,
        changeRoleTitle: "Mudar Cargo",
        changeRoleDescription: (user, currentRole) => `Mudando cargo de **${user}**.\nCargo atual: **${currentRole}**`,
        userNotInGang: (user) => `**${user}** não está na sua gangue ${emotes_1.EmoteString.Gang}`,
        errorChangeRole: `Erro ao mudar cargo. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successChangeRole: (user, role) => `Cargo de **${user}** alterado para **${role}** com sucesso! ${emotes_1.EmoteString.Gang}`,
        errorChangeRoleLeader: `Você não pode mudar o cargo do líder ${emotes_1.EmoteString.Gang}`,
        editRoleTitle: "Editar Cargo",
        editRoleDescription: (oldName, newName) => `Editando cargo **${oldName}**${oldName !== newName ? ` para **${newName}**` : ""}. Selecione as permissões abaixo:`,
        errorEditRoleLeader: `Apenas o líder pode editar cargos ${emotes_1.EmoteString.Gang}`,
        roleNotFound: (name) => `Cargo **${name}** não encontrado na sua gangue ${emotes_1.EmoteString.Gang}`,
        errorEditRole: `Erro ao editar cargo. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successEditRole: (name) => `Cargo **${name}** editado com sucesso! ${emotes_1.EmoteString.Gang}`,
        rolesTitle: (name) => `Cargos de ${name}`,
        membersWithRole: "Membros",
        delete: "Deletar",
        noPermissions: "Nenhuma permissão",
        confirmDeleteRole: (name) => `Você tem certeza que quer deletar o cargo **${name}**?\n-# Membros com este cargo serão movidos para o cargo padrão de **Membro**.`,
        errorDeleteRole: `Erro ao deletar cargo. Pode ser um cargo protegido (como Líder ou Membro) ou outro erro ocorreu.`,
        cancel: "Cancelar",
        transferTitle: "Transferir Liderança",
        transferDescription: (target) => `Você tem certeza que deseja transferir a liderança da gangue para **${target}**?\n-# Esta ação não pode ser desfeita. Você se tornará um Membro regular.`,
        errorMustBeLeader: `Apenas o líder pode transferir a liderança da gangue ${emotes_1.EmoteString.Gang}`,
        errorCantTransferToSelf: `Você não pode transferir a liderança para si mesmo ${emotes_1.EmoteString.Gang}`,
        errorTransferLeadership: `Erro ao transferir a liderança. Tente novamente mais tarde ${emotes_1.EmoteString.Gang}`,
        successTransferLeadership: (target) => `Você transferiu a liderança da gangue para **${target}** com sucesso! ${emotes_1.EmoteString.Gang}`,
        robInvestment: "Roubo à investimento",
        inProgress: "em andamento",
        finished: "finalizado",
        robberyInitiated: (invName, targetName) => `Organizando roubo contra ${emotes_1.EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${emotes_1.EmoteString.Waiting}`,
        robberyAttempting: (invName, targetName) => `Tentando roubar ${emotes_1.EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${emotes_1.EmoteString.Waiting}`,
        participants: (count) => `Participantes: ${count}`,
        participate: "Participar",
        abortRobbery: "Abortar roubo",
        autoStartRobbery: (seconds) => `Inicia automaticamente em ${seconds} segundos.`,
        alreadyIn: "Você já está participando.",
        reason: (type) => {
            const reasons = {
                [InvestmentRobbery_1.InvestmentRobberyReason.NoPermission]: "Você não tem permissão para iniciar um roubo.",
                [InvestmentRobbery_1.InvestmentRobberyReason.CantRobYourself]: "Você não pode roubar seu próprio investimento.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderNotIdling]: "Você precisa estar vadiando para iniciar um roubo.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetSameGang]: "O alvo está na sua gangue.",
                [InvestmentRobbery_1.InvestmentRobberyReason.WithoutItem]: "Você não pode roubar sem uma arma.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutNick]: "O alvo não tem um nickname.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutClass]: "O alvo não tem uma classe.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetAlreadyUnderAttack]: "O alvo já está sendo atacado.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoInvestment]: "O alvo não tem um investimento.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoYield]: "O investimento do alvo não tem lucros.",
                [InvestmentRobbery_1.InvestmentRobberyReason.NotInGang]: "Você não está nesta gangue.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateNotIdling]: "Você precisa estar vadiando para participar.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderIsWanted]: "Você está sendo procurado pela polícia e não pode iniciar um assalto.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateIsWanted]: "Você está sendo procurado pela polícia e não pode participar.",
            };
            return reasons[type] || "Erro desconhecido ao iniciar o roubo.";
        },
        onlyLeaderCanAbort: "Apenas quem iniciou o roubo pode abortá-lo.",
        robberyAborted: (user) => `O roubo foi abortado por **${user}**`,
        defendDMTitle: "Ataque ao Investimento!",
        defendDMDescription: (gangName, invName) => `A gangue **${gangName}** está atacando o seu investimento **${invName}**! Você pode defender, ganhando ${emotes_1.EmoteString.Defense}+5 DEF, mas se perder, será hospitalizado por 30 minutos.`,
        defend: "Defender",
        youMustBeIdling: `Você precisa estar ${emotes_1.EmoteString.Idle} Vadiando para defender.`,
        defendingSuccess: "Você está ajudando na defesa! Aguarde os resultados.",
        chance: "Chance de sucesso",
        successWin: "Sucesso",
        stolen: "Roubado para o caixa da gangue",
        expGained: "EXP ganho pela gangue",
        henchmanHospitalized: "O capanga foi hospitalizado.",
        defenderHospitalized: (name, date) => `**${name}** foi hospitalizado! Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        youWereHospitalized: (date) => `Você foi hospitalizado! Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        failureLose: "Falha",
        attackersImprisoned: (hours) => `Todos os atacantes foram presos!\n-# Eles serão liberados ${(0, discord_js_1.time)((0, date_fns_1.addHours)(Date.now(), hours), discord_js_1.TimestampStyles.RelativeTime)}`,
        attackersHospitalized: "Também foram hospitalizados por 30 minutos.",
        targetIsDefending: (name) => `**${name}** está defendendo! ${emotes_1.EmoteString.Defense}`,
        targetHasHenchman: `O alvo tem um capanga ativo!`,
        nextYield: "Próximo lucro",
        robberyResultLost: (gangName) => `${emotes_1.EmoteString.Gang} Gangue **${gangName}** roubou seu investimento!`,
        robberyResultWon: "Você defendeu seu investimento com sucesso!",
        henchmanStillActive: "Seu capanga protegeu você e continua ativo!",
        robberyCooldown: (date) => `${emotes_1.EmoteString.Police} A polícia está procurando por sua gangue. Você poderá roubar novamente ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        importTitle: "Importação da gangue",
        importReady: (cost, time, chance) => `Pronto para iniciar uma nova importação de itens.\n\n- **Custo:** ${cost}\n- **Tempo de espera:** ${time}h\n- **Chance de sucesso:** ${chance}`,
        importActive: "Uma importação está atualmente em trânsito.",
        importInfoArrivesIn: (time) => `Chega ${time}`,
        importInfoSuccessChance: (chance) => `Chance de sucesso: ${chance}`,
        importCooldown: (time) => `Sua gangue teve uma importação bem-sucedida recentemente.\n-# Próxima disponível ${time}.`,
        importCancelCooldown: (time) => `Sua gangue cancelou uma importação recentemente.\n-# Próxima disponível ${time}.`,
        startImport: "Iniciar importação",
        cancelImport: "Cancelar importação",
        confirmCancelImport: (refund) => `Tem certeza que deseja cancelar a importação ativa? Você receberá um reembolso parcial de **${refund}**.`,
        successStartImport: (time) => `Importação iniciada! Chegará em ${time}.`,
        successCancelImport: (refund) => `Importação cancelada. **${refund}** foi reembolsado para o caixa da gangue.`,
        onlyLeaderImport: "Apenas o líder da gangue pode iniciar ou cancelar importações.",
        importReason: (type, data = {}) => {
            const reasons = {
                [Gang_1.GangImportFailureReason.NoBase]: "Sua gangue precisa ter uma base para importar itens.",
                [Gang_1.GangImportFailureReason.ActiveImport]: "Já existe uma importação ativa em trânsito.",
                [Gang_1.GangImportFailureReason.Cooldown]: `Você precisa esperar até ${data.time} para iniciar outra importação.`,
                [Gang_1.GangImportFailureReason.CancelCooldown]: `Você cancelou uma importação recentemente. Você precisa esperar até ${data.time} para iniciar outra.`,
                [Gang_1.GangImportFailureReason.NotEnoughMoney]: `O caixa da gangue não tem dinheiro suficiente. Custo: ${data.cost}`,
            };
            return reasons[type] || "Erro desconhecido ao iniciar a importação.";
        },
        gangHasNoBase: "Sua gangue precisa ter uma base para iniciar uma importação.",
        importDescription: "Importe armas e equipamentos do exterior. Com sorte, o carregamento chegará e todos os membros receberão itens!",
    },
    [Language_1.Language.Spanish]: {
        gangTitle: `Cuadrillas`,
        gangDescription: `¡Crea tu cuadrilla y trabaja en equipo! ¡Participa en atracos grupales y ~~peleas de cuadrillas~~!\n\n**Costo para crear una cuadrilla: ${(0, ui_1.formatMoney)(Gang_1.Gang.CREATION_COST, Language_1.Language.Spanish)}**`,
        gangNotFoundByName: (name) => `¡No se encontró ninguna cuadrilla con el nombre o acrónimo **${name}** ${emotes_1.EmoteString.Gang}`,
        notInGang: `¡No estás en una cuadrilla! Para ver una cuadrilla específica, usa el comando \`cuadrilla info\` ${emotes_1.EmoteString.Gang}`,
        errorGettingGang: `Error al obtener información de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorSearchingGang: `Error al buscar la cuadrilla ${emotes_1.EmoteString.Gang}`,
        name: `Nombre`,
        acronym: `Acrónimo`,
        level: `Nivel`,
        totalInBalance: "Total en el balance",
        members: `Miembros`,
        created: `Creada`,
        description: `Descripción`,
        color: `Color`,
        image: `Imagen`,
        gangId: (id) => `Id de Cuadrilla: ${id}`,
        gangAlreadyExistsName: (name) => `¡Una cuadrilla con el nombre **${name}** ya existe ${emotes_1.EmoteString.Gang}`,
        gangAlreadyExistsAcronym: (acronym) => `¡Una cuadrilla con el acrónimo **${acronym}** ya existe ${emotes_1.EmoteString.Gang}`,
        alreadyInGang: `¡Ya estás en una cuadrilla! Necesitas salir de tu cuadrilla actual antes de crear una nueva ${emotes_1.EmoteString.Gang}`,
        userAlreadyInGang: (user) => `**${user.GetNameWithImage()}** ya está en una cuadrilla ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyCreate: (cost) => `¡No tienes suficiente dinero para crear una cuadrilla! Cuesta ${cost} ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyBase: (cost) => `¡Tu cuadrilla no tiene suficiente dinero en el balance para comprar una base! Cuesta ${cost} ${emotes_1.EmoteString.Gang}`,
        lettersAndNumbers: `El nombre de la cuadrilla solo puede contener letras y números ${emotes_1.EmoteString.Gang}`,
        invalidURLImage: `¡URL de imagen inválida! Por favor, proporciona una URL de imagen válida que termine en .jpg, .jpeg, .webp o .png ${emotes_1.EmoteString.Gang}`,
        errorCreatingGang: `Error al crear la cuadrilla. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        gangCreated: `¡Cuadrilla creada con éxito! ${emotes_1.EmoteString.Gang}`,
        gangCreatedDetails: (name, cost) => `Has creado la cuadrilla **${name}** por ${cost} ${emotes_1.EmoteString.Gang}\n-# Usa \`/gang info\` para ver más detalles sobre tu cuadrilla.`,
        gangEditted: `¡Cuadrilla editada con éxito! ${emotes_1.EmoteString.Gang}`,
        errorEdittingGang: `Error al editar la cuadrilla. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        errorEdittingGangPermission: `No tienes permiso para editar la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorInviteGangPermission: `No tienes permiso para invitar usuarios a la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorInviteGangYourself: `No puedes invitarte a ti mismo a la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorInviteGangGeneric: `Error al invitar usuario a la cuadrilla. Por favor, inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successInviteGang: (nickname, gangName) => `**${nickname}** ha sido invitado a la cuadrilla **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        confirm: `Confirmar`,
        confirmLeave: (gangName) => `¿Confirmar salida de la cuadrilla **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorLeaveGang: `Error al salir de la cuadrilla. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        errorLeaveGangLeader: `No puedes salir de la cuadrilla como líder. Necesitas transferir el liderazgo o ser el único miembro ${emotes_1.EmoteString.Gang}`,
        successLeaveGang: (gangName) => `Has salido de la cuadrilla **${gangName}** con éxito ${emotes_1.EmoteString.Gang}`,
        noResponseLeaveGang: (gangName) => `Te demoraste en responder y no saliste de la cuadrilla **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDisband: (gangName) => `¿Estás seguro de que quieres disolver la cuadrilla **${gangName}**? Esta acción no se puede deshacer y todo el progreso de la cuadrilla se perderá. ${emotes_1.EmoteString.Gang}`,
        successDisband: (gangName) => `La cuadrilla **${gangName}** ha sido disuelta con éxito ${emotes_1.EmoteString.Gang}`,
        errorDisbandGang: `Error al disolver la cuadrilla. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        confirmKick: (nickname, gangName) => `¿Estás seguro de que deseas expulsar a **${nickname}** de la cuadrilla **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        errorKickGangPermission: `No tienes permiso para expulsar usuarios de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorKickGangYourself: `No puedes expulsarte a ti mismo de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorKickGangLeader: `No puedes expulsar al líder de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorKickGang: (nickname, gangName) => `Error al expulsar a **${nickname}** de la cuadrilla **${gangName}**. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successKickGang: (nickname, gangName) => `**${nickname}** ha sido expulsado de la cuadrilla **${gangName}**! ${emotes_1.EmoteString.Gang}`,
        noResponseKickGang: (nickname, gangName) => `Te demoraste en responder y no expulsaste a **${nickname}** de la cuadrilla **${gangName}** ${emotes_1.EmoteString.Gang}`,
        errorCommunicateGangPermission: `No tienes permiso para comunicarte con los miembros de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        messageSent: `¡Mensaje enviado a los miembros de la cuadrilla! ${emotes_1.EmoteString.Gang}`,
        prisonModifier: `probabilidad de escapar de la cárcel`,
        perLevelModifier: "por nivel de cuadrilla",
        gangBasesTitle: `Bases de Cuadrilla`,
        gangBasesCost: (cost) => `Las bases cuestan ${cost} del saldo de la cuadrilla`,
        buy: `Comprar`,
        back: `Volver`,
        baseBought: (baseName, gangName) => `Compraste la base **${baseName}** para la cuadrilla **${gangName}** ${emotes_1.EmoteString.Gang}`,
        depositSuccess: (amount, gangName) => `Depositaste **${amount}** en la cuadrilla **${gangName}** ${emotes_1.EmoteString.Gang}`,
        confirmDeposit: (amount, gangName) => `¿Estás seguro de que deseas depositar **${amount}** en la cuadrilla **${gangName}**? ${emotes_1.EmoteString.Gang}`,
        noResponseDeposit: (gangName) => `Te demoraste en responder y no depositaste en la cuadrilla **${gangName}** ${emotes_1.EmoteString.Gang}`,
        notEnoughMoneyDeposit: (amount) => `No tienes **${amount}** para depositar`,
        deposits: "Depósitos",
        canDeposit: "Puede depositar",
        canDepositAgain: "Puede depositar nuevamente",
        createRoleTitle: "Crear Cargo",
        createRoleDescription: (name) => `Creando cargo **${name}**. Selecciona los permisos abajo:`,
        permissions: "Permisos",
        permissionInvite: "Invitar Miembros",
        permissionKick: "Expulsar Miembros",
        permissionPromote: "Promover Miembros",
        permissionEditGang: "Editar Cuadrilla",
        permissionImportShipments: "Importar Cargamentos",
        errorCreateRoleLeader: `Solo el líder puede crear cargos ${emotes_1.EmoteString.Gang}`,
        errorCreateRole: `Error al crear cargo. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successCreateRole: (name) => `¡Cargo **${name}** creado con éxito! ${emotes_1.EmoteString.Gang}`,
        changeRoleTitle: "Cambiar Cargo",
        changeRoleDescription: (user, currentRole) => `Cambiando cargo de **${user}**.\nCargo actual: **${currentRole}**`,
        userNotInGang: (user) => `**${user}** no está en tu cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorChangeRole: `Error al cambiar cargo. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successChangeRole: (user, role) => `¡Cargo de **${user}** cambiado a **${role}** con éxito! ${emotes_1.EmoteString.Gang}`,
        errorChangeRoleLeader: `No puedes cambiar el cargo del líder ${emotes_1.EmoteString.Gang}`,
        editRoleTitle: "Editar Cargo",
        editRoleDescription: (oldName, newName) => `Editando cargo **${oldName}**${oldName !== newName ? ` a **${newName}**` : ""}. Selecciona los permisos abajo:`,
        errorEditRoleLeader: `Solo el líder puede editar cargos ${emotes_1.EmoteString.Gang}`,
        roleNotFound: (name) => `Cargo **${name}** no encontrado en tu cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorEditRole: `Error al editar cargo. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successEditRole: (name) => `¡Cargo **${name}** editado con éxito! ${emotes_1.EmoteString.Gang}`,
        rolesTitle: (name) => `Cargos de ${name}`,
        membersWithRole: "Miembros",
        delete: "Borrar",
        noPermissions: "Sin permisos",
        confirmDeleteRole: (name) => `¿Estás seguro de que quieres borrar el cargo **${name}**?\n-# Los miembros con este cargo serán reasignados al cargo de **Miembro** por defecto.`,
        errorDeleteRole: `Error al borrar el cargo. Puede ser un cargo protegido (como Líder o Miembro) u otro error ha ocurrido.`,
        cancel: "Cancelar",
        transferTitle: "Transferir Liderazgo",
        transferDescription: (target) => `¿Estás seguro de que deseas transferir el liderazgo de la cuadrilla a **${target}**?\n-# Esta acción no se puede deshacer. Te convertirás en un Miembro regular.`,
        errorMustBeLeader: `Solo el líder puede transferir el liderazgo de la cuadrilla ${emotes_1.EmoteString.Gang}`,
        errorCantTransferToSelf: `No puedes transferir el liderazgo a ti mismo ${emotes_1.EmoteString.Gang}`,
        errorTransferLeadership: `Error al transferir el liderazgo. Inténtalo de nuevo más tarde ${emotes_1.EmoteString.Gang}`,
        successTransferLeadership: (target) => `¡Has transferido el liderazgo de la cuadrilla a **${target}** con éxito! ${emotes_1.EmoteString.Gang}`,
        robInvestment: "Robo a inversión",
        inProgress: "en progreso",
        finished: "finalizado",
        robberyInitiated: (invName, targetName) => `Organizando robo contra ${emotes_1.EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${emotes_1.EmoteString.Waiting}`,
        robberyAttempting: (invName, targetName) => `Intentando robar ${emotes_1.EmoteString.InvestmentActive} **${invName}** de **${targetName}** ${emotes_1.EmoteString.Waiting}`,
        participants: (count) => `Participantes: ${count}`,
        participate: "Participar",
        abortRobbery: "Abortar robo",
        autoStartRobbery: (seconds) => `Inicia automáticamente en ${seconds} segundos.`,
        alreadyIn: "Ya estás participando.",
        reason: (type) => {
            const reasons = {
                [InvestmentRobbery_1.InvestmentRobberyReason.NoPermission]: "No tienes permiso para iniciar un robo.",
                [InvestmentRobbery_1.InvestmentRobberyReason.CantRobYourself]: "No puedes robar tu propia inversión.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderNotIdling]: "Debes estar vagando para iniciar un robo.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetSameGang]: "El objetivo está en tu cuadrilla.",
                [InvestmentRobbery_1.InvestmentRobberyReason.WithoutItem]: "No puedes robar sin un arma.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutNick]: "El objetivo no tiene un apodo.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetWithoutClass]: "El objetivo no tiene una clase.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetAlreadyUnderAttack]: "El objetivo ya está siendo atacado.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoInvestment]: "El objetivo no tiene un investimento.",
                [InvestmentRobbery_1.InvestmentRobberyReason.TargetNoYield]: "El investimento del objetivo no tiene lucros.",
                [InvestmentRobbery_1.InvestmentRobberyReason.NotInGang]: "No estás en esta cuadrilla.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateNotIdling]: "Debes estar vagando para participar.",
                [InvestmentRobbery_1.InvestmentRobberyReason.LeaderIsWanted]: "Estás siendo buscado por la policía y no puedes iniciar un atraco.",
                [InvestmentRobbery_1.InvestmentRobberyReason.ParticipateIsWanted]: "Estás siendo buscado por la policía y no puedes participar.",
            };
            return reasons[type] || "Error desconocido al iniciar el robo.";
        },
        onlyLeaderCanAbort: "Solo quien inició el robo puede abortarlo.",
        robberyAborted: (user) => `El robo fue abortado por **${user}**`,
        defendDMTitle: "¡Ataque a Inversión!",
        defendDMDescription: (gangName, invName) => `¡La cuadrilla **${gangName}** está atacando tu inversión **${invName}**! Puedes defender, ganando ${emotes_1.EmoteString.Defense}+5 DEF, pero si pierdes, serás hospitalizado por 30 minutos.`,
        defend: "Defender",
        youMustBeIdling: `Debes estar ${emotes_1.EmoteString.Idle} vagando para unirte a la defensa.`,
        defendingSuccess: "¡Ahora estás defendiendo tu inversión! Espera los resultados.",
        chance: "Probabilidad de éxito",
        successWin: "Éxito",
        stolen: "Robado para el banco de cuadrilla",
        expGained: "EXP ganada",
        henchmanHospitalized: "El secuaz fue hospitalizado.",
        defenderHospitalized: (name, date) => `¡**${name}** fue hospitalizado! Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        youWereHospitalized: (date) => `¡Fuiste hospitalizado! Serás curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        failureLose: "Fracaso",
        attackersImprisoned: (hours) => `Todos los atacantes fueron enviados a prisión!\n-# Serán liberados ${(0, discord_js_1.time)((0, date_fns_1.addHours)(Date.now(), hours), discord_js_1.TimestampStyles.RelativeTime)}`,
        attackersHospitalized: "También fueron hospitalizados por 30 minutos.",
        targetIsDefending: (name) => `¡**${name}** está defendiendo! ${emotes_1.EmoteString.Defense}`,
        targetHasHenchman: `¡El objetivo tiene un secuaz activo!`,
        nextYield: "Próximo lucro",
        robberyResultLost: (gangName) => `${emotes_1.EmoteString.Gang} La pandilla **${gangName}** robó tu inversión!`,
        robberyResultWon: "¡Defendiste tu inversión con éxito!",
        henchmanStillActive: "¡Tu secuaz te protegió y sigue activo!",
        robberyCooldown: (date) => `${emotes_1.EmoteString.Police} La policía está buscando a tu cuadrilla. Podrás robar de nuevo ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}`,
        importTitle: "Importación de cuadrilla",
        importReady: (cost, time, chance) => `Listo para iniciar una nueva importación de objetos.\n\n- **Costo:** ${cost}\n- **Tiempo de espera:** ${time}h\n- **Probabilidad de éxito:** ${chance}`,
        importActive: `Una importación está actualmente en tránsito.`,
        importInfoArrivesIn: (time) => `Llega ${time}`,
        importInfoSuccessChance: (chance) => `Probabilidad de éxito: ${chance}`,
        importCooldown: (time) => `Tu cuadrilla tuvo una importación exitosa recientemente.\n-# Próxima disponible ${time}.`,
        importCancelCooldown: (time) => `Tu cuadrilla canceló una importación recientemente.\n-# Próxima disponible ${time}.`,
        startImport: "Iniciar importación",
        cancelImport: "Cancelar importación",
        confirmCancelImport: (refund) => `¿Estás seguro de que deseas cancelar la importación activa? Recibirás un reembolso parcial de **${refund}**.`,
        successStartImport: (time) => `¡Importación iniciada! Llegará en ${time}.`,
        successCancelImport: (refund) => `Importación cancelada. **${refund}** ha sido reembolsado al banco de la cuadrilla.`,
        onlyLeaderImport: "Solo el líder de la cuadrilla puede iniciar o cancelar importaciones.",
        importReason: (type, data = {}) => {
            const reasons = {
                [Gang_1.GangImportFailureReason.NoBase]: "Tu cuadrilla debe tener una base para importar objetos.",
                [Gang_1.GangImportFailureReason.ActiveImport]: "Ya hay una importación activa en tránsito.",
                [Gang_1.GangImportFailureReason.Cooldown]: `Debes esperar hasta las ${data.time} para iniciar otra importación.`,
                [Gang_1.GangImportFailureReason.CancelCooldown]: `Cancelaste una importación recientemente. Debes esperar hasta las ${data.time} para iniciar otra.`,
                [Gang_1.GangImportFailureReason.NotEnoughMoney]: `El banco de la cuadrilla no tiene suficiente dinero. Costo: ${data.cost}`,
            };
            return reasons[type] || "Error desconocido al iniciar la importación.";
        },
        gangHasNoBase: "Tu cuadrilla debe tener una base para iniciar una importación.",
        importDescription: "¡Importa armas y equipos del extranjero. Con suerte, el cargamento llegará y todos los miembros recibirán objetos!",
    },
};
async function runInvestmentRobberySession(interaction, user, requestedTarget) {
    const language = user.Language;
    const s = Strings[language];
    const gang = await Gang_1.Gang.GetByUserId(user.Id);
    if (!gang) {
        await (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({ user, color: colors_1.CrColors.Robbery, description: s.notInGang }));
        return;
    }
    const existing = MultiplayerSession_1.MultiplayerSession.GetVisibleSessions(user.Id, gang.Id).find(session => session.kind === "investmentRobbery" && session.gangId === gang.Id &&
        session.phase !== "completed" && session.phase !== "aborted");
    let targetUser = requestedTarget;
    let session;
    if (existing?.targetId) {
        targetUser = new User_1.User(existing.targetId);
        if (!await targetUser.GetInfo()) {
            await (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({ user, color: colors_1.CrColors.Robbery, description: MultiplayerSession_1.Strings[user.Language].playerNotFound }));
            return;
        }
        session = existing;
    }
    else {
        const result = await MultiplayerSession_1.MultiplayerSession.StartInvestmentRobbery(user, targetUser, "discord");
        if (!result.success) {
            await (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({ user, color: colors_1.CrColors.Robbery, description: result.message }));
            return;
        }
        session = result.session;
    }
    const getInvestmentName = (view) => view.investmentName ??
        (targetUser.Investment.Id === null ? s.robInvestment : Investments_1.InvestmentList[targetUser.Investment.Id].Name[language]);
    const getInvestmentImage = (view) => view.investmentImageUrl ??
        (targetUser.Investment.Id === null ? "" : Investments_1.InvestmentList[targetUser.Investment.Id].ImageUrl);
    const calculateTotalAttack = (view) => Math.round(view.participants.reduce((total, participant) => total + participant.attack, 0) * 0.5);
    const getStatusContainer = (view) => {
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(GangColors_1.GangColor[gang.Color].Color)
            .addTexts([
            `${emotes_1.EmoteString.InvestmentActive} ${s.robInvestment} ${view.phase === "completed" || view.phase === "aborted" ? s.finished : s.inProgress}`,
        ])
            .addLargeSeparator();
        if (view.phase === "lobby") {
            container.addSectionComponents(section => section
                .addTexts([
                s.robberyInitiated(getInvestmentName(view), targetUser.GetNameWithImage()),
                `-# ${s.participants(view.participants.length)} • ${emotes_1.EmoteString.Attack}${calculateTotalAttack(view)} ATK`,
                view.participants.map(participant => `- ${participant.nickname}`).join("\n"),
                `-# ${s.autoStartRobbery(60)}`,
            ])
                .setThumbnailAccessory(thumb => thumb.setURL(getInvestmentImage(view))));
            if (view.ownerId === user.Id || !view.participants.some(participant => participant.userId === user.Id)) {
                container.addButtonRow(btn => btn
                    .setLabel(s.participate)
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setCustomId("join_investment_robbery"));
            }
            if (view.ownerId === user.Id) {
                container.addButtonRow(btn => btn
                    .setLabel(s.abortRobbery)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("abort_investment_robbery"));
            }
        }
        else if (view.phase === "awaitingDefender" || view.phase === "resolving") {
            container.addSectionComponents(section => section
                .addTexts([
                s.robberyAttempting(getInvestmentName(view), targetUser.GetNameWithImage()),
                `-# ${s.participants(view.participants.length)} • ${emotes_1.EmoteString.Attack}${calculateTotalAttack(view)} ATK`,
                view.participants.map(participant => `- ${participant.nickname}`).join("\n"),
                view.response === "defend" ? `\n${s.targetIsDefending(targetUser.GetNameWithImage())}` : "",
                view.hasHenchman ? `-# ${emotes_1.EmoteString.Henchman} ${s.targetHasHenchman}` : "",
            ])
                .setThumbnailAccessory(thumb => thumb.setURL(getInvestmentImage(view))));
        }
        else if (view.phase === "completed" && view.result) {
            const result = MultiplayerSession_1.MultiplayerSession.DecodeResult(view.result);
            if (result.win) {
                container
                    .setAccentColor(colors_1.CrColors.Robbery)
                    .addSectionComponents(section => section
                    .addTexts([
                    `### ${emotes_1.EmoteString.Victory} ${s.successWin}!`,
                    `**${s.stolen}**: ${(0, ui_1.formatMoney)(result.robbedAmount, language)}`,
                    `-# ${emotes_1.EmoteString.Experience} +${result.expGain} EXP`,
                ])
                    .setThumbnailAccessory(thumb => thumb.setURL(getInvestmentImage(view))));
                if (result.henchmanHospitalized)
                    container.addTexts([`${emotes_1.EmoteString.Hospital} ${s.henchmanHospitalized}`]);
                if (result.defenderHospitalized && result.defenderHospitalTime) {
                    container.addTexts([`${emotes_1.EmoteString.Hospital} ${s.defenderHospitalized(targetUser.GetNameWithImage(), result.defenderHospitalTime)}`]);
                }
            }
            else {
                container
                    .setAccentColor(colors_1.CrColors.Robbery)
                    .addSectionComponents(section => section
                    .addTexts([
                    `### ${emotes_1.EmoteString.Defeat} ${s.failureLose}.`,
                    `${emotes_1.EmoteString.Police} ${s.attackersImprisoned(result.prisonHours)}`,
                    ...(result.attackersHospitalized ? [`-# ${emotes_1.EmoteString.Hospital} ${s.attackersHospitalized}`] : []),
                ])
                    .setThumbnailAccessory(thumb => thumb.setURL(getInvestmentImage(view))));
            }
            container.addTexts([`-# ${emotes_1.EmoteString.Gang} ${gang.Name} • ${(0, ui_1.formatMoney)(gang.Money, language)}`]);
        }
        else {
            container.addTexts([s.robberyAborted(user.GetNameWithImage())]);
        }
        return container.addFooter({ text: `${emotes_1.EmoteString.Gang} ${gang.Name}` });
    };
    let defenderMessage;
    let defenderPromptSent = false;
    let defenderResponseShown = false;
    let defenderResultSent = false;
    const sendDefenderPrompt = async (view) => {
        if (defenderPromptSent || view.phase !== "awaitingDefender" || !view.targetId)
            return;
        defenderPromptSent = true;
        const defender = targetUser;
        const defenderStrings = Strings[defender.Language];
        const investmentName = getInvestmentName(view);
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(defender)
            .setAccentColor(colors_1.CrColors.Robbery)
            .addTexts([`${emotes_1.EmoteString.InvestmentActive} ${defenderStrings.defendDMTitle}`])
            .addLargeSeparator()
            .addSectionComponents(section => section
            .addTexts([
            defenderStrings.defendDMDescription(gang.Name, investmentName),
            view.hasHenchman ? `-# ${emotes_1.EmoteString.Henchman} ${defenderStrings.targetHasHenchman}` : "",
        ])
            .setButtonAccessory(new discord_js_1.ButtonBuilder()
            .setLabel(defenderStrings.defend)
            .setEmoji(emotes_1.EmoteId.Defense)
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setCustomId("defend")))
            .addFooter({
            text: `${defenderStrings.nextYield}: ${(0, ui_1.formatMoney)(view.investmentYield ?? defender.Investment.AccumulatedYield, defender.Language)}`,
        });
        defenderMessage = await (0, discordInteractions_1.sendComplexPrivateMessage)(defender.Id, {
            components: [container],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        const collector = defenderMessage?.createMessageComponentCollector({
            filter: (btn) => btn.user.id === defender.Id,
            componentType: discord_js_1.ComponentType.Button,
            time: 60_000,
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            const response = await MultiplayerSession_1.MultiplayerSession.Respond(view.id, defender.Id, "defend", defender.Language);
            if (!response.success) {
                await btn.followUp({ content: defenderStrings.youMustBeIdling, flags: discord_js_1.MessageFlags.Ephemeral });
            }
        });
    };
    const sendDefenderResult = async (view) => {
        if (defenderResultSent || view.phase !== "completed" || !view.result)
            return;
        defenderResultSent = true;
        const result = MultiplayerSession_1.MultiplayerSession.DecodeResult(view.result);
        const defenderStrings = Strings[targetUser.Language];
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(targetUser)
            .setAccentColor(colors_1.CrColors.Robbery)
            .addTexts([`${emotes_1.EmoteString.InvestmentActive} ${defenderStrings.defendDMTitle}`])
            .addLargeSeparator();
        if (result.win) {
            container.addTexts([
                `### ${emotes_1.EmoteString.Defeat} ${defenderStrings.successWin}.`,
                defenderStrings.robberyResultLost(gang.Name),
                `**${defenderStrings.stolen}**: ${(0, ui_1.formatMoney)(result.robbedAmount, targetUser.Language)}`,
                `**${defenderStrings.nextYield}**: ${(0, ui_1.formatMoney)(result.remainingYield, targetUser.Language)}`,
            ]);
            if (result.defenderHospitalized && result.defenderHospitalTime) {
                container.addTexts([`${emotes_1.EmoteString.Hospital} ${defenderStrings.youWereHospitalized(result.defenderHospitalTime)}`]);
            }
        }
        else {
            container.addTexts([
                `### ${emotes_1.EmoteString.Victory} ${defenderStrings.failureLose}!`,
                defenderStrings.robberyResultWon,
                `${emotes_1.EmoteString.Police} ${defenderStrings.attackersImprisoned(result.prisonHours)}`,
                ...(result.attackersHospitalized ? [`-# ${emotes_1.EmoteString.Hospital} ${defenderStrings.attackersHospitalized}`] : []),
            ]);
        }
        await (0, discordInteractions_1.sendComplexPrivateMessage)(targetUser.Id, {
            components: [container],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
    };
    const update = async (view) => {
        if (view.id !== session.id)
            return;
        await (0, discordInteractions_1.replyWithContainer)(interaction, getStatusContainer(view));
        await sendDefenderPrompt(view);
        if (view.response === "defend" && defenderMessage && !defenderResponseShown) {
            defenderResponseShown = true;
            const defenderStrings = Strings[targetUser.Language];
            const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(targetUser)
                .setAccentColor(colors_1.CrColors.Robbery)
                .addTexts([`${emotes_1.EmoteString.InvestmentActive} ${defenderStrings.defendDMTitle}`])
                .addLargeSeparator()
                .addTexts([defenderStrings.defendingSuccess])
                .addFooter({
                text: `${defenderStrings.nextYield}: ${(0, ui_1.formatMoney)(view.investmentYield ?? targetUser.Investment.AccumulatedYield, targetUser.Language)}`,
            });
            await defenderMessage.edit({ components: [container] });
        }
        await sendDefenderResult(view);
    };
    let updateQueue = Promise.resolve();
    const queueUpdate = (view) => {
        updateQueue = updateQueue.then(() => update(view)).catch(error => {
            log_1.Log.Error(`Failed to update investment robbery session ${view.id}: ${error}`);
        });
        return updateQueue;
    };
    const unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(user.Id, gang.Id, view => {
        queueUpdate(view);
    });
    const reply = await (0, discordInteractions_1.replyWithContainer)(interaction, getStatusContainer(session));
    const collector = reply?.createMessageComponentCollector({ time: 60_000 });
    const latest = MultiplayerSession_1.MultiplayerSession.GetVisibleSession(session.id, user.Id, gang.Id);
    if (latest && (latest.phase !== session.phase || latest.participants.length !== session.participants.length)) {
        await queueUpdate(latest);
    }
    collector?.on("collect", async (btn) => {
        await (0, discordInteractions_1.deferUpdate)(btn);
        let result;
        if (btn.customId === "abort_investment_robbery") {
            result = await MultiplayerSession_1.MultiplayerSession.Abort(session.id, btn.user.id, (0, Language_1.getLanguageFromLocale)(btn.locale));
        }
        else if (btn.customId === "join_investment_robbery") {
            const participant = await (0, userUtils_1.checkUser)(btn.user.id, interaction);
            if (!participant)
                return;
            result = await MultiplayerSession_1.MultiplayerSession.Join(session.id, participant, participant.Language);
        }
        else {
            return;
        }
        if (!result.success) {
            await btn.followUp({ content: result.message, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    });
    collector?.on("end", () => void (0, collectors_1.disableButtons)(interaction, getStatusContainer(session)));
    try {
        const completed = await MultiplayerSession_1.MultiplayerSession.WaitForCompletion(session.id);
        await updateQueue;
        await update(completed);
    }
    finally {
        unsubscribe();
    }
}
//# sourceMappingURL=gang.js.map