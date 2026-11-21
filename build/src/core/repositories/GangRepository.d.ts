import { Gangs } from "#core/database/Gangs";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export interface RecruitingGangEntry {
    id: number;
    name: string;
    acronym: string;
    description: string;
    level: number;
    image: string | null;
    color: number;
    baseId: number;
    recruitmentType: number;
    membersCount: number;
}
export interface RecruitingGangPage {
    entries: RecruitingGangEntry[];
    total: number;
}
export declare class GangRepository {
    static FindById(id: number, attributes?: (keyof Gangs)[]): Promise<Gangs | null>;
    static FindAllByIds(ids: number[]): Promise<Gangs[]>;
    static FindTopGangs(limit: number, offset: number): Promise<Gangs[]>;
    static FindByName(name: string): Promise<Gangs | null>;
    static FindByAcronym(acronym: string): Promise<Gangs | null>;
    static FindByNameOrAcronym(name: string, acronym: string): Promise<Gangs | null>;
    static FindByUserId(userId: string): Promise<Gangs | null>;
    static Create(values: Optional<InferCreationAttributes<Gangs>, NullishPropertiesOf<InferCreationAttributes<Gangs>>>): Promise<Gangs>;
    static Update(id: number, values: Partial<InferAttributes<Gangs>>): Promise<[number]>;
    static Destroy(id: number): Promise<number>;
    static FindAllWithActiveImport(): Promise<Gangs[]>;
    static CountAllGangs(): Promise<number>;
    static FindRecruitingGangs(recruitmentType: number | undefined, search: string | undefined, sortBy: string | undefined, sortOrder: string | undefined, limit: number, offset: number): Promise<RecruitingGangPage>;
}
