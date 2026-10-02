export enum AdminAuditActionId {
	SetMainHeistAllowed = 1,
	EndSeason = 2,
	CreateEvent = 3,
	UpdateEvent = 4,
	DeleteEvent = 5,
	SetMoney = 6,
	CureUser = 7,
	FreeUser = 8,
	ResetCooldown = 9,
	RemoveAction = 10,
	SetItem = 11,
	AddSpecialCoins = 12,
	SetClass = 13,
	SetNickname = 14,
	SetVip = 15,
	KillUser = 16,
	AddBadge = 17,
	RemoveBadge = 18,
	SwapUsers = 19,
	DeleteUser = 20,
}

export enum AdminAuditSettingId {
	MainHeist = 1,
	Season = 2,
	Events = 3,
	UserAccounts = 4,
}

export interface AdminAuditRequestInfo {
	ipAddress: string | null;
	userAgent: string | null;
}
