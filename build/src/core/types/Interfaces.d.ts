import { Language } from "#core/models/Language";
export interface IDescription {
    [Language.English]: string;
    [Language.Portuguese]: string;
    [Language.Spanish]: string;
}
export declare const defaultSkinDescription: {
    0: string;
    1: string;
    2: string;
};
export interface IEmote {
    Id: string;
    String: string;
}
