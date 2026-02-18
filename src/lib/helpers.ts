import { countriesMap } from "$lib/constants";
import type { DesignTypes } from "$lib/designutils";
import * as valid from "validator";
import { isValidPhoneNumber } from "libphonenumber-js";
import { loggedInUser } from "$lib/store";
import { goto } from "$app/navigation";
import type { A } from "vitest/dist/chunks/environment.LoooBwUu.js";

export const baseURL = "http://localhost:5044";
// export const baseURL = "https://backend.einaotest.com";
// export const baseURL = "https://integration.iponigeria.com";
export const localhost = "http://localhost:5044";

export const nonConventionalDescription =
  "Filing new patent application with protection in Nigeria only.";
export const conventionalDescription =
  "This patent application has been filed in at least one other country which is a member state of the Paris Convention. Applicants have 12 Months within which to file in Nigeria and claim foreign priority.";
export const pctDescription =
  "This patent application has been filed via Patent Corporation Treaty Route and now seeks to secure protection specifically in Nigeria. Applicants have 31 months within which to file in Nigeria and claim priority.";
export const applicantPatentDescription =
  "Applicants are either  organizations or persons with interest in the patent";
export const applicantDesignDescription =
  "Applicants are either  organizations or persons with interest in the design";
export const applicantTrademarkDescription =
  "Applicants are either  organizations or persons with interest in the trademark";
export const correspondenceDescription =
  "Legal representative or an individual to be contacted regarding the application should the need arise. All letters and payment information would be communicated via the details entered in this section";
export const priorityDescription =
  "Information regarding application that has been filled in another country (optional)";
export type Inventor = {
  id: string;
  name: string;
  country: string;
  phone: string;
  phonePrefix: string;
  email: string;
  address: string;
};
export type InventorValidator = {
  name: boolean | null;
  country: boolean | null;
  city: boolean | null;
  phone: boolean | null;
  email: boolean | null;
  address: boolean | null;
};
export type DesignCreator = {
  id: string;
  name: string;
  phone: string;
  address: string;
  country: string;
  email: string;
};
export type Applicant = {
  id: string;
  name: string;
  country: string;
  address: string;
  phone: string;
  phonePrefix: string;
  email: string;
};
export type RegisteredUser = {
  name: string;
  phone: string;
  email: string;
};
export type BasicType = {
  id: string;
  title: string;
  abstract: string;
  patentType: number;
  patentApplicationType: number;
};
export type Priority = {
  id: string;
  number: string;
  country: string;
  date: string;
};
export type FirstPriority = {
  id: string;
  number: string;
  country: string;
  date: string;
};

export type ApplicantValidator = {
  name: boolean | null;
  country: boolean | null;
  address: boolean | null;
  phone: boolean | null;
  email: boolean | null;
};
export type PriorityValidator = {
  number: boolean | null;
  country: boolean | null;
  date: boolean | null;
};

export type RevisionsType = {
  id: string | null;
  field: string | null;
  oldTitle: unknown | null;
  newTitle: unknown | null;
  status: ApplicationStatuses | null;
  statusHistory: [] | null;
  dateTime: number | null;
};
export const PatentSections = [
  {
    name: "basic",
    icon: "material-symbols:info-outline",
    description: "Patent Information",
  },
  {
    name: "inventors",
    icon: "streamline:ai-science-spark",
    description: "inventors",
  },
  { name: "applicant", description: "applicants", icon: "mdi:people-outline" },
  {
    name: "correspondence",
    description: "correspondence",
    icon: "material-symbols-light:business-center-outline-rounded",
  },
  {
    name: "priority",
    description: "Priority Info",
    icon: "pepicons-print:letter",
  },
  {
    name: "attachments",
    description: "Attachments",
    icon: "teenyicons:attachment-outline",
  },
  { name: "verification", description: "Verification", icon: "ooui:check-all" },
];
export const DesignSections = [
  {
    name: "designBasic",
    icon: "material-symbols:info-outline",
    description: "Design information",
  },
  {
    name: "designCreators",
    icon: "streamline:ai-science-spark",
    description: "creators",
  },
  { name: "applicant", description: "applicants", icon: "mdi:people-outline" },
  {
    name: "correspondence",
    description: "correspondence",
    icon: "material-symbols-light:business-center-outline-rounded",
  },
  {
    name: "attachments",
    description: "Attachments",
    icon: "teenyicons:attachment-outline",
  },
  { name: "verification", description: "Verification", icon: "ooui:check-all" },
];
export const TrademarkSections = [
  {
    name: "basicTrade",
    icon: "material-symbols:info-outline",
    description: "Trademark information",
  },
  { name: "applicant", description: "applicants", icon: "mdi:people-outline" },
  {
    name: "correspondence",
    description: "correspondence",
    icon: "material-symbols-light:business-center-outline-rounded",
  },
  {
    name: "attachments",
    description: "Attachments",
    icon: "teenyicons:attachment-outline",
  },
  { name: "verification", description: "Verification", icon: "ooui:check-all" },
];

