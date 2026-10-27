import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
export interface IDashboardStats {
    date: Date;
    totalPlayers: number;
    allUsers: number | null;
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
export declare class DashboardCanvasBuilder extends BaseCanvasBuilder {
    constructor();
    Draw(stats: IDashboardStats, history: IDashboardStats[]): Promise<Buffer<ArrayBufferLike>>;
    private drawPieChart;
    private drawLanguageStats;
    private drawLineChart;
}
