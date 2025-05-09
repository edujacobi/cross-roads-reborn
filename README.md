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

## Commands

### Utility Commands

| Command        | Description                               |
|----------------|-------------------------------------------|
| `/about`       | Information about the bot                 |
| `/alms`        | Receive or give alms to other players     |
| `/avatar`      | View a user's avatar                      |
| `/beatup`      | Fight other players                       |
| `/bet`         | Gamble your money                         |
| `/blackmarket` | Access the black market for special items |
| `/casino`      | Access the casino                         |
| `/commands`    | List all available commands               |
| `/daily`       | Claim your daily reward                   |
| `/help`        | Get help with bot commands                |
| `/history`     | View your transaction history             |
| `/hospital`    | Visit the hospital to heal                |
| `/inv`         | View your inventory                       |
| `/invite`      | Get an invite link for the bot            |
| `/item`        | View information about an item            |
| `/jobs`        | Work jobs to earn money                   |
| `/ping`        | Check the bot's latency                   |
| `/prison`      | Visit the prison                          |
| `/rob`         | Rob other players                         |
| `/scavenge`    | Scavenge for items and money              |
| `/setclass`    | Change your character class               |
| `/setnick`     | Set your nickname                         |
| `/shop`        | Visit the shop to buy items               |
| `/topgamblers` | View the top gamblers                     |
| `/topmoney`    | View the richest players                  |
| `/topspenders` | View the top spenders                     |
| `/topthieves`  | View the top thieves                      |
| `/topworkers`  | View the top workers                      |
| `/user`        | View your or another user's profile       |
| `/vip`         | Information about VIP benefits            |

### Admin Commands

| Command           | Description               |
|-------------------|---------------------------|
| `/badge`          | Manage user badges        |
| `/createevent`    | Create a new event        |
| `/process`        | Manage system processes   |
| `/seteternalvip`  | Set a user as eternal VIP |
| `/setmoney`       | Set a user's money        |
| `/setvip`         | Set a user as VIP         |
| `/upcomingevents` | View upcoming events      |
| `/updateevent`    | Update an existing event  |

## Installation

### Prerequisites

- Node.js 18 or higher
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
- `npm run start-dev` - Start the bot in development mode
- `npm run deploy-dev` - Deploy slash commands to the development bot
- `npm run lint` - Run ESLint
- `npm run lint-fix` - Run ESLint and fix issues

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