export type CorrespondenceType = {
  id: string;
  name: string;
  state: string;
  address: string;
  email: string;
  phone: string;
  nationality: string;
};
export type BasicPatentType = {
  title: string;
  abstract: string;
  patentType: number;
  patentApplicationType: number;
};
export type BasicDesignType = {
  title: string;
  statementOfNovelty: string;
  designType: DesignTypes;
};

export type AttachmentType = {
  type: number;
  data: {
    fileName: string;
    url: string;
  }[];
};

export type ApplicationPageData = {
  name: string;
  data: unknown;
};

export type PatentData = {
  id: string;
  titleOfTradeMark: string | null;
  trademarkClass: number | null;
  trademarkClassDescription: string | null;
  filingCountry: string | null;
  fileOrigin: string | null;
  trademarkLogo: number | null;
  trademarkType: number | null;
  trademarkDisclaimer: string | null;
  lastRequestDate: string | null;
  lastRequest: string | null;
  titleOfDesign: string | null;
  type: number | null;
  fileStatus: number | null;
  statementOfNovelty: string | null;
  titleOfInvention: string | null;
  patentAbstract: string | null;
  applicants: Applicant[] | null;
  priorityInfo: Priority[] | null;
  firstPriorityInfo: FirstPriority[] | null;
  inventors: Inventor[] | null;
  designCreators: Inventor[] | null;
  correspondence: CorrespondenceType | null;
  patentApplicationType: number | null;
  patentType: number | null;
  patentBaseType: string | null;
  designType: number | null;
  fileId: string | null;
  formApplicationType: FormApplicationTypes | null;
  attachments: { name: string; url: string[] }[] | null;
  creatorAccount: string | null;
  dateCreated: string | null;
  fieldStatus: { [key: string]: number } | null;
  registeredUsers: RegisteredUser[] | null;
  oppositions: OppositionHistoryType[] | null;
  applicationHistory: ApplicationHistoryType[] | null;
};

export type PatentCreationData = {
  titleOfInvention: string | null;
  patentAbstract: string | null;
  applicants: Applicant[] | null;
  priorityInfo: Priority[] | null;
  inventors: Inventor[] | null;
  correspondence: CorrespondenceType | null;
  patentType: PatentTypes;
  formApplicationType: FormApplicationTypes | null;
  status: ApplicationStatuses | null;
  type: FilingType | null;
  attachments: { name: string; url: string[] }[] | null;
  creatorAccount: string | null;
};

export enum FormApplicationTypes {
  NewApplication = 0,
  LicenseRenewal = 1,
  DataUpdate = 2,
  Recapture = 3,
  None = 4,
  Assignment = 5,
  Ownership = 6,
  RegisteredUser = 7,
  Merger = 8,
  ChangeOfName = 9,
  ChangeOfAddress = 10,
  ClericalUpdate = 11,
  StatusSearch = 12,
  AppealRequest = 13,
  PublicationStatusUpdate = 14,
  WithdrawalRequest = 15,
  NewOpposition = 16,
  Amendment = 17,
  Certification = 18,
  License = 19,
  Mortgage = 20,
  CertifiedTrueCopy = 21,
}

