# Project Guidelines and Architecture

This document serves as a guide for agents and developers working on the `cross-roads-reborn` project. Adherence to these guidelines is mandatory to maintain the project's architecture and code quality.

## Environment Context

*   **Runtime**: Node.js
*   **Language**: TypeScript 6.0
*   **Framework**: Discord.js 14
*   **Database**: Sequelize with SQLite (JSON strings for array-like structures)
*   **Dev Setup**: Windows 11 with Powershell

**Note**: Do not suggest or implement code patterns compatible only with older versions of Discord.js (e.g., v12/v13) or TypeScript.

## Architecture and Separation of Concerns

The project follows a strict separation between the "Frontend" (Commands) and the "Backend" (Models), with Interfaces serving as the contract between them.

### 1. Commands ("Frontend")
*   **Location**: `src/bot/commands/`
*   **Role**: Handles user interaction (Receive `ChatInputCommandInteraction`), parses input, calls the appropriate `Model` methods, and formats the response for the user.
*   **Output**: Must return a `CustomContainerBuilder` object.
*   **Restrictions**:
    *   **NEVER** use `EmbedBuilder` directly. Use `CustomContainerBuilder`.
    *   **NEVER** implement core business logic here. Delegate to `Models`.
*   **Localization**: All user-facing text must be localized (English, Portuguese, Spanish).

### 2. Models ("Backend")
*   **Location**: `src/core/models/`
*   **Role**: Encapsulates business logic, state management, and data manipulation.
*   **Behavior**: Functions like an API. Methods should return simple types (strings, enums, numbers, booleans) or data objects/interfaces.
*   **Restrictions**:
    *   **NEVER** import `discord.js` UI classes (e.g., `EmbedBuilder`, `ButtonBuilder`, `ActionRowBuilder`, `ModalBuilder`).
    *   **Database Access**: This is the **ONLY** layer allowed to import and interact with files in `src/core/database/`.
*   **Logging**: Internal logs should be in English (using `Log` utility).

### 3. Types ("Contracts")
*   **Location**: `src/core/types/`
*   **Role**: Defines the shapes of data, properties, and static lists (e.g., `ItemList`, `JobList`, `LocationList`).
*   **Usage**: Shared by both Commands and Models to ensure type safety.

### 4. Database
*   **Location**: `src/core/database/`
*   **Role**: Sequelize schema definitions.
*   **Access**: Private to the `Models` layer. Commands should never query the database directly.

## Localization

*   **User Facing**: All strings sent to Discord must be localized.
    *   Use a `Strings` constant object at the end of the file or a dedicated localization helper.
    *   Support: `Language.English`, `Language.Portuguese`, `Language.Spanish`.
*   **Internal**: Logs and comments must be in **English**.

## Code Patterns & Examples

### Command Structure with `CustomContainerBuilder`

```typescript
import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "@/bot/utils/logic";
import { User } from "@/core/models/User";
import { Language, Localization } from "@/core/models/Language";
import { CustomContainerBuilder } from "@/bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "@/bot/utils/colors";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("example")
        .setDescription("An example command")
        .setDescriptionLocalization(Locale.PortugueseBR, "Um comando de exemplo"),

    async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
        const s = Strings[language];

        // Call Model Logic
        const result = await user.PerformAction();

        // Build Response
        const container = new CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(CrColors.Default)
            .setTitle(s.title)
            .addTexts([
                s.description(result)
            ])
            .addFooter({ text: s.footer });

        // Send Response
        return replyWithContainer(interaction, container);
    },
};

const Strings = {
    [Language.English]: {
        title: "Example Title",
        description: (val: string) => `Action result: ${val}`,
        footer: "Footer text",
    },
    [Language.Portuguese]: {
        title: "Título de Exemplo",
        description: (val: string) => `Resultado da ação: ${val}`,
        footer: "Texto de rodapé",
    },
    [Language.Spanish]: {
        title: "Título de Ejemplo",
        description: (val: string) => `Resultado de la acción: ${val}`,
        footer: "Texto de pie de página",
    },
} as const satisfies Localization;
```

## Image Assets

### Item Icon Art Style

All item icons located in `src/bot/ui/assets/images/items/` must follow these rules to remain visually consistent:

*   **Style**: Smooth cartoon illustration. **Never** pixel art, 8-bit, or 16-bit style.
*   **Outlines**: Thick, bold black outlines on all elements.
*   **Shading**: Flat cel-shading. No complex gradients or realistic rendering.
*   **Background**: Fully transparent (PNG with alpha channel).
*   **Canvas**: ~128×128 px. All elements (including fire effects, flames, or any decoration) must be **fully contained within the canvas bounds** — nothing may be clipped at the edges.
*   **Colors**: Vibrant and saturated. Avoid dull or washed-out palettes.

### Item Skin Naming Convention

Skins are named as `{id}_{ItemName}_{SkinName}.png`, e.g.:
*   `0_Knife_Flaming.png`
*   `6_AssaultRifle_Steampunk.png`
*   `9_Katana_Void.png`

### Skin Bundles

When creating a new skin bundle (a themed set of skins), all items in the bundle must share the same visual theme and art style consistently.

*   **Flaming**: blade/weapon IS the fire — orange-to-yellow gradient, white-yellow core, flame wisps. Transformed items: Grenade → Molotov, Minigun → Flamethrower.
*   **Rusted**: brown-orange rust patches, chipped paint, cracked/worn wood stocks, same thick outlines as non-rusted counterparts.
*   **Steampunk**: brass/copper/bronze body, exposed pipes, gears, rivets, pressure gauges, Victorian industrial aesthetic.

## Coding Standards

### Number Representation
Always separate thousands with an underscore (`_`) for better readability.
*   **Example**: `1_000_000` instead of `1000000`.

### New Line
Always use CRLF as End of Line Sequence in files.
