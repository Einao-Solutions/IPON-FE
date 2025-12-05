import { UserRoles, ApplicationStatuses, FormApplicationTypes, FileTypes } from '$lib/helpers';

// Role display information
export interface RoleDisplayInfo {
	title: string;
	department: string;
	fileTypes: FileTypes[];
}

// Permission configuration for each role
export interface RolePermission {
	applicationTypes: FormApplicationTypes[];
	statusPermissions: Record<FormApplicationTypes, ApplicationStatuses[]>;
}

// Main configuration object
export const ROLE_PERMISSIONS: Record<UserRoles, RolePermission> = {
	// Trademark Search Officer
	[UserRoles.TrademarkSearch]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.ClericalUpdate,
			FormApplicationTypes.DataUpdate
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.ClericalUpdate]: [
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.DataUpdate]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Patent Search Officer
	[UserRoles.PatentSearch]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.ClericalUpdate,
			FormApplicationTypes.DataUpdate
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.ClericalUpdate]: [
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.DataUpdate]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Design Search Officer
	[UserRoles.DesignSearch]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.ClericalUpdate,
			FormApplicationTypes.DataUpdate
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.ClericalUpdate]: [
				ApplicationStatuses.Re_conduct
			],
			[FormApplicationTypes.DataUpdate]: [
				ApplicationStatuses.AwaitingSearch,
				ApplicationStatuses.Re_conduct,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Trademark Examiner
	[UserRoles.TrademarkExaminer]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.PublicationStatusUpdate,
			FormApplicationTypes.WithdrawalRequest
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingExaminer,
				ApplicationStatuses.Rejected,
				ApplicationStatuses.KivExaminer
			],
			[FormApplicationTypes.PublicationStatusUpdate]: [
				ApplicationStatuses.AwaitingStatusUpdate,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.WithdrawalRequest]: [
				ApplicationStatuses.RequestWithdrawal,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Patent Examiner
	[UserRoles.PatentExaminer]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.PublicationStatusUpdate,
			FormApplicationTypes.WithdrawalRequest,
			FormApplicationTypes.AppealRequest
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingExaminer,
				ApplicationStatuses.Rejected,
				ApplicationStatuses.KivExaminer
			],
			[FormApplicationTypes.PublicationStatusUpdate]: [
				ApplicationStatuses.AwaitingStatusUpdate,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.WithdrawalRequest]: [
				ApplicationStatuses.RequestWithdrawal,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.AppealRequest]: [
				ApplicationStatuses.Approved,
				ApplicationStatuses.AppealRequest,
				ApplicationStatuses.Rejected
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Design Examiner
	[UserRoles.DesignExaminer]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.PublicationStatusUpdate,
			FormApplicationTypes.WithdrawalRequest,
			FormApplicationTypes.AppealRequest
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.AwaitingExaminer,
				ApplicationStatuses.Rejected,
				ApplicationStatuses.KivExaminer
			],
			[FormApplicationTypes.PublicationStatusUpdate]: [
				ApplicationStatuses.AwaitingStatusUpdate,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.WithdrawalRequest]: [
				ApplicationStatuses.RequestWithdrawal,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.AppealRequest]: [
				ApplicationStatuses.Approved,
				ApplicationStatuses.AppealRequest,
				ApplicationStatuses.Rejected
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Trademark Publication/Opposition
	[UserRoles.TrademarkPublication]: {
		applicationTypes: [FormApplicationTypes.NewApplication],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Publication,
				ApplicationStatuses.Opposition
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Trademark Opposition
	[UserRoles.TrademarkOpposition]: {
		applicationTypes: [FormApplicationTypes.NewApplication],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Publication,
				ApplicationStatuses.Opposition
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Trademark Acceptance
	[UserRoles.TrademarkAcceptance]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.Amendment,
			FormApplicationTypes.WithdrawalRequest,
			FormApplicationTypes.AppealRequest
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Publication
			],
			[FormApplicationTypes.Amendment]: [
				ApplicationStatuses.Approved,
				ApplicationStatuses.AwaitingConfirmation
			],
			[FormApplicationTypes.WithdrawalRequest]: [
				ApplicationStatuses.RequestWithdrawal,
				ApplicationStatuses.Approved,
				ApplicationStatuses.Rejected
			],
			[FormApplicationTypes.AppealRequest]: [
				ApplicationStatuses.Approved,
				ApplicationStatuses.AppealRequest,
				ApplicationStatuses.Rejected
			],
			// Default empty arrays for other types
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Trademark Certification
	[UserRoles.TrademarkCertification]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.LicenseRenewal,
			FormApplicationTypes.Assignment,
			FormApplicationTypes.Merger,
			FormApplicationTypes.ChangeOfName,
			FormApplicationTypes.ChangeOfAddress,
			FormApplicationTypes.RegisteredUser
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.LicenseRenewal]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.Assignment]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.Merger]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfName]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfAddress]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.RegisteredUser]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Patent Certification
	[UserRoles.PatentCertification]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.LicenseRenewal,
			FormApplicationTypes.Assignment,
			FormApplicationTypes.Merger,
			FormApplicationTypes.ChangeOfName,
			FormApplicationTypes.ChangeOfAddress,
			FormApplicationTypes.RegisteredUser
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.LicenseRenewal]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.Assignment]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.Merger]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfName]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfAddress]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.RegisteredUser]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Design Certification
	[UserRoles.DesignCertification]: {
		applicationTypes: [
			FormApplicationTypes.NewApplication,
			FormApplicationTypes.LicenseRenewal,
			FormApplicationTypes.Assignment,
			FormApplicationTypes.Merger,
			FormApplicationTypes.ChangeOfName,
			FormApplicationTypes.ChangeOfAddress,
			FormApplicationTypes.RegisteredUser
		],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.LicenseRenewal]: [
				ApplicationStatuses.Active,
				ApplicationStatuses.AwaitingCertification,
				ApplicationStatuses.AwaitingCertificateConfirmation
			],
			[FormApplicationTypes.Assignment]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.Merger]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfName]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.ChangeOfAddress]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			[FormApplicationTypes.RegisteredUser]: [
				ApplicationStatuses.AwaitingRecordalProcess,
				ApplicationStatuses.Approved
			],
			// Default empty arrays for other types
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	// Default roles with full access
	[UserRoles.User]: {
		applicationTypes: [],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [],
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	},

	[UserRoles.Staff]: {
		applicationTypes: [],
		statusPermissions: {
			[FormApplicationTypes.NewApplication]: [],
			[FormApplicationTypes.LicenseRenewal]: [],
			[FormApplicationTypes.DataUpdate]: [],
			[FormApplicationTypes.Recapture]: [],
			[FormApplicationTypes.None]: [],
			[FormApplicationTypes.Assignment]: [],
			[FormApplicationTypes.Ownership]: [],
			[FormApplicationTypes.RegisteredUser]: [],
			[FormApplicationTypes.Merger]: [],
			[FormApplicationTypes.ChangeOfName]: [],
			[FormApplicationTypes.ChangeOfAddress]: [],
			[FormApplicationTypes.ClericalUpdate]: [],
			[FormApplicationTypes.StatusSearch]: [],
			[FormApplicationTypes.AppealRequest]: [],
			[FormApplicationTypes.PublicationStatusUpdate]: [],
			[FormApplicationTypes.WithdrawalRequest]: [],
			[FormApplicationTypes.NewOpposition]: [],
			[FormApplicationTypes.Amendment]: [],
			[FormApplicationTypes.Certification]: []
		}
	}
};

