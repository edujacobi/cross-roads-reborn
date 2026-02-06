# Project Guidelines and Architecture

This document serves as a guide for agents and developers working on the `cross-roads-reborn` project. Adherence to these guidelines is mandatory to maintain the project's architecture and code quality.

## Environment Context

*   **Runtime**: Node.js
*   **Language**: TypeScript 5.8
*   **Framework**: Discord.js 14
*   **Database**: Sequelize with SQLite (JSON strings for array-like structures)

**Note**: Do not suggest or implement code patterns compatible only with older versions of Discord.js (e.g., v12/v13) or TypeScript.

## Architecture and Separation of Concerns

The project follows a strict separation between the "Frontend" (Commands) and the "Backend" (Models), with Interfaces serving as the contract between them.

### 1. Commands ("Frontend")
*   **Location**: `commands/`
*   **Role**: Handles user interaction (Receive `ChatInputCommandInteraction`), parses input, calls the appropriate `Model` methods, and formats the response for the user.
*   **Output**: Must return a `CustomContainerBuilder` object.
*   **Restrictions**:
    *   **NEVER** use `EmbedBuilder` directly. Use `CustomContainerBuilder`.
    *   **NEVER** implement core business logic here. Delegate to `Models`.
*   **Localization**: All user-facing text must be localized (English, Portuguese, Spanish).

### 2. Models ("Backend")
*   **Location**: `models/`
*   **Role**: Encapsulates business logic, state management, and data manipulation.
*   **Behavior**: Functions like an API. Methods should return simple types (strings, enums, numbers, booleans) or data objects/interfaces.
*   **Restrictions**:
    *   **NEVER** import `discord.js` UI classes (e.g., `EmbedBuilder`, `ButtonBuilder`, `ActionRowBuilder`, `ModalBuilder`).
    *   **Database Access**: This is the **ONLY** layer allowed to import and interact with files in `database/`.
*   **Logging**: Internal logs should be in English (using `Log` utility).

### 3. Interfaces ("Contracts")
*   **Location**: `interfaces/`
*   **Role**: Defines the shapes of data, properties, and static lists (e.g., `ItemList`, `JobList`, `LocationList`).
*   **Usage**: Shared by both Commands and Models to ensure type safety.

### 4. Database
*   **Location**: `database/`
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
import { replyWithContainer } from "../../utils/logic";
import { User } from "../../models/User";
import { Language, Localization } from "../../models/Language";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { CrColors } from "../../utils/colors";

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
