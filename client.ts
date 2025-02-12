import { Client, GatewayIntentBits } from "discord.js";

let client: Client;

export function getClient() {
	return client;
}

export function setClient() {
	client = new Client({ intents: [GatewayIntentBits.Guilds] });
	return client;
}