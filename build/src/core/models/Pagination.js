"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("./Language");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
class Pagination {
    Interaction;
    Language;
    Offset = 0;
    Limit = 5;
    HowManyRecords = 0;
    UserHasInteractedOutside = false;
    Attachments = [];
    CustomizeContainer;
    constructor(interaction, language) {
        this.Interaction = interaction;
        this.Language = language;
        this.CustomizeContainer = () => {
            return Promise.resolve(new CustomContainerBuilder_1.CustomContainerBuilder());
        };
    }
    GenerateRow() {
        const rowButtons = new discord_js_1.ActionRowBuilder();
        if (this.Offset != 0) {
            rowButtons.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("prev")
                .setLabel(Strings[this.Language].previous)
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji("⬅️"));
        }
        if (this.HowManyRecords > (this.Offset + this.Limit)) {
            rowButtons.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("next")
                .setLabel(Strings[this.Language].next)
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji("➡️"));
        }
        return rowButtons;
    }
    Showing() {
        return Strings[this.Language].showing(this.Offset, this.Limit, this.HowManyRecords);
    }
    async BuildContainerWithRow(showFooter = true) {
        const row = this.GenerateRow();
        const container = await this.CustomizeContainer();
        if (row.components.length > 0) {
            container
                .addLargeSeparator()
                .addActionRowComponents(row);
        }
        if (showFooter) {
            container.addFooter({
                text: this.Showing(),
            });
        }
        return container;
    }
    async GenerateContainer(mainContainer) {
        let container = await this.BuildContainerWithRow(!mainContainer);
        const components = mainContainer ? [mainContainer, container] : [container];
        const response = await (0, discordInteractions_1.replyInteraction)(this.Interaction, {
            components,
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            files: this.Attachments,
        });
        const collector = (0, collectors_1.createButtonCollector)(this.Interaction, response, { idleTime: 30_000 });
        collector?.on("end", async () => {
            if (!this.UserHasInteractedOutside) {
                await (0, collectors_1.disableButtons)(this.Interaction, mainContainer ?? container);
            }
        });
        collector?.on("collect", async (btn) => {
            if (!["next", "prev"].includes(btn.customId)) {
                return;
            }
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId == "next") {
                this.Offset += this.Limit;
            }
            else if (btn.customId == "prev") {
                this.Offset -= this.Limit;
            }
            container = await this.BuildContainerWithRow();
            await (0, discordInteractions_1.replyInteraction)(this.Interaction, {
                components: mainContainer ? [mainContainer, container] : [container],
                files: this.Attachments,
            });
        });
        return { response, collector };
    }
}
exports.Pagination = Pagination;
const Strings = {
    [Language_1.Language.English]: {
        showing: (offset, limit, howMany) => `Showing ${offset + 1} - ${offset + limit} of ${howMany} results.`,
        next: "Next",
        previous: "Previous",
    },
    [Language_1.Language.Portuguese]: {
        showing: (offset, limit, howMany) => `Exibindo ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
        next: "Próximo",
        previous: "Anterior",
    },
    [Language_1.Language.Spanish]: {
        showing: (offset, limit, howMany) => `Mostrando ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
        next: "Siguiente",
        previous: "Anterior",
    },
};
//# sourceMappingURL=Pagination.js.map