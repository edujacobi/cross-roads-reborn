import { Language } from "#core/models/Language";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import { CrColors } from "#bot/utils/colors";

export interface IDashboardStats {
	date: Date;
	totalPlayers: number;
	totalGangs: number;
	prisonCount: number;
	hospitalCount: number;
	jobCount: number;
	scavengeCount: number;
	casinoCount: number;
	robberyCount: number;
	beatUpCount: number;
	idleCount: number;
	englishCount: number;
	portugueseCount: number;
	spanishCount: number;
}

export class DashboardCanvasBuilder extends BaseCanvasBuilder {
	constructor() {
		super(800, 600, Language.English);
		this.Padding = 20;
	}

	async Draw(stats: IDashboardStats, history: IDashboardStats[]) {
		const ctx = this.Ctx;

		// Background
		ctx.fillStyle = "rgba(91, 91, 107, 0.25)";
		ctx.fillRect(0, 0, this.Width, this.Height);

		// Title
		ctx.fillStyle = "#E3E3E6";
		ctx.font = "32px InterBold";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText("Dashboard", this.Padding, this.Padding);

		// General Stats
		ctx.font = "20px Inter";
		ctx.textAlign = "left";
		ctx.fillStyle = "#bbbbbb";
		ctx.fillText(`Total Players: ${stats.totalPlayers}`, this.Padding, 80);
		ctx.fillText(`Total Gangs: ${stats.totalGangs}`, this.Padding, 110);

		// Draw Pie Chart
		const chartRadius = 100;
		this.drawPieChart(stats, this.Width - chartRadius - this.Padding, 170, chartRadius);

		// Draw Language Stats
		this.drawLanguageStats(stats, this.Padding, 160);

		// Draw Line Chart
		if (history.length > 0) {
			this.drawLineChart(history, 50, 350, 700, 200);
		}

		return await this.GenerateImage();
	}

	private drawPieChart(stats: IDashboardStats, cx: number, cy: number, radius: number) {
		const ctx = this.Ctx;

		const data = [
			{ label: "Prison", value: stats.prisonCount, color: CrColors.PoliceString },
			{ label: "Hospital", value: stats.hospitalCount, color: CrColors.HospitalString },
			{ label: "Jobs", value: stats.jobCount, color: CrColors.JobsString },
			{ label: "Scavenging", value: stats.scavengeCount, color: CrColors.ScavengeString },
			{ label: "Casino", value: stats.casinoCount, color: CrColors.CasinoString },
			{ label: "Robbery", value: stats.robberyCount, color: CrColors.RobberyString },
			{ label: "Beat Up", value: stats.beatUpCount, color: CrColors.BeatUpString },
			{ label: "Idle", value: stats.idleCount, color: CrColors.DefaultString },
		];

		const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

		let startAngle = -Math.PI / 2;

		for (const item of data) {
			if (item.value <= 0) continue;

			const sliceAngle = (item.value / total) * 2 * Math.PI;

			ctx.beginPath();
			if (item.value === total) {
				ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
			}
			else {
				ctx.moveTo(cx, cy);
				ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
				ctx.closePath();
			}
			ctx.fillStyle = item.color;
			ctx.fill();

			startAngle += sliceAngle;
		}

		// Draw legend
		let legendY = cy - radius;
		const legendX = cx - radius - 200;
		ctx.font = "14px Inter";
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		for (const item of data) {
			ctx.fillStyle = item.color;
			ctx.fillRect(legendX, legendY - 6, 12, 12);
			ctx.fillStyle = "#E3E3E6";
			const percentage = ((item.value / total) * 100).toFixed(1);
			ctx.fillText(`${item.label}: ${item.value} (${percentage}%)`, legendX + 20, legendY);
			legendY += 25;
		}
	}