export enum ApplicationLetters {
  NewApplicationReceipt = 0,
  NewApplicationAcknowledgement = 1,
  NewApplicationAcceptance = 2,
  NewApplicationCertificate = 3,
  NewApplicationRejection = 4,
  RenewalReceipt = 5,
  RenewalAck = 6,
  RenewalCertificate = 7,
  RecordalReceipt = 8,
  RecordalAck = 9,
  RecordalCertificate = 10,
  AssignmentReceipt = 11,
  AssignmentAck = 12,
  AssignmentCert = 13,
  AssignmentRejection = 14,
  NewOppositionReceipt = 15,
  NewOppositionAck = 16,
  OppositionResponseReceipt = 17,
  OppositionResponseAck = 18,
  OppositionResolutionReceipt = 19,
  OppositionResolutionAck = 20,
  NewApplicationCertificateAck = 21,
  NewApplicationCertificateReceipt = 22,
  ChangeOfAddressAck = 31,
  ChangeOfNameAck = 32,
  ChangeOfAddressReceipt = 33,
  ChangeOfNameReceipt = 34,
  CLericalUpdateReceipt = 35,
  ClericalUpdateAck = 36,
  NewTrademarkAppReceipt = 37,
  StatusSearchReport = 38,
  StatusSearchReceipt = 39,
  AppealAck = 40,
  PatentRenewalAcknowledgementLetter = 41,
  PatentRenewalReceipt = 42,
  PatentRenewalCertificate = 43,
  PublicationStatusUpdateAcknowledgement = 44,
  PublicationStatusUpdateReceipt = 45,
  PublicationStatusUpdateApproval = 46,
  PublicationStatusUpdateRefusal = 47,
  WithdrawalRequestAcknowledgement = 50,
  WithdrawalRequestReceipt = 51,
  WithdrawalRequestApproval = 52,
  WithdrawalRequestRefusal = 53,
}

export enum ApplicationStatuses {
  Active = 0,
  Expired = 1,
  AwaitingPayment = 2,
  AwaitingSearch = 3,
  AwaitingExaminer = 4,
  RejectedByExaminer = 5,
  Re_conduct = 6,
  FormalityFail = 7,
  KivSearch = 8,
  KivExaminer = 9,
  Approved = 10,
  Rejected = 11,
  None = 12,
  AutoApproved = 13,
  Publication = 14,
  Opposition = 15,
  AwaitingResponse = 16,
  AwaitingOppositionStaff = 17,
  AwaitingResolution = 18,
  Resolved = 19,
  AwaitingCertification = 20,
  AwaitingConfirmation = 21,
  AwaitingSave = 22,
  AwaitingCertificateConfirmation = 23,
  Withdrawn = 24,
  AwaitingCertificatePayment = 25,
  AwaitingRecordalProcess = 26,
  AppealRequest = 27,
  AwaitingStatusUpdate = 28,
  RequestWithdrawal = 29,
  NewOpposition = 30,
  AwaitingCounter = 31,
  Amendment = 32,
  Value,
}
export enum PatentTypes {
  Conventional = 0,
  Non_Conventional = 1,
  PCT = 2,
}
export enum ClericalUpdateTypes {
  CorrespondenceInformation,
  DesignInformation,
  CreatorInformation,
  DesignAttachments,
  ApplicantName,
  ApplicantAddress,
  FileClass,
  FileTitle,
  AddApplicant,
  RemoveApplicant,
  AddAndRemoveApplicant,
  EditInventors,
  PriorityInfo,
  TrademarkType,
}
export enum PatentApplicationTypes {
  Patent = 0,
  Business_Method = 1,
  Utility_Model = 2,
}

export enum UserTypes {
  User = "User",
  Staff = "Staff",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
}
export enum AccountTypes {
  Individual = 0,
  Corporate = 1,
  Officer = 2,
  Tech = 3,
}
export enum UserRoles {
  User,
  Staff,
  TrademarkSearch,
  TrademarkExaminer,
  TrademarkOpposition,
  TrademarkAcceptance,
  TrademarkCertification,
  TrademarkPublication,
  TrademarkRegistrar,
  PatentSearch,
  PatentExaminer,
  PatentCertification,
  AppealExaminer,
  DesignSearch,
  DesignExaminer,
  DesignCertification,
  PatentDesignRegistrar,
  Finance,
  PermSec,
  Minister,
  Tech,
  SuperAdmin,
}

export enum FilingType {
  Patent = 0,
  Design = 1,
  Trademark = 2,
}

export function GetCountryImageLink(country: string) {
  const key = Object.keys(countriesMap).find(
    (key) => countriesMap[key as keyof typeof countriesMap] === country,
  );
  return `https://flagcdn.com/20x15/${key}.png`;
}

export function getStatusColour(status: ApplicationStatuses) {
  switch (status) {
    case ApplicationStatuses.AwaitingPayment:
      return "#8a00c2";
    case ApplicationStatuses.AwaitingSearch:
    case ApplicationStatuses.AwaitingExaminer ||
      ApplicationStatuses.AwaitingCounter:
      return "#9B870C";
    case ApplicationStatuses.KivSearch:
    case ApplicationStatuses.KivExaminer:
      return "#cfcec3";
    case ApplicationStatuses.FormalityFail:
      return "#FAA0A0";
    case ApplicationStatuses.Re_conduct:
      return "#FAA0A0";
    case ApplicationStatuses.Approved:
      return "#003300";
    case ApplicationStatuses.AwaitingRecordalProcess:
      return "#29C5F6";
  }
}

