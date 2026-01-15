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

| Command          | Description                               |
|------------------|-------------------------------------------|
| `/about`         | Information about the bot                 |
| `/alms`          | Receive or give alms to other players     |
| `/avatar`        | View a user's avatar                      |
| `/badges`        | Check all the existing badges             |
| `/beatup`        | Fight other players                       |
| `/bet`           | Gamble your money                         |
| `/blackmarket`   | Access the black market for special items |
| `/casino`        | Access the casino                         |
| `/commands`      | List all available commands               |
| `/daily`         | Claim your daily reward                   |
| `/decorations`   | Choose the decoration for your avatar     |
| `/drink`         | Drinks a refreshing beverage!             |
| `/gang`          | View information about gangs              |
| `/help`          | Get help with bot commands                |
| `/history`       | View your transaction history             |
| `/horserace`     | View and bet on horse races               |
| `/hospital`      | Visit the hospital to heal                |
| `/inv`           | View your inventory                       |
| `/invite`        | Get an invite link for the bot            |
| `/item`          | View information about an item            |
| `/jobs`          | Work jobs to earn money                   |
| `/ping`          | Check the bot's latency                   |
| `/prison`        | Visit the prison                          |
| `/rob`           | Rob other players                         |
| `/scavenge`      | Scavenge for items and money              |
| `/setclass`      | Change your character class               |
| `/setnick`       | Set your nickname                         |
| `/shop`          | Visit the shop to buy items               |
| `/skins`         | Choose the skins for your items           |
| `/specialshop`   | Buy permanent customizations              |
| `/top`           | View various top rankings                 |
| `/user`          | View your or another user's profile       |
| `/vip`           | Information about VIP benefits            |

### Admin Commands

| Command           | Description                       |
|-------------------|-----------------------------------|
| `/addcoins`       | Add coins to a user               |
| `/badge`          | Manage user badges                |
| `/classes`        | Manage classes                    |
| `/createevent`    | Create a new event                |
| `/debugbeatup`    | Debug beatup mechanics            |
| `/debugrobbery`   | Debug robbery mechanics           |
| `/endseason`      | End the current season            |
| `/process`        | Manage system processes           |
| `/reload`         | Reloads a command                 |
| `/setclassadm`    | Set a user's class (Admin)        |
| `/seteternalvip`  | Set a user as eternal VIP         |
| `/setitem`        | Give items to a user              |
| `/setmoney`       | Set a user's money                |
| `/setvip`         | Set a user as VIP                 |
| `/upcomingevents` | View upcoming events              |
| `/updateevent`    | Update an existing event          |
| `/userdb`         | View the tabular data of the user |
| `/vips`           | See all VIPs and Remaining time   |


## Installation

### Prerequisites

- Node.js 22 or higher
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
   ```
   TOKEN=your_discord_bot_token
   TOKEN_DEV=your_development_discord_bot_token
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

- `npm run build` - Build the project
- `npm run deploy` - Deploy slash commands to Discord
- `npm run start` - Start the bot with PM2
- `npm run stop` - Stop the bot
- `npm run start-dev` - Start the bot in development mode (watch mode)
- `npm run deploy-dev` - Deploy slash commands to the development bot
- `npm run lint` - Run ESLint
- `npm run lint-fix` - Run ESLint and fix issues

### Hot Reload

When running in development mode (`npm run start-dev`), the bot uses `tsx` in watch mode, which automatically restarts the bot when files are changed.

Additionally, you can use the `/reload` command (Admin only) to reload a specific command without restarting the entire bot. This is useful for testing changes to command logic quickly.

## Technical Information

### Built With

- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Sequelize](https://sequelize.org/) - ORM for database management
- [SQLite](https://www.sqlite.org/) - Database
- [Canvas](https://www.npmjs.com/package/canvas) - Image manipulation
- [PM2](https://pm2.keymetrics.io/) - Process manager

### Project Structure

- `/commands` - Bot commands organized by category
- `/events` - Discord event handlers
- `/models` - Data models and game mechanics
- `/utils` - Utility functions
- `/database` - Database configuration
- `/interfaces` - TypeScript interfaces

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
