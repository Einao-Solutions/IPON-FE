import { baseURL, ApplicationStatuses } from "$lib/helpers";
import { get } from "svelte/store";
import type { Writable } from "svelte/store";

/* ======================================================
   TYPES (INLINE)
====================================================== */

export interface PaymentContext {
  page: {
    url: {
      searchParams: URLSearchParams;
      host: string;
    };
  };
  applicationData: Writable<any>;
  assignmentData: Writable<any>;
  loggedInUser: Writable<any>;
  state: {
    setTitle: (v: string | null) => void;
    setCost: (v: string) => void;
    setPaymentId: (v: string) => void;
    setFileNumber: (v: string | null) => void;
    setFileApplicant: (v: string | null) => void;
    setFileType: (v: string | null) => void;
    setFileId: (v: string | null) => void;
    setApplicationId: (v: string | null) => void;
    setFileTitle: (v: string | null) => void;
    setResponseUrl: (v: string | null) => void;
    setRenewalMeta: (meta: {
      missedYearsCount?: number;
      lateYearsCount?: number;
      isLateRenewal?: boolean;
      lateRenewalCost?: string;
      serviceFee?: string;
    }) => void;
  };
}

/* ======================================================
   REMITA HASH (INLINE)
====================================================== */

export async function generateRemitaHash(rrr: string) {
  const merchantId = "6230040240";
  const apiKey = "192753";
  const raw = merchantId + rrr + apiKey;

  const buffer = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(raw)
  );

  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ======================================================
   HANDLER MAP
====================================================== */

export const paymentHandlers: Record<
  string,
  (ctx: PaymentContext) => Promise<void>
> = {
  newapplication,
  renewal,
  dashrenewal,
  update,
  opposition,
  oppositionCounter,
  oppositionResolution,
  statussearch,
  publicationstatusupdate,
  filewithdrawal,
  availabilitysearch,
  merger,
  registeredusers,
  assignment,
  changedatarecordal,
  clerical,
  tradecertificate,
  patentassignment,
  patentlicense,
  patentmortgage,
  patentmerger,
};

/* ======================================================
   HANDLERS
====================================================== */

async function newapplication(ctx: PaymentContext): Promise<void> {
  const appData = get(ctx.applicationData);
  if (!appData) throw new Error("Missing application data");

  if (!appData.applicationHistory || appData.applicationHistory.length === 0) {
    throw new Error("No application history found");
  }

  const history = appData.applicationHistory[0];
  if (history.currentStatus !== ApplicationStatuses.AwaitingPayment) {
    throw new Error("Application not awaiting payment");
  }

  const rrr = history.paymentId;
  if (!rrr) throw new Error("Missing payment id");

  let response;
  if (appData.type === 0 && appData.fileOrigin === "Local") {
    response = await fetch(
      `${baseURL}/api/files/GetNonConventionalCost?fileId=${appData.fileId}&fileType=${appData.type}`
    );
  } else {
    response = await fetch(`${baseURL}/api/files/GetRRRCost?rrr=${rrr}`);
  }

  if (!response.ok) throw new Error("Failed to fetch application cost");

  const result = await response.json();

  const title =
    appData.type === 0
      ? "New Patent Application"
      : appData.type === 1
        ? "New Design Application"
        : "New Trademark Application";

  if (!appData.applicants || appData.applicants.length === 0) {
    throw new Error("No applicants found");
  }

  const applicantName =
    appData.applicants.length > 1
      ? `${appData.applicants[0].name} et al.`
      : appData.applicants[0].name;

  ctx.state.setTitle(title);
  ctx.state.setCost(result.cost ?? result.amount);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileNumber(appData.fileId ?? null);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setFileType(appData.type?.toString() ?? null);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/payment/status?rrr=${rrr}&paymentType=newapplication&fileId=${appData.id}&applicationId=${history.id}`
  );
}

async function renewal(ctx: PaymentContext): Promise<void> {
  const raw = sessionStorage.getItem("applicationData");
  const parsed = raw ? JSON.parse(raw) : null;

  if (!parsed?.fileId) throw new Error("Invalid renewal data");

  const res = await fetch(
    `${baseURL}/api/files/GetPatentRenewalCost?fileId=${parsed.fileId}&fileType=0`
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  const result = await res.json();
  const user = get(ctx.loggedInUser);

  ctx.state.setTitle("Patent Renewal");
  ctx.state.setCost(result.cost);
  ctx.state.setPaymentId(result.rrr);
  ctx.state.setFileNumber(parsed.fileId);
  ctx.state.setFileApplicant(`${user?.firstName} ${user?.lastName}`);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/paid?paymentType=renewal&fileId=${parsed.fileId}&rrr=${result.rrr}`
  );
  ctx.state.setRenewalMeta({
    isLateRenewal: result.isLateRenewal,
    missedYearsCount: result.missedYearsCount,
    lateYearsCount: result.lateYearsCount,
  });
}