export function MapAttachmentToString(attachmentName: string) {
  switch (attachmentName) {
    case "pct":
      return "PCT Document";
    case "patentDrawing":
      return "Patent Drawing";
    case "pdoc":
      return "Priority Document";
    case "cs":
      return "Claims and Specifications";
    case "form2":
      return "Power of Attorney";
    case "poa":
      return "Power of Attorney";
    case "any":
      return "Other Document";
    case "designs":
      return "Design representations";
    case "nov":
      return "Novelty Statement";
    case "representation":
      return "Proposed trademark representation";
    case "other1":
      return "Supporting document 1";
    case "other2":
      return "Supporting document 2";
    case "authorization":
      return "letter of authorization";
    case "complete_specifications":
      return "Complete specifications";
    case "deed_of_assignment":
      return "Deed of assignment";
    default:
      return "Supporting Document";
  }
}

export type DataHistory = {
  date: string;
  beforeStatus: ApplicationStatuses | null;
  afterStatus: ApplicationStatuses | null;
  message: string;
  userId: string;
  user: string;
};
export type ApplicationHistoryType = {
  applicationType: number | null;
  id: string;
  applicationDate: string;
  certificatePaymentId?: string | null;
  expiryDate: string | null;
  currentStatus: number | null;
  applicationLetters: number[] | null;
  paymentId: string | null;
  oldValue: unknown | null;
  newValue: unknown | null;
  fieldToChange: string | null;
  statusHistory: [] | null;
};
export type TreatAppealType = {
  id: string;
  reason: string | null;
  IsTreated: boolean;
};
export type OppositionHistoryType = {
  id: string;
  FileId: string;
  Name: string;
  Address: string;
  Email: string;
  Phone: string;
  Nationality: string;
  Reason: string;
  SupportingDocs: [];
  Status: ApplicationStatuses | null;
  OppositionDate: string | null;
  PaymentId: string | null;
  IsCountered: boolean;
  IsTreated: boolean;
  Paid: boolean;
};
export type AffectedFiles = {
  fileID: string;
  title: string;
  id: string;
  applicant: string | null;
};
export enum TicketStates {
  awaitingUser = 0,
  awaitingStaff = 1,
  closed = 2,
}

export type TicketSummary = {
  id: string;
  creator: {
    id: string;
    name: string;
  };
  title: string;
  lastInteraction: string;
  creationDate: string;
  status: number;
  resolution: {
    Date: string;
    StaffId: string;
    StaffName: string;
  } | null;
};

export type TicketInfo = {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  correspondences: {
    id: string;
    message: string;
    attachment: string | null;
    senderId: string;
    senderName: string;
    dateAdded: string;
  }[];
  status: TicketStates;
  resolution: {
    date: string;
    staffId: string;
    staffName: string;
  } | null;
  created: string;
  affectedFiles:
    | {
        id: string;
        fileNumber: string;
      }[]
    | null;
};

export type SupportForm = {
  dateRange: string;
  statuses: TicketStates[];
  title: string;
};

export type UsersType = {
  id: string;
  creatorId: string;
  firstName: string;
  lastName: string;
  email: string;
  userRoles: UserRoles[];
  accountType: AccountType;
};

export enum AccountType {
  Individual = 0,
  Corporate = 1,
  Officer = 2,
  Tech = 3,
}
export type NotificationsType = {
  support: number;
  opposition: number;
};
export type DashBoardStats = {
  detailedStats: FileStatsType[];
  fileStats: { fileType: FileTypes; count: number }[];
  inactive: { total: number }[];
};
export type FileStatsType = {
  type: FormApplicationTypes;
  status: ApplicationStatuses;
  count: number;
  fileType: FileTypes;
};

export enum FileTypes {
  Patent = 0,
  Design = 1,
  Trademark = 2,
}

export type assignmentType = {
  fileId: string;
  fileNumber: string;
  fileTitle: string;
  rrr: string;
  applicationId: string;
  applicant: string;
  amount: string;
  type: number;
};

export type FinanceData = {
  total?: string | null;
  techFee?: string | null;
  ministryFee?: string | null;
  type?: string | null;
  country?: string | null;
};

