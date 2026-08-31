# Cross Roads Reborn

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

Cross Roads Reborn is a feature-rich Discord bot that offers an immersive economy and role-playing game experience.
Players can earn money, fight other users, work jobs, manage inventory, and much more - all within Discord!

## Features

- **Economy System**: Earn daily rewards, gamble at the casino, rob other players, work jobs, and manage your money
- **Combat System**: Battle other players with the beatup command
- **Inventory Management**: Collect items, weapons, and manage your inventory
- **Class System**: Choose different character classes with unique abilities
- **Locations**: Visit different locations like the hospital, prison, and shop
- **Leaderboards**: Compete with other players to reach the top of various leaderboards
- **VIP System**: Get exclusive benefits by becoming a VIP
- **Multi-language Support**: Available in English, Portuguese, and Spanish
- **Gang System**: Create or join gangs, manage members, and compete with other gangs
- **Cosmetics**: Customize your profile with avatar decorations and item skins

## Commands

### Utility Commands

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `/about`            | Information about the bot                    |
| `/alms`             | Receive or give alms to other players        |
| `/automaticgrenade` | Enable or disable automatic grenade usage    |
| `/avatar`           | View a user's avatar                         |
| `/badges`           | Check all the existing badges                |
| `/beatup`           | Fight other players                          |
| `/bet`              | Gamble your money                            |
| `/blackmarket`      | Access the black market for special items    |
| `/casino`           | Access the casino                            |
| `/cemetery`         | Visit the cemetery and view deceased players |
| `/commands`         | List all available commands                  |
| `/daily`            | Claim your daily reward                      |
| `/decorations`      | Choose the decoration for your avatar        |
| `/drink`            | Drinks a refreshing beverage!                |
| `/gang`             | View and manage gang activities              |
| `/heist`            | Plan and execute a gang heist                |
| `/help`             | Get help with bot commands                   |
| `/history`          | View your transaction history                |
| `/horserace`        | View and bet on horse races                  |
| `/hospital`         | Visit the hospital to heal                   |
| `/inv`              | View your inventory                          |
| `/investment`       | Manage or buy an investment                  |
| `/invite`           | Get an invite link for the bot               |
| `/item`             | View information about an item               |
| `/jobs`             | Work jobs to earn money                      |
| `/lottery`          | Participate in the lottery                   |
| `/ping`             | Check the bot's latency                      |
| `/prison`           | Visit the prison                             |
| `/rob`              | Rob other players                            |
| `/russianroulette`  | Game of Russian Roulette                     |
| `/scavenge`         | Scavenge for items and money                 |
| `/setclass`         | Change your character class                  |
| `/setnick`          | Set your nickname                            |
| `/shop`             | Visit the shop to buy items                  |
| `/skins`            | Choose the skins for your items              |
| `/specialshop`      | Buy permanent customizations                 |
| `/top`              | View various top rankings                    |
| `/updates`          | Latest updates from Cross Roads!             |
| `/user`             | View your or another user's profile          |
| `/vip`              | Information about VIP benefits               |
| `/vote`             | Vote for the bot on Top.gg                   |

### Admin Commands

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `/addcoins`       | Add coins to a user                       |
| `/allowmainheist` | Enable or disable the main heist schedule |
| `/badge`          | Manage user badges                        |
| `/classes`        | Manage and inspect player classes         |
| `/createevent`    | Create a new event                        |
| `/cure`           | Cure a user from hospital                 |
| `/dashboard`      | View system dashboard                     |
| `/debugbeatup`    | Debug beatup mechanics                    |
| `/debugrobbery`   | Debug robbery mechanics                   |
| `/endseason`      | End the current season                    |
| `/free`           | Free a user from prison                   |
| `/kill`           | Kill a player (ban them temporarily)      |
| `/process`        | Manage system processes                   |
| `/reload`         | Reload a command module                   |
| `/removeaction`   | Remove a user from a specific action lock |
| `/resetcooldown`  | Reset a specific cooldown for a user      |
| `/setclassadm`    | Set a user's class (Admin)                |
| `/seteternalvip`  | Set a user as eternal VIP                 |
| `/setgangmoney`   | Set or add money to a gang                |
| `/setitem`        | Give items to a user                      |
| `/setmoney`       | Set a user's money                        |
| `/setnickadm`     | Set a new nickname for a user             |
| `/setvip`         | Set a user as VIP                         |
| `/swapusers`      | Swap two users across database tables     |
| `/upcomingevents` | View upcoming events                      |
| `/updateevent`    | Update an existing event                  |
| `/userdb`         | View the tabular data of a user           |
| `/vips`           | View all VIPs and remaining time          |

## Architecture & Development

The project follows a strict **Separation of Concerns** between the interaction layer, business logic, and database access:

- **Frontend (Commands)**: Located in `src/bot/commands/`. Handles user interactions, input parsing, and UI formatting using `CustomContainerBuilder`. They should **never** contain core game logic.
- **Backend (Models & Strategies)**: Located in `src/core/models/` and `src/core/models/strategies/`. Encapsulates all business logic, state management, and behavioral game rules.
- **Database Repositories**: Located in `src/core/repositories/`. The only layer allowed to import and query database files directly, isolating models from database schemas.
- **Contracts (Types)**: Located in `src/core/types/`. Shared definitions that ensure type safety across frontend, backend, and database repositories.