async function dashrenewal(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("paymentId");
  const fileId = params.get("fileId");

  if (!cost || !rrr || !fileId) {
    throw new Error("Missing dash renewal params");
  }

  const user = get(ctx.loggedInUser);

  ctx.state.setTitle("Renewal");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileNumber(fileId);
  ctx.state.setFileApplicant(`${user?.firstName} ${user?.lastName}`);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/payment/status?rrr=${rrr}&paymentType=dashrenewal&fileId=${fileId}`
  );
}

/* ---------------- UPDATE ---------------- */

async function update(ctx: PaymentContext): Promise<void> {
  const appData = get(applicationData);
  if (!appData) throw new Error("Missing application data");

  if (!appData.correspondence) throw new Error("Missing correspondence data");

  const changeType = ctx.params.get("patentChangeType") ?? "";

  const res = await fetch(`${baseURL}/api/files/updatecost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      number: appData.correspondence.phone,
      email: appData.correspondence.email,
      name: get(loggedInUser)?.firstName + " " + get(loggedInUser)?.lastName,
      fileType: appData.type,
      patentchangeType: changeType,
    }),
  });

  if (!res.ok) throw new Error("Failed to fetch update cost");

  const result = await res.json();

  ctx.state.setTitle("Data Update");
  ctx.state.setCost(result.cost);
  ctx.state.setPaymentId(result.rrr);
  ctx.state.setFileNumber(appData.fileId ?? undefined);
  ctx.state.setFileApplicant(appData.applicants?.[0]?.name ?? "");
  ctx.state.setFileType(appData.type ?? undefined);
  ctx.state.setResponseUrl(
    `https://${ctx.baseUrl}/payment/status?rrr=${result.rrr}&paymentType=update&fileId=${appData.id}`
  );
}

/* ---------------- CLERICAL UPDATE ---------------- */

async function clerical(ctx: PaymentContext): Promise<void> {
  const raw = localStorage.getItem("formData");
  const parsed = raw ? JSON.parse(raw) : null;
  const params = ctx.page.url.searchParams;
  if (!parsed) throw new Error("Missing clerical data");

  const cost = params.get("amount");
  const rrr = params.get("rrr");

  if (!cost || !rrr) throw new Error("Missing payment details");

  const applicantName =
    parsed.FileType === 0 && Array.isArray(parsed.OldApplicantNames)
      ? parsed.OldApplicantNames[0]
      : (parsed.OldApplicantName ?? "");

  ctx.state.setTitle("Clerical Update");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileNumber(parsed.FileId);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/clerical-update/paid?paymentType=clerical`
  );
}

/* ---------------- OPPOSITION ---------------- */

async function opposition(ctx: PaymentContext): Promise<void> {
  const data = localStorage.getItem("oppositionData");
  const file = localStorage.getItem("fileData");
  const params = ctx.page.url.searchParams;
  if (!data || !file) throw new Error("Missing opposition data");

  const opp = JSON.parse(data);
  const f = JSON.parse(file);
  const info = f.fileInfo;

  ctx.state.setTitle(`Opposition of ${info.fileTitle}`);
  ctx.state.setCost(params.get("amount") ?? info.cost);
  ctx.state.setPaymentId(opp.paymentId);
  ctx.state.setFileNumber(info.fileId);
  ctx.state.setFileApplicant(opp.name);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/opposition/paid?rrr=${opp.paymentId}`
  );
}

/* ---------------- SIMPLE PARAM HANDLERS ---------------- */

async function oppositionCounter(ctx: PaymentContext) {
  return simpleParamHandler(ctx, "oppositionCounter");
}

async function oppositionResolution(ctx: PaymentContext) {
  return simpleParamHandler(ctx, "oppositionResolution");
}

async function statussearch(ctx: PaymentContext) {
  return simpleRedirectHandler(ctx, "/statussearch/result");
}