export type PerformanceData = {
  applicationsCount: {
    applicationType: number;
    fileType: number;
    amount: number;
  }[];
  treatedCount: {
    amount: number;
    user: string;
    fileType: number;
    before: number;
    after: number;
  }[];
  endDate: string;
  patent: {
    newCreations: number;
    renewals: number;
    dataUpdate: number;
    stats: { type: ApplicationStatuses; count: number }[];
  };
  design: {
    newCreations: number;
    renewals: number;
    dataUpdate: number;
    stats: { type: ApplicationStatuses; count: number }[];
  };
  averageTimeInSearch: string;
  averageTimeInExaminer: string;
  tickets: {
    closed: number;
    created: number;
    closersNames: string[];
    ticketsRespondedTo: string[];
  };
};

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function decodeUser() {
  const cookieUser = document.cookie
    .split(";")
    .find((x) => x.startsWith(" user=") || x.startsWith("user="));
  if (!cookieUser) {
    await goto("/auth/");
    return;
  } else {
    let user = cookieUser.trimStart();
    user = user.slice(5);
    const parsed = decodeURIComponent(user);
    loggedInUser.set(JSON.parse(parsed));
  }
}

export function toByteArray(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  }).then((arrayBuffer) => new Uint8Array(arrayBuffer));
}

export function hasValidCorrespondenceDetails(data?: CorrespondenceType) {
  const validName =
    data?.name !== "-" &&
    data?.name?.toLowerCase() !== "null" &&
    data?.name != null &&
    data?.name !== undefined;
  const validEmail = valid.isEmail(data?.email?.trim() ?? "");
  const validNigerianNumber = isValidPhoneNumber(
    data?.phone?.trim() ?? "",
    "NG",
  );
  const validAddress =
    data?.address !== "-" &&
    data?.address?.toLowerCase() !== "null" &&
    data?.address != null &&
    data?.address !== undefined;
  return validName && validEmail && validAddress && validNigerianNumber;
}

export function getDefaultCorr() {
  const defaultCorrCookie = document.cookie
    .split(";")
    .find((x) => x.startsWith(" defaultcorr=") || x.startsWith("defaultcorr="));
  if (!defaultCorrCookie) {
    return null;
  }
  let defaultCorr = defaultCorrCookie.trimStart();
  defaultCorr = defaultCorr.slice(12);
  return JSON.parse(defaultCorr);
}

export function setDefaultCorr(data) {
  const defaultCorrCookie = `defaultcorr=${JSON.stringify(data)}; path=/`;
  document.cookie = defaultCorrCookie.trimStart();
}

export function mapRoleToString(type: number) {
  switch (type) {
    case UserRoles.TrademarkSearch:
      return "Trademark Search";
    case UserRoles.TrademarkExaminer:
      return "Trademark Examiner";
    case UserRoles.TrademarkOpposition:
      return "Trademark Opposition";
    case UserRoles.TrademarkAcceptance:
      return "Trademark Acceptance";
    case UserRoles.TrademarkCertification:
      return "Trademark Certification";
    case UserRoles.TrademarkRegistrar:
      return "Trademark Registrar";
    case UserRoles.PatentSearch:
      return "Patent Search";
    case UserRoles.PatentExaminer:
      return "Patent Examiner";
    case UserRoles.PatentCertification:
      return "Patent Certification";
    case UserRoles.DesignSearch:
      return "Design Search";
    case UserRoles.DesignExaminer:
      return "Design Examiner";
    case UserRoles.DesignCertification:
      return "Design Certification";
    case UserRoles.PatentDesignRegistrar:
      return "Patent/Design Registrar";
    case UserRoles.Ministry:
      return "Ministry Admin";
    case UserRoles.Tech:
      return "Tech/Support";
    case UserRoles.SuperAdmin:
      return "Super Admin";
    default:
      return "Unknown";
  }
}

export function getPatentTypeLabel(value: number): string {
  switch (value) {
    case PatentTypes.Conventional:
      return "Conventional";
    case PatentTypes.Non_Conventional:
      return "Non-Conventional";
    case PatentTypes.PCT:
      return "PCT";
    default:
      return value.toString();
  }
}

export function getPatentApplicationTypeLabel(value: number): string {
  switch (value) {
    case PatentApplicationTypes.Patent:
      return "Patent";
    case PatentApplicationTypes.Business_Method:
      return "Business Method";
    case PatentApplicationTypes.Utility_Model:
      return "Utility Model";
    default:
      return value.toString();
  }
}
