import { Language } from "./Language";
import { BundleId } from "#core/types/Ids";
import { type Items } from "#core/types/Items";
export declare class UserBundle {
    UserId: string;
    BundleId: BundleId;
    Description: string;
    Items: Items[];
    static Create(userId: string, bundleId: BundleId): Promise<boolean>;
    static HasBundle(userId: string, bundleId: BundleId): Promise<boolean | undefined>;
    static Delete(userId: string, bundleId: BundleId): Promise<boolean>;
    static GetList(userId: string, language?: Language): Promise<UserBundle[]>;
}