	private drawLanguageStats(stats: IDashboardStats, x: number, y: number) {
		const ctx = this.Ctx;
		const total = (stats.englishCount ?? 0) + (stats.portugueseCount ?? 0) + (stats.spanishCount ?? 0) || 1;

		ctx.font = "18px InterBold";
		ctx.fillStyle = "#E3E3E6";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText("Language Distribution", x, y);

		const languages = [
			{ label: "English", count: stats.englishCount ?? 0, color: "#3498db" },
			{ label: "Portuguese", count: stats.portugueseCount ?? 0, color: "#2ecc71" },
			{ label: "Spanish", count: stats.spanishCount ?? 0, color: "#e67e22" },
		];

		let currentY = y + 35;
		ctx.font = "14px Inter";
		ctx.textBaseline = "middle";
		for (const lang of languages) {
			const percentage = ((lang.count / total) * 100).toFixed(1);
			ctx.fillStyle = lang.color;
			ctx.fillRect(x, currentY - 6, 12, 12);
			ctx.fillStyle = "#bbbbbb";
			ctx.fillText(`${lang.label}: ${lang.count} (${percentage}%)`, x + 20, currentY);
			currentY += 25;
		}
	}

	private drawLineChart(history: IDashboardStats[], x: number, y: number, width: number, height: number) {
		const ctx = this.Ctx;

		// Draw background for chart area
		ctx.fillStyle = "#2c3e50";
		ctx.fillRect(x, y, width, height);

		// Draw grid and axes
		ctx.strokeStyle = "#7f8c8d";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.stroke();

		ctx.font = "16px InterSemiBold";
		ctx.fillStyle = "#E3E3E6";
		ctx.textAlign = "center";
		ctx.fillText("Players (Last 30 Days)", x + width / 2, y - 10);

		const maxPlayers = Math.max(...history.map(h => h.totalPlayers), 10);
		const minPlayers = Math.max(0, Math.min(...history.map(h => h.totalPlayers)) - 5);

		// Calculate coordinates
		const reversedHistory = [...history].reverse();
		const points = reversedHistory.map((stat, i) => {
			const px = x + (i / Math.max(1, reversedHistory.length - 1)) * width;
			const py = y + height - ((stat.totalPlayers - minPlayers) / (maxPlayers - minPlayers)) * height;
			return { px, py, value: stat.totalPlayers, date: stat.date };
		});

		// Draw lines
		ctx.strokeStyle = "#3498db";
		ctx.lineWidth = 3;
		ctx.beginPath();
		if (points.length > 0) {
			ctx.moveTo(points[0].px, points[0].py);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].px, points[i].py);
			}
		}
		ctx.stroke();

		// Draw points and their values
		for (const point of points) {
			ctx.fillStyle = "#E3E3E6";
			ctx.beginPath();
			ctx.arc(point.px, point.py, 4, 0, 2 * Math.PI);
			ctx.fill();

			ctx.font = "10px Inter";
			ctx.fillStyle = "#ffffff";
			ctx.textAlign = "center";
			ctx.textBaseline = "bottom";
			ctx.fillText(`${point.value}`, point.px, point.py - 6);
		}

		// Draw Y axis labels
		ctx.font = "12px Inter";
		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "#bdc3c7";

		const p25 = Math.round(minPlayers + 0.25 * (maxPlayers - minPlayers));
		const p50 = Math.round(minPlayers + 0.50 * (maxPlayers - minPlayers));
		const p75 = Math.round(minPlayers + 0.75 * (maxPlayers - minPlayers));

		ctx.fillText(`${maxPlayers}`, x - 5, y);
		ctx.fillText(`${p75}`, x - 5, y + height * 0.25);
		ctx.fillText(`${p50}`, x - 5, y + height * 0.50);
		ctx.fillText(`${p25}`, x - 5, y + height * 0.75);
		ctx.fillText(`${minPlayers}`, x - 5, y + height);

		// Draw X axis dates
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.font = "10px Inter";

		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			const dateObj = new Date(point.date);
			const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;
			ctx.fillText(dateStr, point.px, y + height + 5);
		}
	}
}