async function publicationstatusupdate(ctx: PaymentContext) {
  return simpleRedirectHandler(
    ctx,
    "/home/publications/publicationstatusupdate/result"
  );
}

async function filewithdrawal(ctx: PaymentContext) {
  return simpleRedirectHandler(
    ctx,
    "/home/file-withdrawal/file-withdrawal-result"
  );
}

async function availabilitysearch(ctx: PaymentContext) {
  return simpleRedirectHandler(ctx, "/availabilitysearch");
}

async function merger(ctx: PaymentContext) {
  return simplePaidHandler(ctx);
}
async function assignment(ctx: PaymentContext) {
  return simplePaidHandler(ctx);
}
async function registeredusers(ctx: PaymentContext) {
  return simplePaidHandler(ctx);
}

async function changedatarecordal(ctx: PaymentContext) {
  return simplePaidHandler(ctx);
}

async function tradecertificate(ctx: PaymentContext) {
  return simplePaidHandler(ctx);
}

/* ======================================================
   SMALL HELPERS (INLINE)
====================================================== */

async function simplePaidHandler(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");
  const data = localStorage.getItem("formData");
  const parsed = data ? JSON.parse(data) : null;

  if (!cost || !rrr) throw new Error("Missing payment data");

  ctx.state.setTitle("Payment");
  ctx.state.setFileNumber(parsed?.FileId ?? null);
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileApplicant(
    `${get(ctx.loggedInUser)?.firstName} ${get(ctx.loggedInUser)?.lastName}`
  );
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/paid`
  );
}

async function simpleRedirectHandler(
  ctx: PaymentContext,
  path: string
): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");

  if (!cost || !rrr) throw new Error("Missing payment data");

  ctx.state.setTitle("Payment");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setResponseUrl(`https://${ctx.page.url.host}${path}?rrr=${rrr}`);
}

async function simpleParamHandler(
  ctx: PaymentContext,
  type: string
): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("cost");
  const rrr = params.get("rrr");
  const title = params.get("title") ?? "Payment";

  if (!cost || !rrr) throw new Error("Missing payment data");

  ctx.state.setTitle(title);
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/payment/status?rrr=${rrr}&paymentType=${type}`
  );
}

/* ======================================================
   PATENT POST-REGISTRATION HANDLERS
====================================================== */

async function patentassignment(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");
  const fileId = params.get("fileId");

  if (!cost || !rrr) throw new Error("Missing payment data");

  const user = get(ctx.loggedInUser);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  ctx.state.setTitle("Patent Assignment Application");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setFileNumber(fileId);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/patentassignment/result?rrr=${rrr}&fileType=0&fileNumber=${fileId || ''}&applicant=${encodeURIComponent(applicantName)}`
  );
}

async function patentlicense(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");
  const fileId = params.get("fileId");

  if (!cost || !rrr) throw new Error("Missing payment data");

  const user = get(ctx.loggedInUser);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  ctx.state.setTitle("Patent License Application");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setFileNumber(fileId);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/patentlicense/result?rrr=${rrr}&fileType=0&fileNumber=${fileId || ''}&applicant=${encodeURIComponent(applicantName)}`
  );
}

async function patentmortgage(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");
  const fileId = params.get("fileId");

  if (!cost || !rrr) throw new Error("Missing payment data");

  const user = get(ctx.loggedInUser);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  ctx.state.setTitle("Patent Mortgage Application");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setFileNumber(fileId);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/patentmortgage/result?rrr=${rrr}&fileType=0&fileNumber=${fileId || ''}&applicant=${encodeURIComponent(applicantName)}`
  );
}

async function patentmerger(ctx: PaymentContext): Promise<void> {
  const params = ctx.page.url.searchParams;
  const cost = params.get("amount");
  const rrr = params.get("rrr");
  const fileId = params.get("fileId");

  if (!cost || !rrr) throw new Error("Missing payment data");

  const user = get(ctx.loggedInUser);
  const applicantName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  ctx.state.setTitle("Patent Merger Application");
  ctx.state.setCost(cost);
  ctx.state.setPaymentId(rrr);
  ctx.state.setFileApplicant(applicantName);
  ctx.state.setFileNumber(fileId);
  ctx.state.setResponseUrl(
    `https://${ctx.page.url.host}/home/postregistration/patentmerger/result?rrr=${rrr}&fileType=0&fileNumber=${fileId || ''}&applicant=${encodeURIComponent(applicantName)}`
  );
}
