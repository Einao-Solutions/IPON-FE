import { writable } from 'svelte/store';
import type {
	ApplicationHistoryType,
	ApplicationPageData, assignmentType, CorrespondenceType, DashBoardStats,
	PatentData,
	TicketSummary,
	UsersType
} from '$lib/helpers';

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

let initialToken: string | null = null;
let initialUser: UsersType | null = null;

if (typeof document !== 'undefined') {
    const token = getCookie('auth_token');
    if (token) initialToken = token;

    const userCookie = getCookie('user');
    if (userCookie) {
        try {
            initialUser = JSON.parse(userCookie) as UsersType;
        } catch {
            initialUser = null;
        }
    }
}
export const currentScreen = writable(0);
export const newApplicationType = writable<number|null>(null);
export const applicationScreen = writable(0);
export const savePageData = writable<string|null>(null);
export const pageValidationStatus = writable<boolean|null>(null);
export const pageSaveStatus = writable<boolean|null>(null);
export const isPCT = writable<boolean|null>(null);
export const hasPriority = writable<boolean>(false);
export const formsData = writable<ApplicationPageData[]|null>([]);
export const applicationMode = writable<number|null>(null);
export const applicationData = writable<PatentData|null>(null);
export const changesMade = writable<{ name:string, hasChanges:boolean }[] | null>(null);
export const adjustmentType = writable<number|null>(null);
export const adjustmentsMade = writable<string[]|null>(null)
export const newDataApp = writable<PatentData|null>(null);
export const loggedInUser= writable<UsersType|null>(initialUser);
export const loggedInToken= writable<string|null>(initialToken);
export const validatePage = writable<string|null>(null);
export const validatedPages = writable<{ name:string, status:boolean}[] | null>([]);
export const createdData = writable<PatentData|null>(null);
export const DashStats = writable<DashBoardStats|null>(null);
export const viewUpdatesMade = writable<ApplicationHistoryType|null>(null);
export const listOfIds= writable<string[]>([]);
export const queryBody = writable<string|null>(null);
export const appattachmentsData = writable<[{name:string,data:File[]}]>([{name:"", data:[]}]);
export const otherPaymentAttachment = writable<File|undefined>(undefined);
export const changesData= writable<{}>({})
export const ticketsSummary = writable<TicketSummary[]|null>(null)
export const ticketStats = writable<{}>({})
export const assignmentData = writable<assignmentType|null>(null)
export const currentMenuView = writable<string|null>("Dashboard");
export const metaDataInfo=writable<any|null>(null);
export const selectedFilesForAction = writable<string[]|undefined>(undefined);