### Localization

All user-facing text must be localized. The bot supports:

- 🇺🇸 English (`Language.English`)
- 🇧🇷 Portuguese (`Language.Portuguese`)
- 🇪🇸 Spanish (`Language.Spanish`)

Localization strings are typically defined as a `Strings` constant at the end of command files or within dedicated localization helpers.

### UI Standards

To maintain visual consistency:

- **Icons**: Item icons must be 128x128px PNGs with transparent backgrounds.
- **Art Style**: Smooth cartoon illustrations with thick black outlines and flat cel-shading.
- **Containers**: Use `CustomContainerBuilder` and `defaultComponent` for all Discord responses to ensure a premium, unified look.

### Canvas UI System

The bot uses `@napi-rs/canvas` for high-performance image generation. Complex UIs (like profiles and inventory) are built using a **Builder Pattern**:

- **BaseCanvasBuilder**: The base class providing core utilities:
  - `GenerateImage()`: Encodes the canvas into a high-quality WebP buffer.
  - `LoadLocalImage(path)`: Loads and caches assets from the local filesystem.
  - `LoadExternalImage(url)`: Loads remote assets (e.g., user avatars).
  - `tryDrawImage(path, drawAction)`: Safely attempts to draw an image with error handling and fallback support.
- **Specialized Builders**: Classes like `InventoryCanvasBuilder` or `UserRankingCardCanvasBuilder` that implement modular drawing methods:
  - `AddHeader()` / `AddSubHeader()`: Draws the user identity and status sections.
  - `AddItemGrid()`: Renders a dynamic grid of items with quantity/time warnings.
  - `calculateHeight()`: Dynamically determines canvas dimensions based on content volume.
- **Asset Registries**: Centralized managers like `BackgroundPatternRegistry` and `AvatarDecorationRegistry` that handle pre-loading and retrieval of complex UI decorations.

## Installation

### Prerequisites

- Node.js 24.20.0 or higher
- npm
- A Discord bot token

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/edujacobi/cross-roads-reborn.git
   cd cross-roads-reborn
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```env
   # Discord Bot Token
   TOKEN=your_production_token
   TOKEN_DEV=your_development_token

   # Environment (DEV or PROD)
   NODE_ENV=DEV

   # (Optional) Channel ID for system logs in production
   LOG_CHANNEL_ID=your_log_channel_id
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Deploy the commands:

   ```bash
   npm run deploy
   ```

6. Start the bot:
   ```bash
   npm start
   ```

## Development

### Available Scripts

- `npm run build` - Build the project (linter + type check + compiler)
- `npm run build:ci` - Clean and compile TypeScript files
- `npm run deploy` - Deploy slash commands to Discord
- `npm run deploy:dev` - Deploy slash commands to the development bot
- `npm run clear-commands` - Clear deployed commands
- `npm run clear-commands:dev` - Clear development commands
- `npm run start` - Start the bot with PM2
- `npm run start:tsx` - Start the bot with PM2 using tsx interpreter
- `npm run stop` - Stop the bot
- `npm run dev` - Start the bot in development mode with hot reload
- `npm run lint` - Run Eslint to check formatting, imports, and lint rules
- `npm run lint:fix` - Format, organize imports, and auto-fix issues with Eslint
- `npm run tsc:check` - Perform TypeScript type checks
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:coverage` - Run Vitest with coverage report
- `npm run index` - Regenerate the codebase knowledge graph and architecture map

### Hot Reload

When running in development mode (`npm run dev`), the bot uses `tsx` in watch mode, which automatically restarts the bot when files are changed.

Additionally, you can use the `/reload` command (Admin only) to reload a specific command without restarting the entire bot. This is useful for testing changes to command logic quickly.

## Technical Information

### Built With

- [TypeScript 7](https://www.typescriptlang.org/) - Programming language
- [Discord.js 14](https://discord.js.org/) - Discord API wrapper
- [Sequelize](https://sequelize.org/) - ORM for database management
- [SQLite](https://www.sqlite.org/) - Database
- [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) - High-performance image manipulation
- [Vitest](https://vitest.dev/) - Fast unit testing framework
- [PM2](https://pm2.keymetrics.io/) - Process manager

### Project Structure

- `src/core` - Core business logic, database models, and types
  - `database/` - Sequelize database schemas and model configurations.
  - `repositories/` - Database access layer (isolating queries/mutations).
  - `models/` - RPG business logic classes, strategies, and behavior patterns.
  - `types/` - Shared contracts, interfaces, and static lists.
- `src/bot` - Discord bot implementation (commands, events, UI)
  - `commands/` - Slash commands.
  - `events/` - Event handlers.
  - `ui/` - Interface builders and assets.
  - `utils/` - Bot-specific utilities.
- `src/shared` - Shared utilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Author

- **Jacobi** - [GitHub](https://github.com/edujacobi)

## Acknowledgments

- Thanks to all the players of the original Cross Roads bot
- "Eu falei que ele ia voltar algum dia." (I said he would come back someday.)