// Role display configuration
export const ROLE_DISPLAY_CONFIG: Record<UserRoles, RoleDisplayInfo> = {
	[UserRoles.TrademarkSearch]: {
		title: 'Trademark Search Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.PatentSearch]: {
		title: 'Patent Search Officer',
		department: 'Patent Department',
		fileTypes: [FileTypes.Patent]
	},
	[UserRoles.DesignSearch]: {
		title: 'Design Search Officer',
		department: 'Design Department',
		fileTypes: [FileTypes.Design]
	},
	[UserRoles.TrademarkExaminer]: {
		title: 'Trademark Examiner Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.PatentExaminer]: {
		title: 'Patent Examiner Officer',
		department: 'Patent Department',
		fileTypes: [FileTypes.Patent]
	},
	[UserRoles.DesignExaminer]: {
		title: 'Design Examiner Officer',
		department: 'Design Department',
		fileTypes: [FileTypes.Design]
	},
	[UserRoles.TrademarkPublication]: {
		title: 'Trademark Publication Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.TrademarkOpposition]: {
		title: 'Trademark Opposition Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.TrademarkAcceptance]: {
		title: 'Trademark Acceptance Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.TrademarkCertification]: {
		title: 'Trademark Certification Officer',
		department: 'Trademark Department',
		fileTypes: [FileTypes.Trademark]
	},
	[UserRoles.PatentCertification]: {
		title: 'Patent Certification Officer',
		department: 'Patent Department',
		fileTypes: [FileTypes.Patent]
	},
	[UserRoles.DesignCertification]: {
		title: 'Design Certification Officer',
		department: 'Design Department',
		fileTypes: [FileTypes.Design]
	},
	// Default roles
	[UserRoles.User]: {
		title: 'User',
		department: 'General',
		fileTypes: [FileTypes.Patent, FileTypes.Design, FileTypes.Trademark]
	},
	[UserRoles.Staff]: {
		title: 'Staff Officer',
		department: 'General',
		fileTypes: [FileTypes.Patent, FileTypes.Design, FileTypes.Trademark]
	}
};

// Global application types that show for all roles
export const GLOBAL_APPLICATION_TYPES = [
	FormApplicationTypes.StatusSearch,
	FormApplicationTypes.Ownership
];

// Utility functions
export function getRolePermissions(role: UserRoles): RolePermission {
	return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[UserRoles.User];
}

export function getRoleDisplayInfo(role: UserRoles): RoleDisplayInfo {
	return ROLE_DISPLAY_CONFIG[role] || ROLE_DISPLAY_CONFIG[UserRoles.User];
}

export function getAllowedApplicationTypes(role: UserRoles): FormApplicationTypes[] {
	const permissions = getRolePermissions(role);
	return [...new Set([...permissions.applicationTypes, ...GLOBAL_APPLICATION_TYPES])];
}

export function getAllowedStatuses(role: UserRoles, appType: FormApplicationTypes): ApplicationStatuses[] {
	const permissions = getRolePermissions(role);
	return permissions.statusPermissions[appType] || [];
}

export function getUserPrimaryFileType(roles: UserRoles[]): FileTypes | null {
	// Determine primary file type based on roles
	if (roles.some(r => [UserRoles.TrademarkSearch, UserRoles.TrademarkExaminer, UserRoles.TrademarkPublication, UserRoles.TrademarkOpposition, UserRoles.TrademarkAcceptance, UserRoles.TrademarkCertification].includes(r))) {
		return FileTypes.Trademark;
	}
	if (roles.some(r => [UserRoles.PatentSearch, UserRoles.PatentExaminer, UserRoles.PatentCertification].includes(r))) {
		return FileTypes.Patent;
	}
	if (roles.some(r => [UserRoles.DesignSearch, UserRoles.DesignExaminer, UserRoles.DesignCertification].includes(r))) {
		return FileTypes.Design;
	}
	return null;
}