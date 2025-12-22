import { baseURL, ApplicationStatuses } from "$lib/helpers";
import { get } from "svelte/store";
import { applicationData, loggedInUser } from "$lib/store";

/* ======================================================
   TYPES (INLINE)
====================================================== */

export interface PaymentContext {
  type: string;
  baseUrl: string;
  params: URLSearchParams;
}

export interface PaymentResult {
  title: string;
  cost: string;
  rrr: string;
  fileNumber?: string;
  applicantName?: string;
  fileType?: number | string;
  responseUrl: string;
  extra?: Record<string, any>;
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
  (ctx: PaymentContext) => Promise<PaymentResult>
> = {
  newapplication,
  renewal,
  dashrenewal,
  update,
  assignment,
  opposition,
  oppositionCounter,
  oppositionResolution,
  statussearch,
  publicationstatusupdate,
  filewithdrawal,
  availabilitysearch,
  merger,
  registeredusers,
  changedatarecordal,
  clerical,
  tradecertificate,
};

/* ======================================================
   HANDLERS
====================================================== */

async function newapplication(ctx: PaymentContext): Promise<PaymentResult> {
  const appData = get(applicationData);
  if (!appData) throw new Error("Missing application data");

  // Add this check
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

  return {
    title,
    cost: result.cost ?? result.amount,
    rrr,
    fileNumber: appData.fileId ?? undefined,
    applicantName,
    fileType: appData.type ?? undefined,
    responseUrl: `https://${ctx.baseUrl}/payment/status?rrr=${rrr}&paymentType=newapplication&fileId=${appData.id}&applicationId=${history.id}`,
  };
}

/* ---------------- RENEWAL ---------------- */

async function renewal(ctx: PaymentContext): Promise<PaymentResult> {
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

  return {
    title: "Patent Renewal",
    cost: result.cost,
    rrr: result.rrr,
    fileNumber: parsed.fileId,
    applicantName:
      get(loggedInUser)?.firstName + " " + get(loggedInUser)?.lastName,
    responseUrl: `https://${ctx.baseUrl}/home/postregistration/paid?paymentType=renewal&fileId=${parsed.fileId}&rrr=${result.rrr}`,
    extra: {
      isLateRenewal: result.isLateRenewal,
      missedYearsCount: result.missedYearsCount,
      lateYearsCount: result.lateYearsCount,
    },
  };
}

/* ---------------- DASH RENEWAL ---------------- */

async function dashrenewal(ctx: PaymentContext): Promise<PaymentResult> {
  const cost = ctx.params.get("amount");
  const rrr = ctx.params.get("paymentId");
  const fileId = ctx.params.get("fileId");

  if (!cost || !rrr || !fileId) {
    throw new Error("Missing dash renewal params");
  }

  return {
    title: "Renewal",
    cost,
    rrr,
    fileNumber: fileId,
    applicantName:
      get(loggedInUser)?.firstName + " " + get(loggedInUser)?.lastName,
    responseUrl: `https://${ctx.baseUrl}/payment/status?rrr=${rrr}&paymentType=dashrenewal&fileId=${fileId}`,
  };
}

/* ---------------- UPDATE ---------------- */

async function update(ctx: PaymentContext): Promise<PaymentResult> {
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

  return {
    title: "Data Update",
    cost: result.cost,
    rrr: result.rrr,
    fileNumber: appData.fileId ?? undefined,
    applicantName: appData.applicants?.[0]?.name ?? "",
    fileType: appData.type ?? undefined,
    responseUrl: `https://${ctx.baseUrl}/payment/status?rrr=${result.rrr}&paymentType=update&fileId=${appData.id}`,
  };
}

/* ---------------- CLERICAL ---------------- */

async function clerical(ctx: PaymentContext): Promise<PaymentResult> {
  const raw = localStorage.getItem("formData");
  const parsed = raw ? JSON.parse(raw) : null;

  if (!parsed) throw new Error("Missing clerical data");

  const cost = ctx.params.get("amount");
  const rrr = ctx.params.get("rrr");

  if (!cost || !rrr) throw new Error("Missing payment details");

  const applicantName =
    parsed.FileType === 0 && Array.isArray(parsed.OldApplicantNames)
      ? parsed.OldApplicantNames[0]
      : (parsed.OldApplicantName ?? "");

  return {
    title: "Clerical Update",
    cost,
    rrr,
    fileNumber: parsed.FileId,
    applicantName,
    responseUrl: `https://${ctx.baseUrl}/home/clerical-update/paid?paymentType=clerical`,
  };
}

/* ---------------- OPPOSITION ---------------- */

async function opposition(ctx: PaymentContext): Promise<PaymentResult> {
  const data = localStorage.getItem("oppositionData");
  const file = localStorage.getItem("fileData");

  if (!data || !file) throw new Error("Missing opposition data");

  const opp = JSON.parse(data);
  const f = JSON.parse(file);
  const info = f.fileInfo;

  return {
    title: `Opposition of ${info.fileTitle}`,
    cost: ctx.params.get("amount") ?? info.cost,
    rrr: opp.paymentId,
    fileNumber: info.fileId,
    applicantName: opp.name,
    responseUrl: `https://${ctx.baseUrl}/opposition/paid?rrr=${opp.paymentId}`,
  };
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

async function simplePaidHandler(ctx: PaymentContext): Promise<PaymentResult> {
  const cost = ctx.params.get("amount");
  const rrr = ctx.params.get("rrr");

  if (!cost || !rrr) throw new Error("Missing payment data");

  return {
    title: "Payment",
    cost,
    rrr,
    applicantName:
      get(loggedInUser)?.firstName + " " + get(loggedInUser)?.lastName,
    responseUrl: `https://${ctx.baseUrl}/home/postregistration/paid`,
  };
}

async function simpleRedirectHandler(
  ctx: PaymentContext,
  path: string
): Promise<PaymentResult> {
  const cost = ctx.params.get("amount");
  const rrr = ctx.params.get("rrr");

  if (!cost || !rrr) throw new Error("Missing payment data");

  return {
    title: "Payment",
    cost,
    rrr,
    responseUrl: `https://${ctx.baseUrl}${path}?rrr=${rrr}`,
  };
}

async function simpleParamHandler(
  ctx: PaymentContext,
  type: string
): Promise<PaymentResult> {
  const cost = ctx.params.get("cost");
  const rrr = ctx.params.get("rrr");
  const title = ctx.params.get("title") ?? "Payment";

  if (!cost || !rrr) throw new Error("Missing payment data");

  return {
    title,
    cost,
    rrr,
    responseUrl: `https://${ctx.baseUrl}/payment/status?rrr=${rrr}&paymentType=${type}`,
  };
}
