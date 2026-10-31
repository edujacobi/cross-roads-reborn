import type { Gangs } from "#core/database/Gangs";
import { GangRecruitmentType } from "#core/types/GangRecruitment";
import { GangBaseId } from "#core/types/GangBases";
import { GangColorId } from "#core/types/GangColors";
import type { IDescription } from "#core/types/Interfaces";
import { Language } from "./Language";
import { User } from "./User";
export type GangNotifier = (userId: string, gangInfo: {
    name: string;
    acronym: string;
    colorId: GangColorId;
}, message: string | Record<Language, string>, sender?: User, specialMessage?: string | Record<Language, string>) => Promise<unknown>;
export declare enum GangPermission {
    Invite = 0,
    Kick = 1,
    Promote = 2,
    EditGang = 3,
    ImportShipments = 4
}
export declare enum GangImportFailureReason {
    NoBase = 0,
    ActiveImport = 1,
    Cooldown = 2,
    CancelCooldown = 3,
    NotEnoughMoney = 4
}
export interface GangCreateResult {
    gang: Gang | null;
    reason?: "notEnoughMoney" | "alreadyInGang" | "gangExists" | null;
}
export interface GangMember {
    UserId: string;
    Nickname: string;
    PermissionCount: number;
    RoleId: number;
    RoleName: string;
    Deposit: {
        Time: Date;
        Amount: number;
    };
}
export interface GangRole {
    Id: number;
    Name: string;
    Permissions: GangPermission[];
}
export declare class Gang {
    static Notifier: GangNotifier | null;
    Id: number;
    Name: string;
    Acronym: string;
    Money: number;
    BaseId: GangBaseId;
    Color: GangColorId;
    Image: string | null;
    Description: string;
    Experience: number;
    Level: number;
    LeaderId: string;
    RecruitmentType: GangRecruitmentType;
    LastInvestmentRobbery: Date | null;
    ImportArrivesAt: Date | null;
    LastImportSuccess: Date | null;
    LastImportCancelled: Date | null;
    CreatedAt: Date;
    UpdatedAt: Date;
    Members: GangMember[];
    Roles: GangRole[];
    static IMPORT_COOLDOWN_HOURS: number;
    static IMPORT_CANCEL_COOLDOWN_HOURS: number;
    static IMPORT_WAIT_HOURS: number;
    static IMPORT_BASE_SUCCESS_CHANCE: number;
    static IMPORT_SUCCESS_DECREASE_PER_LEVEL: number;
    static IMPORT_COST_BASE: number;
    static IMPORT_COST_PER_LEVEL: number;
    static IMPORT_CANCEL_REFUND_RATIO: number;
    static IMPORT_MIN_REWARDS: number;
    static IMPORT_MAX_REWARDS: number;
    static CREATION_COST: number;
    static JOIN_COST: number;
    static TIME_BETWEEN_DEPOSITS: number;
    static MAX_DEPOSIT_PER_DAY: number;
    static LEADER_ROLE_NAMES: string[];
    static MEMBER_ROLE_NAMES: string[];
    static RESERVED_ROLE_NAMES: string[];
    /**
     * Calculates the maximum number of members based on gang level and base ownership.
     * @returns The maximum number of members.
     */
    GetMaxMembers(): number;
    static GetJoinCostForLevel(level: number): number;
    GetJoinCost(): number;
    /**
     * Checks if a user can be added to the gang.
     * @returns True if the gang has space for more members, false otherwise.
     */
    CanAddMember(): boolean;
    /**
     * Calculates the experience required for the next level.
     * @param level The current level.
     * @returns The experience required for the next level.
     */
    static GetXpForNextLevel(level: number): number;
    /**
     * Adds experience to the gang and checks if it leveled up.
     * @param xp The amount of experience to add.
     * @returns True if the gang leveled up, false otherwise.
     */
    AddExperience(xp: number): Promise<boolean>;
    /**
     * Creates a new gang.
     * @param user The user creating the gang.
     * @param name The name of the gang.
     * @param acronym The acronym of the gang.
     * @param description The description of the gang.
     * @param color The color of the gang.
     * @param image The image URL of the gang (optional).
     * @returns The result object with the created gang or a failure reason.
     */
    static Create(user: User, name: string, acronym: string, description: string, color: GangColorId, image?: string | null, recruitmentType?: GangRecruitmentType): Promise<GangCreateResult>;
    /**
     * Gets a gang by its Id.
     * @param gangId The Id of the gang.
     * @returns The gang object, or null if not found.
     */
    static GetById(gangId: number): Promise<Gang | null>;
    /**
     * Gets basic gang info without loading members and roles.
     * Useful for performance when only basic data is needed.
     * @param gangId The gang Id.
     * @returns The gang object with basic info, or null if not found.
     */
    static GetBasicById(gangId: number): Promise<Gang | null>;
    /**
     * Helper method to populate a Gang object from a Gangs database model.
     * Loads members and roles.
     * @param gang The Gangs database model.
     * @returns The populated Gang object.
     */
    static GetInfo(gang: Gangs): Promise<Gang>;
    /**
     * Gets the gang a user belongs to.
     * @param userId The Id of the user.
     * @returns The gang object, or null if the user is not in a gang.
     */
    static GetByUserId(userId: string): Promise<Gang | null>;
    /**
     * Checks if a gang with the given name exists.
     * @param name The name to check.
     * @returns True if a gang with the name exists, false otherwise.
     */
    static CheckGangWithName(name: string): Promise<boolean>;
    /**
     * Checks if a gang with the given acronym exists.
     * @param acronym The acronym to check.
     * @returns True if a gang with the acronym exists, false otherwise.
     */
    static CheckGangWithAcronym(acronym: string): Promise<boolean>;
    /**
     * Finds a gang by its name or acronym.
     * @param name The name or acronym to search for.
     * @returns The gang object, or null if not found.
     */
    static FindByName(name: string): Promise<Gang | null>;
    /**
     * Loads the members of the gang from the database.
     */
    LoadMembers(): Promise<void>;
    /**
     * Loads the roles of the gang from the database.
     */
    LoadRoles(): Promise<void>;
    /**
     * Checks if a user has permission to invite others to the gang.
     * @param inviterId The Id of the user attempting to invite.
     * @returns True if the user has permission, false otherwise.
     */
    CanInvite(inviterId: string): boolean;
    CanInviteUser(targetUser: User): Promise<{
        canInvite: boolean;
        reason?: string;
    }>;
    /**
     * Accepts an invite to the gang.
     * @param user The user accepting the invite.
     * @returns True if the user successfully joined, false otherwise.
     */
    AcceptInvite(user: User): Promise<boolean>;
    /**
     * Checks if a user has permission to kick others from the gang.
     * @param kickerId The Id of the user attempting to kick.
     * @returns True if the user has permission, false otherwise.
     */
    CanKick(kickerId: string): boolean;
    /**
     * Kicks a member from the gang.
     * @param kicker The user performing the kick.
     * @param targetUser The user being kicked.
     * @returns True if the user was kicked successfully, false otherwise.
     */
    KickMember(kicker: User, targetUser: User): Promise<boolean>;
    /**
     * Changes the role of a gang member.
     * @param changerId The Id of the user performing the change.
     * @param targetUserId The Id of the user whose role is being changed.
     * @param newRoleId The Id of the new role.
     * @returns True if the role was changed successfully, false otherwise.
     */
    ChangeRole(changerId: string, targetUserId: string, newRoleId: number): Promise<boolean>;
    /**
     * Updates the gang's information in the database.
     * @returns True if the update was successful, false otherwise.
     */
    Update(): Promise<boolean>;
    /**
     * Gets the cost for starting a import.
     * @returns The cost.
     */
    GetImportCost(): number;
    /**
     * Gets the success chance for a import based on gang level.
     * @returns The success chance (0.0 - 1.0).
     */
    GetImportSuccessChance(): number;
    /**
     * Checks if a import is currently active.
     * @returns True if active, false otherwise.
     */
    IsImportActive(): boolean;
    /**
     * Checks if the gang can start a new import.
     * @returns An object with a boolean and an optional reason.
     */
    CanStartImport(): Promise<{
        can: boolean;
        reason?: GangImportFailureReason;
    }>;
    /**
     * Starts a new import.
     */
    StartImport(): Promise<void>;
    /**
     * Cancels the active import and refunds 2/3 of the cost.
     * @returns The amount refunded.
     */
    CancelImport(): Promise<number>;
    /**
     * Resolves the active import (success or failure).
     */
    ResolveImport(): Promise<void>;
    /**
     * Schedules all active shipments on bot startup.
     */
    static ScheduleAllActiveShipments(): Promise<void>;
    UpdateLastInvestmentRobbery(): Promise<boolean>;
    /**
     * Checks if a user has permission to edit the gang.
     * @param editorId The Id of the user attempting to edit.
     * @returns True if the user has permission, false otherwise.
     */
    CanEdit(editorId: string): boolean;
    /**
     * Checks if a user has permission to start or cancel imports for the gang.
     * @param userId The Id of the user.
     * @returns True if the user is leader or has permission, false otherwise.
     */
    CanImportShipments(userId: string): boolean;
    /**
     * Edits the gang's details.
     * @param name New name (optional).
     * @param acronym New acronym (optional).
     * @param description New description (optional).
     * @param color New color (optional).
     * @param image New image URL (optional).
     * @param recruitmentType New recruitment type (optional).
     * @returns True if the edit was successful, false otherwise.
     */
    Edit(name: string | null, acronym: string | null, description: string | null, color: GangColorId | null, image: string | null, recruitmentType?: GangRecruitmentType | null): Promise<boolean>;
    /**
     * Creates a new role in the gang.
     * @param creatorId The Id of the user creating the role (must be leader).
     * @param name The name of the new role.
     * @param permissions The permissions assigned to the role.
     * @returns True if the role was created successfully, false otherwise.
     */
    CreateRole(creatorId: string, name: string, permissions: GangPermission[]): Promise<boolean>;
    /**
     * Edits an existing role in the gang.
     * @param editorId The Id of the user editing the role (must be leader).
     * @param roleId The Id of the role to edit.
     * @param permissions The new permissions for the role.
     * @param name The new name for the role.
     * @returns True if the role was edited successfully, false otherwise.
     */
    EditRole(editorId: string, roleId: number, permissions: GangPermission[], name: string | null): Promise<boolean>;
    /**
     * Deletes a role from the gang.
     * @param deleterId The Id of the user deleting the role (must be leader).
     * @param roleId The Id of the role to delete.
     * @returns True if the role was deleted successfully, false otherwise.
     */
    DeleteRole(deleterId: string, roleId: number): Promise<boolean>;
    /**
     * Allows a user to leave the gang.
     * @param user The user leaving the gang.
     * @returns True if the user left successfully, false otherwise.
     */
    LeaveGang(user: User): Promise<boolean>;
    /**
     * Deletes the gang.
     * @param userId The Id of the user deleting the gang (must be leader).
     * @returns True if the gang was deleted successfully, false otherwise.
     */
    DeleteGang(userId: string): Promise<boolean>;
    /**
     * Generates a visual experience bar for the gang.
     * @param emoteCount The number of emotes to use for the bar.
     * @param language The language for formatting.
     * @returns A string representing the experience bar.
     */
    GetExpBar(emoteCount: number, language: Language): string;
    /**
     * Checks if a user can send official communications.
     * @param senderId The Id of the user.
     * @returns True if the user can communicate, false otherwise.
     */
    CanCommunicate(senderId: string): boolean;
    /**
     * Sends an official communication to all gang members.
     * @param sender The user sending the communication.
     * @param message The message content.
     * @returns A promise that resolves when the communication is sent.
     */
    OfficialCommunication(sender: User, message: IDescription | string): Promise<unknown[]>;
    /**
     * Sends a private message to a specific gang member.
     * @param member The target member.
     * @param message The message content (can be localized).
     * @param sender The user sending the message (optional).
     * @param specialMessage An special message/header (optional) (can be localized).
     * @returns A promise that resolves when the message is sent.
     */
    ComunicateMember(member: GangMember, message: IDescription | string, sender?: User, specialMessage?: IDescription | string): Promise<unknown>;
    /**
     * Sends a message to all gang members.
     * @param message The message content (can be localized).
     * @param sender The user sending the message (optional)
     * @param specialMessage An optional special message/header (can be localized).
     * @returns A promise that resolves when all messages are sent.
     */
    ComunicateAllMembers(message: IDescription | string, sender?: User, specialMessage?: IDescription | string): Promise<unknown[]>;
    /**
     * Gets the emote representing a member's permission level.
     * @param member The gang member.
     * @returns The emote string.
     */
    GetMemberEmote(member: GangMember): string;
    /**
     * Checks if a user can deposit money into the gang.
     * @param user The user attempting to deposit.
     * @param amount The amount to deposit.
     * @returns An object containing whether the deposit is allowed and a reason text.
     */
    CanDeposit(user: User, amount: number): Promise<{
        canDeposit: boolean;
        text: string;
    }>;
    /**
     * Deposits money into the gang.
     * @param user The user depositing money.
     * @param amount The amount to deposit.
     */
    Deposit(user: User, amount: number): Promise<void>;
    /**
     * Transfers leadership of the gang to another member.
     * @param currentUser The current leader.
     * @param targetUser The new leader.
     * @returns True if the transfer was successful, false otherwise.
     */
    TransferLeadership(currentUser: User, targetUser: User): Promise<boolean>;
    /**
     * Allows a user to join an open recruitment gang directly.
     */
    JoinOpenGang(user: User): Promise<{
        success: boolean;
        reason?: string;
    }>;
    /**
     * Submits a join request to an approval-based recruitment gang.
     */
    ApplyToGang(user: User, message?: string): Promise<{
        success: boolean;
        reason?: string;
    }>;
    /**
     * Resolves a pending join request (Accept or Reject).
     * Only the Leader or a member with Invite permission can resolve requests.
     */
    ResolveJoinRequest(manager: User, requestId: number, accept: boolean): Promise<{
        success: boolean;
        reason?: string;
    }>;
    /**
     * Cancels a user's pending join request.
     */
    static CancelJoinRequest(userId: string, requestId?: number): Promise<{
        success: boolean;
        reason?: string;
    }>;
}
export declare const Strings: {
    readonly 0: {
        readonly acceptText: "Accept";
        readonly declineText: "Decline";
        readonly invitation: {
            readonly description: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly footer: "You have 3 minutes to accept or decline the invitation.";
        };
        readonly notEnoughMoney: {
            readonly private: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly channel: (name: string) => string;
        };
        readonly success: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly notSuccess: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly decline: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly timeout: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string, gangName: string, gangAcronym: string) => string;
        };
        readonly depositCooldown: `You can deposit again`;
        readonly notEnoughMoneyDeposit: (amount: string) => string;
        readonly maxDepositReached: (max: string) => string;
        readonly mustBeIdling: `You must be ${string} Idling to deposit`;
    };
    readonly 1: {
        readonly acceptText: "Aceitar";
        readonly declineText: "Recusar";
        readonly invitation: {
            readonly description: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly footer: "Você tem 3 minutos para aceitar ou recusar o convite.";
        };
        readonly notEnoughMoney: {
            readonly private: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly channel: (name: string) => string;
        };
        readonly success: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly notSuccess: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly decline: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly timeout: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string, gangName: string, gangAcronym: string) => string;
        };
        readonly depositCooldown: `Você pode depositar novamente`;
        readonly notEnoughMoneyDeposit: (amount: string) => string;
        readonly maxDepositReached: (max: string) => string;
        readonly mustBeIdling: `Você precisa estar ${string} Vadiando para depositar`;
    };
    readonly 2: {
        readonly acceptText: "Aceptar";
        readonly declineText: "Rechazar";
        readonly invitation: {
            readonly description: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly footer: "Tienes 3 minutos para aceptar o rechazar la invitación.";
        };
        readonly notEnoughMoney: {
            readonly private: (gangName: string, gangAcronym: string, joinCost: number) => string;
            readonly channel: (name: string) => string;
        };
        readonly success: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly notSuccess: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly decline: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string) => string;
        };
        readonly timeout: {
            readonly private: (gangName: string, gangAcronym: string) => string;
            readonly channel: (name: string, gangName: string, gangAcronym: string) => string;
        };
        readonly depositCooldown: `Puedes depositar de nuevo`;
        readonly notEnoughMoneyDeposit: (amount: string) => string;
        readonly maxDepositReached: (max: string) => string;
        readonly mustBeIdling: `Debes estar ${string} Vagando para depositar`;
    };
};
