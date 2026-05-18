import { ApplicationStatuses } from "./helpers";
export function mapStatusToString(status: ApplicationStatuses | number): string {
  switch (status) {
    case ApplicationStatuses.Active:
      return "Active";
    case ApplicationStatuses.Inactive:
      return "Inactive";
    case ApplicationStatuses.AwaitingPayment:
      return "Awaiting Payment";
    case ApplicationStatuses.AwaitingSearch:
      return "Awaiting Search";
    case ApplicationStatuses.AwaitingExaminer:
      return "Awaiting Examiner";
    case ApplicationStatuses.RejectedByExaminer:
      return "Rejected By Examiner";
    case ApplicationStatuses.Re_conduct:
      return "Re-conduct";
    case ApplicationStatuses.FormalityFail:
      return "Formality Fail";
    case ApplicationStatuses.KivSearch:
      return "Kiv Search";
    case ApplicationStatuses.KivExaminer:
      return "Kiv Examiner";
    case ApplicationStatuses.Approved:
      return "Approved";
    case ApplicationStatuses.Rejected:
      return "Rejected";
    case ApplicationStatuses.None:
      return "None";
    case ApplicationStatuses.AutoApproved:
      return "Auto-Approved";
    case ApplicationStatuses.Publication:
      return "Publication";
    case ApplicationStatuses.Opposition:
      return "Opposition";
    case ApplicationStatuses.AwaitingResponse:
      return "Awaiting Response";
    case ApplicationStatuses.AwaitingOppositionStaff:
      return "Awaiting Staff";
    case ApplicationStatuses.AwaitingResolution:
      return "Awaiting Resolution";
    case ApplicationStatuses.Resolved:
      return "Resolved";
    case ApplicationStatuses.AwaitingCertification:
      return "Awaiting Certification";
    case ApplicationStatuses.AwaitingConfirmation:
      return "Awaiting Confirmation";
    case ApplicationStatuses.AwaitingSave:
      return "Awaiting Save";
    case ApplicationStatuses.AwaitingCertificateConfirmation:
      return "Awaiting Certificate Confirmation";
    case ApplicationStatuses.Withdrawn:
      return "Withdrawn";
    case ApplicationStatuses.AwaitingCertificatePayment:
      return "Awaiting Certificate Payment";
    case ApplicationStatuses.AwaitingRecordalProcess:
      return "Awaiting Recordal Process";
    case ApplicationStatuses.AppealRequest:
      return "Appeal Requested";
    case ApplicationStatuses.AwaitingStatusUpdate:
      return "Awaiting Status Update";
    case ApplicationStatuses.RequestWithdrawal:
      return "Request Withdrawal";
    case ApplicationStatuses.NewOpposition:
      return "New Opposition";
    case ApplicationStatuses.AwaitingCounter:
      return "Awaiting Counter";
    case ApplicationStatuses.AwaitingApproval:
      return "Awaiting Approval";
    case ApplicationStatuses.StatutoryDeclaration:
      return "Statutory Declaration";
    case ApplicationStatuses.AwaitingRenewalConfirmation:
      return "Awaiting Renewal Confirmation";
    case ApplicationStatuses.PendingRenewal:
      return "Pending Renewal";
    case ApplicationStatuses.AwaitingOfficeProcess:
      return "Awaiting Office Process";
    case ApplicationStatuses.Abandoned:
      return "Abandoned";
    default:
      return "";
  }
}

export function mapDesignTypeToString(index: number) {
  switch (index) {
    case 0:
      return "Textile";
    case 1:
      return "Non-Textile";
  }
}
export enum DesignAttachments {
  form2 = 0,
  nov = 1,
  designs = 2,
  pdoc = 3,
}

export enum PatentAttachments {
  form2 = 0,
  cs = 1,
  patentDrawing = 2,
  pdoc = 3,
  any = 4,
  pct = 5,
}

export enum TrademarkAttachments {
  form2 = 0,
  representation = 1,
  other1 = 2,
  other2 = 3,
}

export enum DesignTypes {
  Textile = 0,
  NonTextile = 1,
}

export function mapDesignAttToString(index: number) {
  switch (index) {
    case 0:
      return "Power of Attorney";
    case 1:
      return "Novelty Statement";
    case 2:
      return "Design Representations";
    case 3:
      return "Priority Document";
    default:
      return "";
  }
}
export function mapTrademarkAttToString(index: number) {
  switch (index) {
    case 0:
      return "Power of Attorney";
    case 1:
      return "Trademark Representation";
    case 2:
      return "Supporting document 1";
    case 3:
      return "Supporting document 2";
    default:
      return "";
  }
}

export function mapDesignAttIntToString(index: number) {
  switch (index) {
    case 0:
      return "form2";
    case 1:
      return "nov";
    case 2:
      return "designs";
    case 3:
      return "pdoc";
    default:
      return "";
  }
}
export function mapDesignAttStringToInt(index: string) {
  switch (index) {
    case "form2":
      return 0;
    case "nov":
      return 1;
    case "designs":
      return 2;
    case "pdoc":
      return 3;
    default:
      return -1;
  }
}

export function mapPatentAttToString(index: number) {
  switch (index) {
    case 0:
      return "Power of Attorney";
    case 1:
      return "Claims and specifications";
    case 2:
      return "Patent Drawing";
    case 3:
      return "Priority Document";
    case 4:
      return "Any other Document";
    case 5:
      return "PCT Document";
    default:
      return "";
  }
}

export function mapPatentAttInToString(index: number) {
  switch (index) {
    case 0:
      return "form2";
    case 1:
      return "cs";
    case 2:
      return "patentDrawing";
    case 3:
      return "pdoc";
    case 4:
      return "any";
    case 5:
      return "pct";
    default:
      return "";
  }
}
export function mapTradeAttInToString(index: number) {
  switch (index) {
    case 0:
      return "form2";
    case 1:
      return "representation";
    case 2:
      return "other1";
    case 3:
      return "other2";
    default:
      return "";
  }
}

export function mapTradeStringToInt(value: string) {
  switch (value) {
    case "form2":
      return 0;
    case "representation":
      return 1;
    case "other1":
      return 2;
    case "other2":
      return 3;
    default:
      return -1;
  }
}

export function mapTradeStringToString(value: string) {
  switch (value) {
    case "form2":
      return "power_of_attorney";
    case "representation":
      return "trademark_drawing";
    case "other1":
      return "other_document_1";
    case "other2":
      return "other_document_2";
    default:
      return -1;
  }
}

export function mapPatentAttStrToInt(index: string) {
  switch (index) {
    case "form2":
      return 0;
    case "cs":
      return 1;
    case "patentDrawing":
      return 2;
    case "pdoc":
      return 3;
    case "any":
      return 4;
    case "pct":
      return 5;
    default:
      return -1;
  }
}

export function mapStatusStringToStatus(status: string): number | undefined {
  // Accept the enum key directly (e.g. "AwaitingConfirmation").
  if (status in ApplicationStatuses) {
    const value = (ApplicationStatuses as Record<string, unknown>)[status];
    if (typeof value === "number") return value;
  }
  // Backward-compat aliases for previously used keys.
  switch (status) {
    case "Expired":
      return ApplicationStatuses.Inactive;
    case "AwaitingStatusUpddate":
      return ApplicationStatuses.AwaitingStatusUpdate;
    case "Amendment":
      return ApplicationStatuses.AwaitingApproval;
    default:
      return undefined;
  }
}
