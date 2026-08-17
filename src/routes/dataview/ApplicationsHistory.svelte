<script lang="ts">
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Sheet from "$lib/components/ui/sheet/index";

  import {
    type ApplicationHistoryType,
    type OppositionHistoryType,
    type TreatAppealType,
    ApplicationStatuses,
    baseURL,
    FileTypes,
    FormApplicationTypes,
    hasValidCorrespondenceDetails,
    UserRoles,
  } from "$lib/helpers";
  import HistorySheet from "../home/components/HistorySheet.svelte";
  import { getHistoryData, getLetterName } from "./datahelpers";
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
  import CorrespondenceComparison from "../updatesmade/CorrespondenceComparison.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import AttachmentsComparison from "../updatesmade/AttachmentsComparison.svelte";
  import ComparisonTable from "../updatesmade/ComparisonTable.svelte";
  import OtherComparison from "../updatesmade/OtherComparison.svelte";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import Icon from "@iconify/svelte";
  import {
    mapDateToString,
    mapDateToStringNoDate,
    mapTypeToString,
  } from "../home/components/dashboardutils";
  import { goto } from "$app/navigation";
  import {
    adjustmentType,
    applicationData,
    loggedInUser,
    metaDataInfo,
    newApplicationType,
    viewUpdatesMade,
  } from "$lib/store";
  import { get } from "svelte/store";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { mapStatusStringToStatus } from "$lib/designutils";
  import { Item } from "$lib/components/ui/accordion";
  import DropdownMenuItem from "$lib/components/ui/dropdown-menu/dropdown-menu-item.svelte";
  import OppositionHistory from "./OppositionHistory.svelte";
  import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
  import { useAnimation } from "svelte-motion";
  import PatentAssignmentDialog from "./Components/PatentAssignmentDialog.svelte";
  import PatentLicenseDialog from "./Components/PatentLicenseDialog.svelte";
  import DesignLicenseDialog from "./Components/DesignLicenseDialog.svelte";
  import PatentMergerDialog from "./Components/PatentMergerDialog.svelte";
  import PatentMortgageDialog from "./Components/PatentMortgageDialog.svelte";
  import PatentCTCDialog from "./Components/PatentCTCDialog.svelte";
  import DesignCTCDialog from "./Components/DesignCTCDialog.svelte";
  import TrademarkCTCDialog from "./Components/TrademarkCTCDialog.svelte";
  import PatentAmendmentDialog from "./Components/PatentAmendmentDialog.svelte";
  import DesignAmendmentDialog from "./Components/DesignAmendmentDialog.svelte";
  import DesignMortgageDialog from "./Components/DesignMortgageDialog.svelte";
  import DesignAssignmentDialog from "./Components/DesignAssignmentDialog.svelte";
  import DesignMergerDialog from "./Components/DesignMergerDialog.svelte";
  import OwnershipHistoryDialog from "./Components/OwnershipHistoryDialog.svelte";
  import OfflineRenewalDialog from "./Components/OfflineRenewalDialog.svelte";
  // import { au } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';

  // Variables
  // ======================
  export let allApplications: ApplicationHistoryType[];
  export let fileData: any;
  export let showMissingDetailsForm: () => {};
  let selectedApplication: ApplicationHistoryType | null = null;
  $: selectedOldValue = selectedApplication?.oldValue as any;
  $: selectedNewValue = selectedApplication?.newValue as any;
  let showStatusHistory: boolean = false;
  let historyComponent: typeof HistorySheet | null = null;
  let isNewStatusLoading: boolean = false;
  let historyData: any = {};
  let showDataComparison: boolean = false;
  let newStatus: string | null = null;
  let showAlertDialog: boolean = false;
  let newStatusContent: number | null = null;
  let showUpdateStatusForm: boolean = false;
  let newStatusReason: string | null = null;
  let newStatusAttachment: File | null = null;
  let showRecordalDialog = false;
  let recordalData: any = null;
  let recordalLoading = false;
  let remita_confirmation = "checking";
  let amount = "";
  let paymentDate = "";
  let status = "";
  let validateRRR = "";
  let paymentDescription = "";
  let show_updating: boolean = false;
  let manualUpdate: ApplicationHistoryType | null = null;
  let showManualUpdate = false;
  let updateCert = false;
  let showCancel = false;
  let reason = "";
  let isCertificate = false;
  let possibleOptions = [];

  // Publication Status Update
  let showPublicationDialog = false;
  let publicationDetails: any = null;
  let publicationLoading = false;
  let publicationError: string | null = null;
  let publicationComment = "";
  let publicationSubmitting = false;
  let publicationApplicationId = "";
  let publicationFileId = "";

  // Opposition Detail Sheet State
  let selectedOpposition: any = null;
  let showOppositionDetail: boolean = false;
  let oppositionDetailLoading: boolean = false;
  let fileOppositions: any[] = [];
  let activeOppositionIndex: number = 0;

  // Withdrawal Modal State
  let showWithdrawalDialog = false;
  let withdrawalDetails: any = null;
  let withdrawalLoading = false;
  let withdrawalError: string | null = null;
  let withdrawalComment = "";
  let withdrawalSubmitting = false;
  let withdrawalFileId = "";
  let withdrawalApplicationId = "";

  // Patent Assignment Modal State
  let showPatentAssignmentDialog = false;
  let patentAssignmentFileId = "";
  let patentAssignmentApplicationId = "";

  // Patent License Modal State
  let showPatentLicenseDialog = false;
  let patentLicenseFileId = "";
  let patentLicenseApplicationId = "";

  // Design License Modal State
  let showDesignLicenseDialog = false;
  let designLicenseFileId = "";
  let designLicenseApplicationId = "";

  // Patent Merger Modal State
  let showPatentMergerDialog = false;
  let patentMergerFileId = "";
  let patentMergerApplicationId = "";

  // Patent Mortgage Modal State
  let showPatentMortgageDialog = false;
  let patentMortgageFileId = "";
  let patentMortgageApplicationId = "";

  // Patent CTC Modal State
  let showPatentCTCDialog = false;
  let patentCTCFileId = "";
  let patentCTCApplicationId = "";

  // Patent Amendment Modal State
  let showPatentAmendmentDialog = false;
  let patentAmendmentFileId = "";
  let patentAmendmentApplicationId = "";

  // Design Amendment Modal State
  let showDesignAmendmentDialog = false;
  let designAmendmentFileId = "";
  let designAmendmentApplicationId = "";

  // Design Mortgage Modal State
  let showDesignMortgageDialog = false;
  let designMortgageFileId = "";
  let designMortgageApplicationId = "";

  // Design Assignment Modal State
  let showDesignAssignmentDialog = false;
  let designAssignmentFileId = "";
  let designAssignmentApplicationId = "";

  // Design Merger Modal State
  let showDesignMergerDialog = false;
  let designMergerFileId = "";
  let designMergerApplicationId = "";

  // Design CTC Modal State
  let showDesignCTCDialog = false;
  let designCTCFileId = "";
  let designCTCApplicationId = "";

  // Trademark CTC Modal State
  let showTrademarkCTCDialog = false;
  let trademarkCTCFileId = "";
  let trademarkCTCApplicationId = "";
  let trademarkCTCStatus: number | null = null;

  // Offline Renewal Dialog State
  let showOfflineRenewalDialog = false;
  let offlineRenewalApplicationId = "";
  let offlineRenewalStatus: number | null = null;

  // Ownership History Modal State
  let showOwnershipHistoryDialog = false;

  function openOwnershipHistoryDialog() {
    showOwnershipHistoryDialog = true;
  }

  // Patent Dialog Statuses
  let patentAssignmentStatus: number | null = null;
  let patentLicenseStatus: number | null = null;
  let designLicenseStatus: number | null = null;
  let patentMergerStatus: number | null = null;
  let patentMortgageStatus: number | null = null;
  let patentCTCStatus: number | null = null;
  let patentAmendmentStatus: number | null = null;
  let designMortgageStatus: number | null = null;
  let designAssignmentStatus: number | null = null;
  let designMergerStatus: number | null = null;
  let designCTCStatus: number | null = null;
  let designAmendmentStatus: number | null = null;
  //let patentCTCStatus: number | null = null;

  // Appeal Requests
  let appealDocs: string[] = [];
  let showAppealRequest = false;
  let appeal: TreatAppealType = {
    id: "",
    reason: null,
    IsTreated: false,
  };
  const name = $loggedInUser?.firstName + " " + $loggedInUser?.lastName;
  // let appealReason = '';
  // let submittingAppeal = false;
  // let isApproving = false;

  // ======================
  // Helper Functions
  // ======================
  function showToast(
    type: "success" | "error",
    message: string,
    description?: string,
  ) {
    toast[type](message, {
      description: description || message,
      position: "top-right",
    });
  }

  function dataType(): string {
    const tableFields = ["inventors", "priorityInfo", "applicants"];
    return tableFields.includes(selectedApplication?.fieldToChange ?? "")
      ? "table"
      : selectedApplication?.fieldToChange || "";
  }

  function showTreatApplication(application: ApplicationHistoryType) {
    return (
      application?.currentStatus != null &&
      [0, 1].includes(application.currentStatus) == false
    );
  }

  // ======================
  // Recordal Dialog Helpers
  // ======================
  const hiddenKeys = new Set([
    "id",
    "isapproved",
    "documenturl",
    "authorizationletterurl",
    "assignmentdeedurl",
    "appealdocs",
    "oldattachmenturl",
    "newattachmenturl",
    "fileid",
  ]);

  function isHiddenKey(key: string): boolean {
    return (
      hiddenKeys.has(key.toLowerCase()) || key.toLowerCase().endsWith("url")
    );
  }

  function formatFieldName(key: string, stripPrefix?: string): string {
    let cleaned = key;
    if (
      stripPrefix &&
      cleaned.toLowerCase().startsWith(stripPrefix.toLowerCase())
    ) {
      cleaned = cleaned.slice(stripPrefix.length);
    }
    return cleaned
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  function getRecordalEntries(
    data: any,
    filter: (key: string) => boolean,
  ): [string, any][] {
    return Object.entries(data).filter(
      ([key, value]) =>
        value != null && value !== "" && !isHiddenKey(key) && filter(key),
    );
  }

  // Pair old/new fields by stripping prefixes (e.g. "assignor"/"assignee" or "old"/"new").
  // Keys starting with leftPrefix are the "left" (previous) side; keys starting with
  // rightPrefix (if provided) are the "right" (new) side. Unprefixed keys default to
  // the right side. Matching is done by normalizing the remaining base name.
  // Additionally, any key ending in "2" (e.g. "applicantName2") is also treated as
  // the previous/old value for its unsuffixed counterpart (e.g. "applicantName").
  function formatRecordalValue(key: string, value: any) {
    if (typeof value !== "string") return value;
    const isDateField = /date/i.test(key);
    if (isDateField) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString();
      }
    }
    return value;
  }

  function flattenRecordalObject(
    obj: any,
    prefix: string,
    target: Record<string, any>,
    mappings: Record<string, string> = {},
  ) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj)) {
      if (value == null || value === "") continue;
      const normalizedKey = mappings[key] ?? key;
      target[`${prefix}${normalizedKey.charAt(0).toUpperCase()}${normalizedKey.slice(1)}`] = value;
    }
  }

  function normalizeRecordalData(
    application: any,
    data: any,
  ): Record<string, any> {
    if (!data) return {};
    const normalized = { ...data };

    if (application?.applicationType === FormApplicationTypes.Assignment) {
      const assignment = data.assignment || {};
      if (assignment.assignorName) normalized.assignorName = assignment.assignorName;
      if (assignment.assignorEmail) normalized.assignorEmail = assignment.assignorEmail;
      if (assignment.assignorPhone) normalized.assignorPhone = assignment.assignorPhone;
      if (assignment.assignorNationality) normalized.assignorNationality = assignment.assignorNationality;
      if (assignment.assignorAddress) normalized.assignorAddress = assignment.assignorAddress;
      if (assignment.assignorCountry) normalized.assignorCountry = assignment.assignorCountry;
      if (assignment.assigneeName) normalized.assigneeName = assignment.assigneeName;
      if (assignment.assigneeEmail) normalized.assigneeEmail = assignment.assigneeEmail;
      if (assignment.assigneePhone) normalized.assigneePhone = assignment.assigneePhone;
      if (assignment.assigneeNationality) normalized.assigneeNationality = assignment.assigneeNationality;
      if (assignment.assigneeAddress) normalized.assigneeAddress = assignment.assigneeAddress;
      if (assignment.assigneeCountry) normalized.assigneeCountry = assignment.assigneeCountry;
      if (assignment.dateOfAssignment) normalized.dateOfAssignment = assignment.dateOfAssignment;
    }

    if (data.oldValue) {
      flattenRecordalObject(data.oldValue, "old", normalized, {
        name: "Name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        country: "Country",
        nationality: "Nationality",
      });
    }

    if (data.newValue) {
      flattenRecordalObject(data.newValue, "new", normalized, {
        name: "Name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        country: "Country",
        nationality: "Nationality",
        mergerDate: "MergerDate",
        dateOfAssignment: "DateOfAssignment",
        newName: "Name",
        newAddress: "Address",
      });
    }

    return normalized;
  }

  function pairOldNew(
    data: any,
    leftPrefix: string,
    rightPrefix: string = "",
  ): { field: string; left: any; right: any }[] {
    if (!data) return [];
    const entries = Object.entries(data).filter(
      ([k, v]) => v != null && v !== "" && !isHiddenKey(k),
    );
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const order: string[] = [];
    const map = new Map<string, { field: string; left: any; right: any }>();
    for (const [k, v] of entries) {
      const lower = k.toLowerCase();
      const startsWithLeft =
        leftPrefix.length > 0 && lower.startsWith(leftPrefix.toLowerCase());
      const startsWithRight =
        rightPrefix.length > 0 && lower.startsWith(rightPrefix.toLowerCase());
      const endsWith2 = /2$/.test(k);
      let base = k;
      let isLeft = false;
      if (startsWithLeft) {
        base = k.slice(leftPrefix.length);
        isLeft = true;
      } else if (startsWithRight) {
        base = k.slice(rightPrefix.length);
        isLeft = false;
      } else if (endsWith2) {
        base = k.replace(/2$/, "");
        isLeft = true;
      }
      const cleaned = base.replace(/^[_\s]+/, "");
      const id = normalize(cleaned);
      if (!id) continue;
      if (!map.has(id)) {
        map.set(id, {
          field: formatFieldName(cleaned),
          left: undefined,
          right: undefined,
        });
        order.push(id);
      }
      const row = map.get(id)!;
      const formattedValue = formatRecordalValue(k, v);
      if (isLeft) row.left = formattedValue;
      else row.right = formattedValue;
    }
    return order.map((id) => map.get(id)!);
  }

  // ======================
  // Opposition Detail Functions
  // ======================
  async function viewOppositionDetail(fileNumber: string) {
    oppositionDetailLoading = true;
    fileOppositions = [];
    activeOppositionIndex = 0;
    try {
      const res = await fetch(
        `${baseURL}/api/opposition/getOppositionDetail?fileNumber=${fileNumber}`,
      );
      if (res.ok) {
        const json = await res.json();
        const data = json.opposition ?? json.data ?? json;
        if (Array.isArray(data)) {
          fileOppositions = data.sort(
            (a: any, b: any) =>
              new Date(a.date ?? a.oppositionDate ?? 0).getTime() -
              new Date(b.date ?? b.oppositionDate ?? 0).getTime(),
          );
        } else {
          fileOppositions = [data];
        }
        selectedOpposition = fileOppositions[0];
        showOppositionDetail = true;
      } else {
        showToast("error", "Failed to fetch opposition details");
      }
    } catch (error) {
      console.error("Fetch opposition detail error:", error);
      showToast("error", "An error occurred while fetching opposition details");
    } finally {
      oppositionDetailLoading = false;
    }
  }

  function switchOpposition(index: number) {
    activeOppositionIndex = index;
    selectedOpposition = fileOppositions[index];
  }

  // ======================
  // History Functions
  // ======================
  async function ViewHistory(application: ApplicationHistoryType) {
    selectedApplication = application;
    if (!historyComponent) {
      historyComponent = (
        await import("../home/components/HistorySheet.svelte")
      ).default;
    }

    historyData = {
      title: "Status History",
      description: "Application status changes",
      dataList: application.statusHistory,
      onclose: () => {
        showStatusHistory = false;
        historyData = {};
      },
      isVisible: true,
    };

    showStatusHistory = true;
  }

  // ======================
  // Payment Functions
  // ======================
  async function checkPayment(
    application: ApplicationHistoryType,
    id: string | null,
  ) {
    if (!id) {
      showToast("error", "No Remita ID available");
      return;
    }

    isCertificate =
      fileData.applicationHistory[0].certificatePaymentId === id ||
      application.applicationType === FormApplicationTypes.Certification;
    isCertificate =
      fileData.applicationHistory[0].certificatePaymentId === id ||
      application.applicationType === FormApplicationTypes.Certification;
    manualUpdate = application;
    validateRRR = id;
    remita_confirmation = "checking";
    showAlertDialog = true;

    try {
      const response = await fetch(`${baseURL}/api/payments/check?id=${id}`);
      if (!response.ok) throw new Error("Payment check failed");

      const text = await response.text();
      if (!text) {
        showToast("error", "No payment information returned");
        remita_confirmation = "verify_update";
        amount = "";
        paymentDate = "";
        status = "";
        paymentDescription = "";
        showManualUpdate = false;
        updateCert = false;
        showCancel = true;
        return;
      }

      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        showToast("error", "Invalid response from payment service");
        remita_confirmation = "verify_update";
        amount = "";
        paymentDate = "";
        status = "";
        paymentDescription = "";
        showManualUpdate = false;
        updateCert = false;
        showCancel = true;
        return;
      }

      ({
        amount,
        paymentDate,
        status,
        paymentDesc: paymentDescription,
      } = result);
      remita_confirmation = "verify_update";

      if (status === "00") {
        if (application.currentStatus === ApplicationStatuses.AwaitingPayment) {
          showManualUpdate = true;
          updateCert = false;
        } else if (
          application.currentStatus ===
            ApplicationStatuses.AwaitingCertification ||
          application.currentStatus === ApplicationStatuses.Publication
        ) {
          updateCert = true;
          showManualUpdate = false;
        } else {
          showManualUpdate = false;
          updateCert = false;
        }
      } else {
        showManualUpdate = false;
        updateCert = false;
      }
      showCancel = !(showManualUpdate || updateCert);
      showCancel = !updateCert;
    } catch (error) {
      console.error("Payment check error:", error);
      showToast("error", "Failed to verify payment");
    }
  }

  async function updateCertPaymentStatus(paymentId: string, fileId: string) {
    try {
      const result = await fetch(
        `${baseURL}/api/files/UpdateCertificatePaymentStatus?fileId=${fileId}&rrr=${paymentId}`,
        { method: "POST" },
      );
      if (result.ok) {
        toast.success("Certificate status updated successfully");
        updateCert = false;
      } else {
        toast.error("Failed to update certificate status");
      }
    } catch (error) {
      console.error("Certificate status update error:", error);
    }
  }

  async function updateManual() {
    remita_confirmation = "checking";
    try {
      const res = await fetch(
        `${baseURL}/api/files/ManualUpdate?fileId=${fileData.fileId}&applicationId=${manualUpdate?.id}&userId=${$loggedInUser?.creatorId}&userName=${name}&isCertificate=${isCertificate}`,
        { method: "POST" },
      );

      if (!res.ok) {
        // try to read error message if provided
        const txt = await res.text().catch(() => "");
        let msg = "Manual update failed";
        try {
          const jsonErr = txt ? JSON.parse(txt) : null;
          msg = jsonErr?.message || txt || msg;
        } catch {
          msg = txt || msg;
        }
        showToast("error", "Failed to Update Application");
        remita_confirmation = "failed";
        return;
      }

      // safe parse: some endpoints return empty body (204) -> avoid json() error
      const text = await res.text().catch(() => "");
      if (text) {
        try {
          const updatedData = JSON.parse(text);
          applicationData.set(updatedData);
        } catch (err) {
          console.warn("Manual update: response not JSON:", err);
        }
      } else {
        // no body but OK response — treat as success
        showToast("success", "Manual update completed");
      }
      remita_confirmation = "success";
    } catch (error) {
      console.error("Manual update error:", error);
      showToast("error", "Manual update failed");
      remita_confirmation = "failed";
    }
  }

  // Letter Generation

  function generateLetter(
    application: ApplicationHistoryType,
    appType: number,
    letterType: number,
    useFileId = false,
  ) {
    if (application.applicationType !== appType) {
      showMissingDetailsForm();
      return;
    }

    const fileIdProp = useFileId ? "fileId" : "id";
    window.open(
      `${baseURL}/api/letters/generate?fileId=${fileData.fileId}&letterType=${letterType}&applicationId=${application.id}`,
    );
  }

  // Specific letter generators
  const recordalCertificate = (app: ApplicationHistoryType) =>
    generateLetter(app, 8, 10);
  const certificate = (app: ApplicationHistoryType) =>
    generateLetter(app, 0, 3, true);
  const recordalAck = (app: ApplicationHistoryType) =>
    generateLetter(app, 2, 9);
  const renewalAcknowledgement = (app: ApplicationHistoryType) =>
    generateLetter(app, 1, 6);
  const mergerAcknowledgement = (app: ApplicationHistoryType) =>
    generateLetter(app, 8, 26);
  const regUserAcknowledgement = (app: ApplicationHistoryType) =>
    generateLetter(app, 7, 29);
  const assignmentAck = (app: ApplicationHistoryType) =>
    generateLetter(app, 5, 12, true);
  const changeNameAck = (app: ApplicationHistoryType) =>
    generateLetter(app, 9, 32);
  const changeNameReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 9, 34);
  const changeAddressAck = (app: ApplicationHistoryType) =>
    generateLetter(app, 10, 31, true);
  const changeAddressReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 10, 33, true);
  const mergerReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 8, 25, true);
  const regUsersReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 7, 28, true);
  const renewalReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 1, 5, true);
  const assignmentReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 5, 11, true);
  const clericalUpdateReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 11, 35, true);
  const newTradeReceipt = (app: ApplicationHistoryType) =>
    generateLetter(app, 0, 37, true);
  const clericalUpdateAck = (app: ApplicationHistoryType) =>
    generateLetter(app, 11, 36, true);
  const renewalCertificate = (app: ApplicationHistoryType) =>
    generateLetter(app, 1, 7, true);
  const certAcknowledgement = (app: ApplicationHistoryType) =>
    generateLetter(app, 0, 21, true);

  // ======================
  // Recordal Functions
  // ======================

  async function viewRecordalData(application: ApplicationHistoryType) {
    selectedApplication = application;
    showRecordalDialog = true;
    recordalLoading = true;

    try {
      let endpoint = "";
      switch (application.applicationType) {
        case FormApplicationTypes.Merger:
          endpoint = `/api/files/GetMergerApplication`;
          break;
        case FormApplicationTypes.RegisteredUser:
          endpoint = `/api/files/GetRegUserApplication`;
          break;
        case FormApplicationTypes.Assignment:
          endpoint = `/api/files/GetAssignmentApplication`;
          break;
        case FormApplicationTypes.ChangeOfName:
        case FormApplicationTypes.Reclassification:
        case FormApplicationTypes.ChangeOfAddress:
          endpoint = `/api/files/GetChangeDataRecordal`;
          break;
        case FormApplicationTypes.ClericalUpdate:
        case FormApplicationTypes.Amendment:
          endpoint = `/api/files/GetClericalUpdateApp`;
          break;
        default:
          showToast("error", "Invalid application type");
          showRecordalDialog = false;
          return;
      }

      const response = await fetch(
        `${baseURL}${endpoint}?fileId=${fileData.fileId}&appId=${application.id}`,
      );

      if (response.ok) {
        recordalData = await response.json();
      }
    } catch (error) {
      console.error("Recordal data error:", error);
      showToast("error", "Failed to fetch recordal data");
    } finally {
      recordalLoading = false;
    }
  }

  async function approveRecordal(
    endpoint: string,
    application: ApplicationHistoryType,
    successMessage: string,
  ) {
    try {
      const body = {
        fileId: fileData?.fileId,
        appId: application.id,
        reason: reason,
        userId: $loggedInUser?.id,
      };

      const res = await fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("success", successMessage);
        showRecordalDialog = false;
        location.reload();
      }
    } catch (error) {
      console.error(`Approval error: ${error}`);
      showToast("error", "Approval failed");
    }
  }
  async function approveAmendment(application: ApplicationHistoryType) {
    try {
      const body = {
        fileId: fileData?.fileId,
        appId: application.id,
        reason: reason,
        userId: $loggedInUser?.id,
      };

      const res = await fetch(`${baseURL}/api/opposition/TreatAmendment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("success", "Amendment approved successfully");
        showRecordalDialog = false;
        location.reload();
      }
    } catch (error) {
      console.error("Amendment approval error:", error);
      showToast("error", "Failed to approve amendment");
    }
  }
  async function denyRecordal(application: ApplicationHistoryType) {
    try {
      const body = {
        fileId: fileData?.fileId,
        appId: application.id,
        reason: reason,
        userId: $loggedInUser?.id,
      };

      const res = await fetch(`${baseURL}/api/files/DenyRecordal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("success", "Recordal rejected successfully");
        showRecordalDialog = false;
      }
    } catch (error) {
      console.error("Recordal denial error:", error);
      showToast("error", "Failed to deny recordal");
    }
  }
  let currentAppeal: { fileNumber: string; applicationId: string } | null =
    null;

  async function viewAppeal(application: ApplicationHistoryType) {
    selectedApplication = application;
    try {
      const response = await fetch(
        `${baseURL}/api/files/getappeal?fileId=${fileData.fileId}&appId=${application.id}`,
      );

      if (response.ok) {
        const data = await response.json();
        appealDocs = data.appealDocs || [];
        currentAppeal = {
          fileNumber: fileData.fileId,
          applicationId: application.id,
        };
        showAppealRequest = true;
      } else {
        showToast("error", "Failed to fetch appeal details");
      }
    } catch (error) {
      console.error("Fetch appeal error:", error);
      showToast("error", "An error occurred while fetching appeal details");
    }
  }
  // New variables for appeal treatment
  let appealReason = "";
  let appealReasonError = "";
  let submittingAppeal = false;
  let isApproving = false;

  function validateReason(): boolean {
    if (!appealReason?.trim()) {
      appealReasonError = "Reason is required";
      return false;
    }
    if (appealReason.trim().length < 10) {
      appealReasonError = "Reason must be at least 10 characters";
      return false;
    }
    appealReasonError = "";
    return true;
  }

  async function handleApproveAppeal(application: ApplicationHistoryType) {
    if (!validateReason()) return;
    isApproving = true;
    submittingAppeal = true;

    try {
      const response = await fetch(`${baseURL}/api/files/treat-appeal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileNumber: fileData.fileId,
          applicationId: currentAppeal?.applicationId,
          reason: appealReason.trim(),
          isApproved: true,
          userId: $loggedInUser?.id ?? $loggedInUser?.creatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to approve appeal");
      }

      const result = await response.json();

      if (result) {
        toast.success("Appeal approved successfully", {
          description:
            "The application status has been updated to Publication.",
        });
        showAppealRequest = false;
        appealReason = "";
        appealReasonError = "";

        // Refresh your data or emit an event
        // Example: dispatch('appealTreated', { approved: true });
      } else {
        toast.error("No changes were made", {
          description: "The appeal may have already been processed.",
        });
      }
    } catch (error) {
      console.error("Error approving appeal:", error);
      toast.error("Failed to approve appeal", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      submittingAppeal = false;
      isApproving = false;
    }
  }

  async function handleDenyAppeal(application: ApplicationHistoryType) {
    if (!validateReason()) return;

    isApproving = false;
    submittingAppeal = true;

    try {
      const response = await fetch(`${baseURL}/api/files/treat-appeal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileNumber: fileData.fileId,
          applicationId: currentAppeal?.applicationId,
          reason: appealReason.trim(),
          isApproved: false,
          userId: $loggedInUser?.id ?? $loggedInUser?.creatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to deny appeal");
      }

      const result = await response.json();

      if (result) {
        toast.success("Appeal denied", {
          description: "The application status has been updated to Rejected.",
        });
        showAppealRequest = false;
        appealReason = "";
        appealReasonError = "";

        // Refresh your data or emit an event
        // Example: dispatch('appealTreated', { approved: false });
      } else {
        toast.error("No changes were made", {
          description: "The appeal may have already been processed.",
        });
      }
    } catch (error) {
      console.error("Error denying appeal:", error);
      toast.error("Failed to deny appeal", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      submittingAppeal = false;
    }
  }

  // Reset form when dialog closes
  $: if (!showAppealRequest) {
    appealReason = "";
    appealReasonError = "";
    submittingAppeal = false;
    isApproving = false;
  }
  // Specific approval handlers
  const approveMerger = (app: ApplicationHistoryType) =>
    approveRecordal(
      "/api/files/ApproveMerger",
      app,
      "Merger approved successfully",
    );

  const approveRegUser = (app: ApplicationHistoryType) =>
    approveRecordal(
      "/api/files/ApproveRegisteredUser",
      app,
      "Registered user approved successfully",
    );

  const approveAssignment = (app: ApplicationHistoryType) =>
    approveRecordal(
      "/api/files/ApproveAssignment",
      app,
      "Assignment approved successfully",
    );

  const approveChangeDataRecordal = (app: ApplicationHistoryType) =>
    approveRecordal(
      "/api/files/ApproveChangeDataRecordal",
      app,
      "Change of Applicant Information approved successfully",
    );

  // ======================
  // Status Management
  // ======================
  function changeStatus(application: ApplicationHistoryType) {
    selectedApplication = application;
    showUpdateStatusForm = true;
  }

  function showTreatDialog(application: ApplicationHistoryType) {
    if (application.currentStatus == ApplicationStatuses.AwaitingSearch) {
      possibleOptions = [
        ApplicationStatuses.AwaitingExaminer,
        ApplicationStatuses.FormalityFail,
      ];
    }
    if (application.currentStatus == ApplicationStatuses.AwaitingExaminer) {
      possibleOptions = [
        ApplicationStatuses.Active,
        ApplicationStatuses.Rejected,
      ];
    }
    selectedApplication = application;
    showUpdateStatusForm = true;
  }

  function handleStatusAttachmentChange(
    e: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    newStatusAttachment = e.currentTarget.files?.[0] ?? null;
  }

  // ======================
  // Status Transition Rules
  // ======================
  // Returns the list of status option *names* (keys of ApplicationStatuses)
  // that make sense as the next status for the given application, based on
  // its type and current status. Falls back to all statuses when no specific
  // rule matches so admins are never blocked.
  function getAvailableStatuses(app: ApplicationHistoryType | null): string[] {
    const allStatusNames = Object.keys(ApplicationStatuses).filter((x) =>
      isNaN(parseInt(x)),
    );
    const toNames = (values: ApplicationStatuses[]): string[] =>
      values
        .map((v) => ApplicationStatuses[v])
        .filter((n): n is string => typeof n === "string");

    if (!app || app.currentStatus == null || app.applicationType == null) {
      return allStatusNames;
    }

    const type = app.applicationType;
    const current = app.currentStatus;

    // Recordal-style flows (Assignment, RegisteredUser, Merger, ChangeOfName,
    // ChangeOfAddress, ClericalUpdate, Amendment, License, Mortgage,
    // CertifiedTrueCopy, Reclassification)
    const recordalTypes = new Set<number>([
      FormApplicationTypes.Assignment,
      FormApplicationTypes.RegisteredUser,
      FormApplicationTypes.Merger,
      FormApplicationTypes.ChangeOfName,
      FormApplicationTypes.ChangeOfAddress,
      FormApplicationTypes.ClericalUpdate,
      FormApplicationTypes.Amendment,
      FormApplicationTypes.License,
      FormApplicationTypes.Mortgage,
      FormApplicationTypes.CertifiedTrueCopy,
      FormApplicationTypes.Reclassification,
    ]);
    if (recordalTypes.has(type)) {
      switch (current) {
        case ApplicationStatuses.AwaitingPayment:
          return toNames([
            ApplicationStatuses.AwaitingRecordalProcess,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.AwaitingRecordalProcess:
        case ApplicationStatuses.AwaitingApproval:
          return toNames([
            ApplicationStatuses.Approved,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.Approved:
        case ApplicationStatuses.Rejected:
          return toNames([
            ApplicationStatuses.AwaitingApproval,
            ApplicationStatuses.AwaitingRecordalProcess,
          ]);
      }
    }

    // New application flow (Trademark / Patent / Design new filings)
    if (type === FormApplicationTypes.NewApplication) {
      switch (current) {
        // case ApplicationStatuses.AwaitingPayment:
        //   return toNames([
        //     ApplicationStatuses.AwaitingSearch,
        //     ApplicationStatuses.Rejected,
        //   ]);
        case ApplicationStatuses.AwaitingSearch:
          return toNames([ApplicationStatuses.Rejected]);
        case ApplicationStatuses.AwaitingExaminer:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.Re_conduct,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.FormalityFail:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.Active:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.AwaitingExaminer,
            ApplicationStatuses.Re_conduct,
            ApplicationStatuses.AwaitingCertificateConfirmation,
            ApplicationStatuses.Publication,
            ApplicationStatuses.Opposition,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.Publication:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.AwaitingExaminer,
            ApplicationStatuses.Re_conduct,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.Opposition:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.AwaitingExaminer,
            ApplicationStatuses.Publication,
            ApplicationStatuses.Re_conduct,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.AwaitingCertificateConfirmation:
        case ApplicationStatuses.AwaitingCertification:
          return toNames([
            ApplicationStatuses.AwaitingSearch,
            ApplicationStatuses.AwaitingExaminer,
            ApplicationStatuses.Publication,
            ApplicationStatuses.Opposition,
            ApplicationStatuses.Re_conduct,
            ApplicationStatuses.Rejected,
          ]);
      }
    }

    // Renewal flow
    if (type === FormApplicationTypes.LicenseRenewal) {
      switch (current) {
        case ApplicationStatuses.AwaitingPayment:
          return toNames([
            ApplicationStatuses.PendingRenewal,
            ApplicationStatuses.Rejected,
          ]);
        case ApplicationStatuses.PendingRenewal:
        case ApplicationStatuses.AwaitingRenewalConfirmation:
          return toNames([
            ApplicationStatuses.Approved,
            ApplicationStatuses.Rejected,
          ]);
      }
    }

    // Opposition flow
    if (type === FormApplicationTypes.NewOpposition) {
      switch (current) {
        case ApplicationStatuses.NewOpposition:
          return toNames([
            ApplicationStatuses.AwaitingCounter,
            ApplicationStatuses.Withdrawn,
          ]);
        case ApplicationStatuses.AwaitingCounter:
        case ApplicationStatuses.RequestWithdrawal:
          return toNames([
            ApplicationStatuses.StatutoryDeclaration,
            ApplicationStatuses.Withdrawn,
          ]);
        case ApplicationStatuses.StatutoryDeclaration:
          return toNames([
            ApplicationStatuses.AwaitingResolution,
            ApplicationStatuses.Resolved,
          ]);
      }
    }

    // Appeal flow
    if (type === FormApplicationTypes.AppealRequest) {
      if (current === ApplicationStatuses.AppealRequest) {
        return toNames([
          ApplicationStatuses.Publication,
          ApplicationStatuses.Rejected,
        ]);
      }
    }

    // Publication status update
    if (type === FormApplicationTypes.PublicationStatusUpdate) {
      if (current === ApplicationStatuses.AwaitingStatusUpdate) {
        return toNames([
          ApplicationStatuses.Publication,
          ApplicationStatuses.Rejected,
        ]);
      }
    }

    // Withdrawal request
    if (type === FormApplicationTypes.WithdrawalRequest) {
      if (
        current === ApplicationStatuses.WithdrawalRequested ||
        current === ApplicationStatuses.RequestWithdrawal
      ) {
        return toNames([
          ApplicationStatuses.WithdrawalApproved,
          ApplicationStatuses.Rejected,
        ]);
      }
    }

    // Fallback: no specific rule — allow any status.
    return allStatusNames;
  }

  async function confirmChange() {
    isNewStatusLoading = true;

    try {
      if (!selectedApplication) {
        showToast("error", "No application selected");
        isNewStatusLoading = false;
        return;
      }
      if (!$loggedInUser) {
        showToast("error", "User not logged in");
        isNewStatusLoading = false;
        return;
      }

      const formData = new FormData();
      formData.append("fileId", String(fileData.id));
      formData.append("applicationId", String(selectedApplication.id));
      formData.append(
        "applicationType",
        String(selectedApplication.applicationType ?? ""),
      );
      formData.append(
        "beforeStatus",
        String(selectedApplication.currentStatus ?? ""),
      );
      formData.append(
        "afterStatus",
        String(mapStatusStringToStatus(String(newStatus ?? ""))),
      );
      formData.append("reason", newStatusReason ?? "");
      formData.append(
        "userId",
        String($loggedInUser?.id ?? $loggedInUser?.creatorId ?? ""),
      );
      formData.append("userName", name);
      if (newStatusAttachment) {
        formData.append(
          "attachment",
          newStatusAttachment,
          newStatusAttachment.name,
        );
      }

      const response = await fetch(
        `${baseURL}/api/files/AdminUpdateApplication`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const latestData = await response.json();
        fileData = latestData;
        applicationData.set(latestData);
        newStatusContent = 2;
      } else {
        showToast("error", "Failed to update application status");
      }
    } catch (error) {
      console.error("Status change error:", error);
      showToast("error", "Failed to update application status");
    } finally {
      isNewStatusLoading = false;
    }
  }

  function validateMove(application: ApplicationHistoryType, letter: number) {
    if (hasValidCorrespondenceDetails(fileData.correspondence)) {
      window.open(
        `${baseURL}/api/letters/generate?fileId=${fileData?.id}&letterType=${letter}&applicationId=${application.id}`,
        "_blank",
      );
    } else {
      showMissingDetailsForm();
    }
  }

  function viewDataUpdateApplication(application: ApplicationHistoryType) {
    viewUpdatesMade.set(application);
    adjustmentType.set(3);
    applicationData.set(fileData);
    goto(`/updatesmade?id=${fileData.id}`);
  }

  function loadMetadata(application: ApplicationHistoryType) {
    metaDataInfo.set(application);
    goto(`/metadata?fileId=${fileData?.id}&applicationId=${application.id}`);
  }

  function printStatusReceipt(application: ApplicationHistoryType) {
    window.open(
      `${baseURL}/api/letters/generate?fileId=${fileData?.fileId}&letterType=39&applicationId=${application.id}`,
    );
  }

  let getDocFileNumber = fileData.fileId;
  let getDocPaymentId = "";
  let getDocLoading = false;
  let getDocResult: any = null;
  let getDocError: string | null = null;
  let documents: any[] = [];
  let appId: string = "";

  async function getDocuments() {
    getDocError = null;
    getDocResult = null;

    getDocLoading = true;
    try {
      const response = await fetch(
        `${baseURL}/api/letters/GetDocuments?fileId=${encodeURIComponent(getDocFileNumber.trim())}&paymentId=${encodeURIComponent(getDocPaymentId.trim())}`,
      );
      if (!response.ok) {
        const errorData = await response.json();
        getDocError = errorData.message || "An error occurred";
        throw new Error(getDocError ?? "An error occurred");
        // toast(g)
      }
      getDocResult = await response.json();
      if (getDocResult.documents && Array.isArray(getDocResult.documents)) {
        documents = getDocResult.documents;
        appId = getDocResult.applicationId;
      } else {
        documents = [];
      }
    } catch (e: any) {
      getDocError = e.Message || e;
    }
    getDocLoading = false;
  }

  async function openPublicationDialog(fileId: string, applicationId: string) {
    publicationLoading = true;
    publicationError = null;
    publicationDetails = null;
    publicationComment = "";
    publicationApplicationId = applicationId;
    publicationFileId = fileId;
    showPublicationDialog = true;
    try {
      const res = await fetch(
        `${baseURL}/api/files/publication-details/${encodeURIComponent(fileId)}`,
      );
      if (!res.ok) throw new Error("Could not fetch details");
      publicationDetails = await res.json();
    } catch (e) {
      const err = e as Error;
      publicationError = err.message || "Error loading details";
    } finally {
      publicationLoading = false;
    }
  }

  async function handlePublicationDecision(approve: boolean) {
    publicationSubmitting = true;
    try {
      const res = await fetch(
        `${baseURL}/api/files/PublicationStatusDecision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FileId: publicationFileId,
            Approve: approve,
            Comment: publicationComment,
            UserId: $loggedInUser?.id ?? $loggedInUser?.creatorId,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(data.message);
      showPublicationDialog = false;
      // Optionally refresh data here
    } catch (e) {
      const err = e as Error;
      publicationError = err.message || "Error submitting decision";
    } finally {
      publicationSubmitting = false;
    }
  }

  // Fetch withdrawal details
  async function openWithdrawalDialog(fileId: string, applicationId: string) {
    withdrawalLoading = true;
    withdrawalError = null;
    withdrawalDetails = null;
    withdrawalComment = "";
    withdrawalFileId = fileId;
    withdrawalApplicationId = applicationId;
    showWithdrawalDialog = true;
    try {
      const res = await fetch(
        `${baseURL}/api/files/withdrawal-details/${encodeURIComponent(fileId)}`,
      );
      if (!res.ok) throw new Error("Could not fetch details");
      withdrawalDetails = await res.json();
    } catch (e) {
      const err = e as Error;
      withdrawalError = err.message || "Error loading details";
    } finally {
      withdrawalLoading = false;
    }
  }

  // Approve/Reject withdrawal
  async function handleWithdrawalDecision(approve: boolean) {
    withdrawalSubmitting = true;
    try {
      const res = await fetch(
        `${baseURL}/api/files/withdrawalrequestdecision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            FileId: withdrawalFileId,
            Approve: approve,
            Comment: withdrawalComment,
            UserId: $loggedInUser?.id ?? $loggedInUser?.creatorId,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(data.message);
      showWithdrawalDialog = false;
      setTimeout(() => {
        location.reload();
      }, 3000); // Wait 3 seconds before reloading
      // Optionally refresh data here
    } catch (e) {
      const err = e as Error;
      withdrawalError = err.message || "Error submitting decision";
    } finally {
      withdrawalSubmitting = false;
    }
  }

  // Open patent assignment dialog
  function openPatentAssignmentDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentAssignmentFileId = fileId;
    patentAssignmentApplicationId = applicationId;
    patentAssignmentStatus = status;
    showPatentAssignmentDialog = true;
  }

  // Open patent license dialog
  function openPatentLicenseDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentLicenseFileId = fileId;
    patentLicenseApplicationId = applicationId;
    patentLicenseStatus = status;
    showPatentLicenseDialog = true;
  }

  // Open design license dialog
  function openDesignLicenseDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designLicenseFileId = fileId;
    designLicenseApplicationId = applicationId;
    designLicenseStatus = status;
    showDesignLicenseDialog = true;
  }

  // Open patent merger dialog
  function openPatentMergerDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentMergerFileId = fileId;
    patentMergerApplicationId = applicationId;
    patentMergerStatus = status;
    showPatentMergerDialog = true;
  }

  // Open design merger dialog
  function openDesignMergerDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designMergerFileId = fileId;
    designMergerApplicationId = applicationId;
    designMergerStatus = status;
    showDesignMergerDialog = true;
  }

  // Open patent mortgage dialog
  function openPatentMortgageDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentMortgageFileId = fileId;
    patentMortgageApplicationId = applicationId;
    patentMortgageStatus = status;
    showPatentMortgageDialog = true;
  }

  // Open design assignment dialog
  function openDesignAssignmentDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designAssignmentFileId = fileId;
    designAssignmentApplicationId = applicationId;
    designAssignmentStatus = status;
    showDesignAssignmentDialog = true;
  }

  // Open design mortgage dialog
  function openDesignMortgageDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designMortgageFileId = fileId;
    designMortgageApplicationId = applicationId;
    designMortgageStatus = status;
    showDesignMortgageDialog = true;
  }

  // Open design CTC dialog
  function openDesignCTCDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designCTCFileId = fileId;
    designCTCApplicationId = applicationId;
    designCTCStatus = status;
    showDesignCTCDialog = true;
  }

  // Open patent CTC dialog
  function openPatentCTCDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentCTCFileId = fileId;
    patentCTCApplicationId = applicationId;
    patentCTCStatus = status;
    showPatentCTCDialog = true;
  }

  // Open trademark CTC dialog
  function openTrademarkCTCDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    trademarkCTCFileId = fileId;
    trademarkCTCApplicationId = applicationId;
    trademarkCTCStatus = status;
    showTrademarkCTCDialog = true;
  }

  function openOfflineRenewalDialog(applicationId: string, status: number) {
    offlineRenewalApplicationId = applicationId;
    offlineRenewalStatus = status;
    showOfflineRenewalDialog = true;
  }

  // Open design amendment dialog
  function openDesignAmendmentDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    designAmendmentFileId = fileId;
    designAmendmentApplicationId = applicationId;
    designAmendmentStatus = status;
    showDesignAmendmentDialog = true;
  }

  // Open patent amendment dialog
  function openPatentAmendmentDialog(
    fileId: string,
    applicationId: string,
    status: number,
  ) {
    patentAmendmentFileId = fileId;
    patentAmendmentApplicationId = applicationId;
    patentAmendmentStatus = status;
    showPatentAmendmentDialog = true;
  }
</script>

<Toaster />
<AlertDialog.Root bind:open={showAlertDialog}>
  <AlertDialog.Content
    class="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
  >
    <!-- Header -->
    <div class="px-6 pt-6 pb-4 border-b border-slate-100">
      <AlertDialog.Header class="space-y-1">
        <AlertDialog.Title
          class="text-lg font-semibold text-slate-900 tracking-tight"
        >
          Payment Confirmation
        </AlertDialog.Title>
        <!-- <AlertDialog.Description class="text-xs text-slate-500">
          Response from Remita
        </AlertDialog.Description> -->
      </AlertDialog.Header>
    </div>

    <!-- Body -->
    <div class="px-6 py-5">
      {#if remita_confirmation === "checking"}
        <div class="flex flex-col items-center justify-center py-8 gap-3">
          <div
            class="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center"
          >
            <Icon
              icon="line-md:loading-loop"
              width="1.75rem"
              height="1.75rem"
              class="text-slate-600 animate-spin"
            />
          </div>
          <p class="text-sm text-slate-600">Verifying payment status…</p>
        </div>
      {:else if remita_confirmation === "success"}
        <div class="flex flex-col items-center text-center py-6 gap-4">
          <div
            class="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-100/60"
          >
            <Icon
              icon="clarity:success-standard-line"
              width="1.75rem"
              height="1.75rem"
              class="text-emerald-600"
            />
          </div>
          <div class="space-y-1">
            <p class="text-base font-semibold text-slate-900">
              Application updated
            </p>
            <p class="text-xs text-slate-500">
              The payment has been confirmed successfully.
            </p>
          </div>
          <Button
            on:click={() => (showAlertDialog = false)}
            class="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10"
          >
            Close
          </Button>
        </div>
      {:else if remita_confirmation === "verify_update"}
        <div class="space-y-5">
          <!-- Status banner -->
          <div
            class="flex items-center gap-3 rounded-xl px-4 py-3 border {status ===
            '00'
              ? 'bg-emerald-50/60 border-emerald-100'
              : 'bg-amber-50/60 border-amber-100'}"
          >
            <div
              class="h-9 w-9 rounded-full flex items-center justify-center {status ===
              '00'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'}"
            >
              <Icon
                icon={status === "00"
                  ? "mdi:check-circle-outline"
                  : "mdi:clock-outline"}
                width="1.25rem"
                height="1.25rem"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-slate-500">Payment Status</p>
              <p
                class="text-sm font-semibold {status === '00'
                  ? 'text-emerald-700'
                  : 'text-amber-700'}"
              >
                {status === "00" ? "Successful" : "Pending"}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">Amount</p>
              <p class="text-sm font-semibold text-slate-900">
                ₦{amount ?? ""}
              </p>
            </div>
          </div>

          <!-- Details -->
          <dl
            class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden"
          >
            <div class="flex items-center justify-between px-4 py-2.5">
              <dt class="text-xs font-medium text-slate-500">Payment Date</dt>
              <dd class="text-sm text-slate-900">{paymentDate || ""}</dd>
            </div>
            <div class="flex items-start justify-between gap-4 px-4 py-2.5">
              <dt class="text-xs font-medium text-slate-500">Description</dt>
              <dd
                class="text-sm text-slate-900 text-right break-words max-w-[60%]"
              >
                {paymentDescription || ""}
              </dd>
            </div>
          </dl>

          <!-- Actions -->
          <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button
              on:click={() => (showAlertDialog = false)}
              variant="outline"
              class="flex-1 h-10 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {showManualUpdate || updateCert ? "Cancel" : "Close"}
            </Button>
            {#if showManualUpdate}
              <Button
                on:click={updateManual}
                class="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Icon icon="mdi:check" class="mr-1.5" width="1em" />
                Confirm Payment
              </Button>
            {/if}
            {#if $loggedInUser?.userRoles.includes(UserRoles.Tech || UserRoles.SuperAdmin) && updateCert}
              <Button
                on:click={() =>
                  updateCertPaymentStatus(validateRRR, fileData.fileId)}
                class="flex-1 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Icon
                  icon="mdi:certificate-outline"
                  class="mr-1.5"
                  width="1em"
                />
                Update Certificate
              </Button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </AlertDialog.Content>
</AlertDialog.Root>

<Dialog.Root bind:open={showDataComparison}>
  <Dialog.Content class="w-11/12 max-w-4xl mx-auto my-4 h-[85vh]">
    <Dialog.Header>
      <Dialog.Title class="capitalize">
        {selectedApplication?.fieldToChange?.replace(/([A-Z])/g, " $1")} Comparison
      </Dialog.Title>
      <Dialog.Description>
        Changes for {mapTypeToString(selectedApplication?.applicationType || 0)}
      </Dialog.Description>
    </Dialog.Header>

    <div class="h-[calc(100%-4rem)] overflow-auto">
      {#if dataType() === "table"}
        <ComparisonTable
          oldData={selectedOldValue}
          newData={selectedNewValue}
          type={selectedApplication?.fieldToChange ?? ""}
        />
      {:else if dataType() === "attachments"}
        <AttachmentsComparison
          oldData={selectedOldValue}
          newData={selectedNewValue}
        />
      {:else if dataType() === "correspondence"}
        <CorrespondenceComparison
          oldData={selectedOldValue}
          newData={selectedNewValue}
        />
      {:else}
        <OtherComparison
          oldData={selectedOldValue}
          newData={selectedNewValue}
          field={selectedApplication?.fieldToChange ?? ""}
        />
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showRecordalDialog}>
  <Dialog.Content
    class="w-11/12 max-w-6xl mx-auto my-4 max-h-[92vh] overflow-hidden flex flex-col border-0 shadow-lg rounded-xl bg-white"
  >
    <!-- Header -->
    <div class="border-b border-slate-200 px-6 py-4">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900"
        >
          <Icon
            icon={selectedApplication?.applicationType ===
            FormApplicationTypes.Assignment
              ? "mdi:swap-horizontal"
              : selectedApplication?.applicationType ===
                  FormApplicationTypes.Merger
                ? "mdi:merge"
                : selectedApplication?.applicationType ===
                    FormApplicationTypes.ClericalUpdate
                  ? "mdi:pencil-outline"
                  : selectedApplication?.applicationType ===
                      FormApplicationTypes.Amendment
                    ? "mdi:file-edit-outline"
                    : "mdi:file-document-outline"}
            width="1.3em"
            class="text-white"
          />
        </div>
        <div class="flex-1 min-w-0">
          <Dialog.Title class="text-lg font-semibold text-slate-900">
            {selectedApplication?.applicationType === 8
              ? "Merger Information"
              : selectedApplication?.applicationType === 7
                ? "Registered User Information"
                : selectedApplication?.applicationType === 9
                  ? "Change of Name Information"
                  : selectedApplication?.applicationType === 10
                    ? "Change of Address Information"
                    : selectedApplication?.applicationType === 11
                      ? "Clerical Update Information"
                      : selectedApplication?.applicationType === 17
                        ? "Amendment Information"
                        : selectedApplication?.applicationType === 5
                          ? "Assignment Information"
                          : "Application Details"}
          </Dialog.Title>
          <Dialog.Description class="text-xs text-slate-600 mt-1">
            {mapTypeToString(selectedApplication?.applicationType || 0)} • File ID:
            <span class="font-medium text-slate-900"
              >{fileData?.fileId ?? "—"}</span
            >
          </Dialog.Description>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-4">
      {#if recordalLoading}
        <div class="flex flex-col items-center justify-center h-40 gap-2">
          <Icon
            icon="line-md:loading-loop"
            width="2rem"
            height="2rem"
            class="animate-spin text-slate-300"
          />
          <p class="text-xs text-slate-500">Loading application data</p>
        </div>
      {:else if recordalData}
        <div class="space-y-6">
          <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Form Header
                </p>
                <p class="text-sm text-slate-700 mt-1">
                  {recordalData.oldValue?.title || recordalData.newValue?.title || "—"}
                </p>
              </div>
              <div class="text-right text-xs text-slate-500">
                <div>File ID: {fileData?.fileId ?? "—"}</div>
                <div>Type: {recordalData.oldValue?.fileType || recordalData.newValue?.fileType || "—"}</div>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-slate-500">File Number</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.fileNumber || "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Product Class</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.productClass ?? "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">RTM Number</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.rtmNumber || "—"}</div>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <div class="text-xs text-slate-500">Current Applicant</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.name || "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Email</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.email || "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Phone</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.phone || "—"}</div>
                </div>
              </div>
              <div class="space-y-3 md:col-span-2">
                <div>
                  <div class="text-xs text-slate-500">Address</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.address || "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Country</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.country || "—"}</div>
                </div>
                <div>
                  <div class="text-xs text-slate-500">Nationality</div>
                  <div class="text-sm text-slate-900">{recordalData.oldValue?.nationality || "—"}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="grid gap-6 lg:grid-cols-2">
            {#if selectedApplication?.applicationType === FormApplicationTypes.Assignment}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Assignor
                </p>
                <div class="mt-4 space-y-3 text-sm text-slate-900">
                  <div>
                    <div class="text-xs text-slate-500">Name</div>
                    <div>{recordalData.assignment?.assignorName || recordalData.oldValue?.name || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Email</div>
                    <div>{recordalData.assignment?.assignorEmail || recordalData.oldValue?.email || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Phone</div>
                    <div>{recordalData.assignment?.assignorPhone || recordalData.oldValue?.phone || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Nationality</div>
                    <div>{recordalData.assignment?.assignorNationality || recordalData.oldValue?.nationality || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Address</div>
                    <div>{recordalData.assignment?.assignorAddress || recordalData.oldValue?.address || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Country</div>
                    <div>{recordalData.assignment?.assignorCountry || recordalData.oldValue?.country || "—"}</div>
                  </div>
                </div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Assignee / New Value
                </p>
                <div class="mt-4 space-y-3 text-sm text-slate-900">
                  <div>
                    <div class="text-xs text-slate-500">Name</div>
                    <div>{recordalData.assignment?.assigneeName || recordalData.newValue?.assigneeName || recordalData.newValue?.name || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Email</div>
                    <div>{recordalData.assignment?.assigneeEmail || recordalData.newValue?.assigneeEmail || recordalData.newValue?.email || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Phone</div>
                    <div>{recordalData.assignment?.assigneePhone || recordalData.newValue?.assigneePhone || recordalData.newValue?.phone || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Nationality</div>
                    <div>{recordalData.assignment?.assigneeNationality || recordalData.newValue?.assigneeNationality || recordalData.newValue?.nationality || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Address</div>
                    <div>{recordalData.assignment?.assigneeAddress || recordalData.newValue?.assigneeAddress || recordalData.newValue?.address || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Country</div>
                    <div>{recordalData.assignment?.assigneeCountry || recordalData.newValue?.assigneeCountry || recordalData.newValue?.country || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Date of Assignment</div>
                    <div>{recordalData.assignment?.dateOfAssignment || recordalData.newValue?.dateOfAssignment || "—"}</div>
                  </div>
                </div>
              </div>
            {:else if selectedApplication?.applicationType === FormApplicationTypes.RegisteredUser || selectedApplication?.applicationType === FormApplicationTypes.Merger}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {selectedApplication?.applicationType === FormApplicationTypes.Merger ? "Merger" : "Registered User"} Details
                </p>
                <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-900">
                  <div>
                    <div class="text-xs text-slate-500">Name</div>
                    <div>{recordalData.newValue?.name || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Email</div>
                    <div>{recordalData.newValue?.email || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Phone</div>
                    <div>{recordalData.newValue?.phone || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">Nationality</div>
                    <div>{recordalData.newValue?.nationality || "—"}</div>
                  </div>
                  <div class="md:col-span-2">
                    <div class="text-xs text-slate-500">Address</div>
                    <div>{recordalData.newValue?.address || "—"}</div>
                  </div>
                  {#if selectedApplication?.applicationType === FormApplicationTypes.Merger}
                    <div class="md:col-span-2">
                      <div class="text-xs text-slate-500">Merger Date</div>
                      <div>{recordalData.newValue?.mergerDate || "—"}</div>
                    </div>
                  {/if}
                </div>
              </div>
            {:else if selectedApplication?.applicationType === FormApplicationTypes.ChangeOfName}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Change of Name Details
                </p>
                <div class="mt-4 space-y-4 text-sm text-slate-900">
                  <div>
                    <div class="text-xs text-slate-500">Current Name</div>
                    <div>{recordalData.oldValue?.name || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">New Name</div>
                    <div>{recordalData.newValue?.newName || recordalData.newValue?.name || "—"}</div>
                  </div>
                </div>
              </div>
            {:else if selectedApplication?.applicationType === FormApplicationTypes.ChangeOfAddress}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Change of Address Details
                </p>
                <div class="mt-4 space-y-4 text-sm text-slate-900">
                  <div>
                    <div class="text-xs text-slate-500">Current Address</div>
                    <div>{recordalData.oldValue?.address || "—"}</div>
                  </div>
                  <div>
                    <div class="text-xs text-slate-500">New Address</div>
                    <div>{recordalData.newValue?.newAddress || recordalData.newValue?.address || "—"}</div>
                  </div>
                </div>
              </div>
            {:else}
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recordal Details</p>
                <div class="mt-4 space-y-3 text-sm text-slate-900">
                  {#each Object.entries(recordalData.newValue || {}) as [key, value]}
                    <div class="grid grid-cols-2 gap-4">
                      <div class="text-xs text-slate-500">{key}</div>
                      <div>{value}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </section>

          <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Attachments
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              {#if recordalData.documentUrl}
                <Button
                  on:click={() => window.open(recordalData.documentUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                >
                  <Icon icon="mdi:file-document-outline" width="1em" />Document
                </Button>
              {/if}
              {#if recordalData.assignment?.deedOfAgreementUrl}
                <Button
                  on:click={() => window.open(recordalData.assignment.deedOfAgreementUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                >
                  <Icon icon="mdi:file-sign" width="1em" />Assignment Deed
                </Button>
              {/if}
              {#if recordalData.assignment?.authorizationLetterUrl}
                <Button
                  on:click={() => window.open(recordalData.assignment.authorizationLetterUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                >
                  <Icon icon="mdi:file-certificate-outline" width="1em" />Authorization
                </Button>
              {/if}
              {#if recordalData.newValue?.attachments && recordalData.newValue.attachments.length > 0}
                {#each recordalData.newValue.attachments as attachment}
                  <Button
                    on:click={() => window.open(attachment.url, "_blank")}
                    variant="outline"
                    size="sm"
                    class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Icon icon="mdi:file-document-outline" width="1em" />{attachment.fileName}
                  </Button>
                {/each}
              {/if}
              {#if recordalData.appealDocs && Array.isArray(recordalData.appealDocs)}
                {#each recordalData.appealDocs as docUrl, index}
                  <Button
                    on:click={() => window.open(docUrl, "_blank")}
                    variant="outline"
                    size="sm"
                    class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Icon icon="mdi:file-document-outline" width="1em" />Appeal {index + 1}
                  </Button>
                {/each}
              {/if}
            </div>
          </section>
        </div>
      {:else}
        <div class="flex flex-col items-center justify-center h-40 gap-2">
          <Icon
            icon="mdi:file-alert-outline"
            class="text-slate-300"
            width="2.5rem"
            height="2.5rem"
          />
          <p class="text-xs text-slate-400">No application data available</p>
        </div>
      {/if}

      <!-- Decision Reason -->
      {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.TrademarkCertification, UserRoles.SuperAdmin, UserRoles.Tech, UserRoles.TrademarkAcceptance].some( (r) => $loggedInUser.userRoles.includes(r), )}
        {#if [5, 7, 8, 9, 10, 11, 17, 36].includes(selectedApplication?.applicationType ?? -1) && (selectedApplication?.currentStatus == ApplicationStatuses.AwaitingRecordalProcess || selectedApplication?.currentStatus == ApplicationStatuses.AwaitingApproval)}
          <div class="mt-4 pt-4 border-t border-slate-200">
            <Label
              for="approval-reason"
              class="text-xs font-semibold text-slate-900 block mb-2"
            >
              Decision Reason <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="approval-reason"
              class="w-full rounded border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-slate-900 placeholder:text-slate-400 min-h-20 px-3 py-2 text-xs resize-none"
              placeholder="Provide detailed reason..."
              bind:value={reason}
            />
            {#if reason && reason.trim().length > 0 && reason.trim().length < 10}
              <p class="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <Icon icon="mdi:alert-circle" width="14" />
                Minimum 10 characters required
              </p>
            {/if}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Footer -->
    <div
      class="border-t border-slate-200 px-6 py-3 flex flex-wrap gap-2 justify-end"
    >
      {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.TrademarkCertification, UserRoles.SuperAdmin, UserRoles.Tech, UserRoles.TrademarkAcceptance].some( (r) => $loggedInUser.userRoles.includes(r), )}
        {#if [5, 7, 8, 9, 10, 11, 36, 17].includes(selectedApplication?.applicationType ?? -1) && (selectedApplication?.currentStatus == ApplicationStatuses.AwaitingRecordalProcess || selectedApplication?.currentStatus == ApplicationStatuses.AwaitingApproval)}
          <Button
            on:click={() => {
              if (!reason || reason.trim().length < 10) {
                showToast(
                  "error",
                  "Please provide a detailed reason (at least 10 characters)",
                );
                return;
              }
              switch (selectedApplication?.applicationType) {
                case 5:
                  approveAssignment(selectedApplication);
                  break;
                case 7:
                  approveRegUser(selectedApplication);
                  break;
                case 8:
                  approveMerger(selectedApplication);
                  break;
                case 17:
                  approveAmendment(selectedApplication);
                  break;
                case 9:
                case 36:
                case 10:
                  approveChangeDataRecordal(selectedApplication);
                  break;
                case 11:
                  approveRecordal(
                    "/api/files/ApproveClericalUpdate",
                    selectedApplication,
                    "Clerical update approved successfully",
                  );
                  break;
              }
            }}
            disabled={!reason || reason.trim().length < 10}
            class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
          >
            <Icon icon="mdi:check" class="mr-1" width="1em" />
            Approve
          </Button>
          <Button
            on:click={() => {
              if (!reason || reason.trim().length < 10) {
                showToast(
                  "error",
                  "Please provide a detailed reason (at least 10 characters)",
                );
                return;
              }
              if (selectedApplication) denyRecordal(selectedApplication);
            }}
            disabled={!reason || reason.trim().length < 10}
            class="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
          >
            <Icon icon="mdi:close" class="mr-1" width="1em" />
            Deny
          </Button>
        {/if}
      {/if}

      <Button
        on:click={() => {
          showRecordalDialog = false;
          reason = "";
        }}
        variant="outline"
        class="text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded transition-colors"
      >
        Close
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showAppealRequest}>
  <Dialog.Content class="w-11/12 max-w-4xl mx-auto my-4 max-h-[90vh]">
    <Dialog.Header>
      <Dialog.Title>Treat Appeal Request</Dialog.Title>
      <Dialog.Description
        >Review the appeal documents and provide your decision</Dialog.Description
      >
    </Dialog.Header>

    {#if recordalLoading}
      <div class="flex justify-center items-center h-64">
        <Icon
          icon="line-md:loading-loop"
          width="2.5rem"
          height="2.5rem"
          class="animate-spin"
        />
      </div>
    {:else if appealDocs}
      <div class="overflow-auto max-h-[60vh] p-4 space-y-4">
        <!-- Appeal Documents Section -->
        <div class="border rounded-lg p-4 space-y-2">
          <h3 class="font-semibold text-sm text-gray-700">Appeal Documents</h3>
          <div class="flex flex-wrap gap-2">
            {#each appealDocs as docUrl, index}
              <Button
                on:click={() => window.open(docUrl, "_blank")}
                variant="outline"
                class="flex items-center gap-1"
              >
                <Icon icon="mdi:file-document-outline" />
                View Appeal Document {index + 1}
              </Button>
            {/each}
          </div>
        </div>

        <!-- Reason Text Box -->
        <div class="border rounded-lg p-4 space-y-2">
          <label for="reason" class="block font-semibold text-sm text-gray-700">
            Reason for Decision <span class="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            bind:value={appealReason}
            placeholder="Provide a detailed reason for approving or denying this appeal. This will be recorded in the system."
            rows="5"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={submittingAppeal}
          />
          {#if appealReasonError}
            <p class="text-red-500 text-xs mt-1 flex items-center gap-1">
              <Icon icon="mdi:alert-circle" width="14" height="14" />
              {appealReasonError}
            </p>
          {/if}
        </div>
        {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.TrademarkAcceptance, UserRoles.AppealExaminer, UserRoles.Tech, UserRoles.SuperAdmin].some( (r) => $loggedInUser.userRoles.includes(r), )}
          <!-- Action Buttons -->
          <div class="flex gap-3 justify-end pt-2 border-t">
            <Button
              on:click={() => {
                showAppealRequest = false;
                appealReason = "";
                appealReasonError = "";
              }}
              variant="outline"
              disabled={submittingAppeal}
            >
              Cancel
            </Button>
            <Button
              on:click={() => {
                if (selectedApplication) handleDenyAppeal(selectedApplication);
              }}
              variant="destructive"
              disabled={submittingAppeal || !appealReason?.trim()}
              class="flex items-center gap-2"
            >
              {#if submittingAppeal && !isApproving}
                <Icon icon="line-md:loading-loop" class="animate-spin" />
                Denying...
              {:else}
                <Icon icon="mdi:close-circle-outline" />
                Deny Appeal
              {/if}
            </Button>
            <Button
              on:click={() => {
                if (selectedApplication)
                  handleApproveAppeal(selectedApplication);
              }}
              disabled={submittingAppeal || !appealReason?.trim()}
              class="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {#if submittingAppeal && isApproving}
                <Icon icon="line-md:loading-loop" class="animate-spin" />
                Approving...
              {:else}
                <Icon icon="mdi:check-circle-outline" />
                Approve Appeal
              {/if}
            </Button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8">
        <Icon
          icon="mdi:file-alert-outline"
          class="text-gray-400 mx-auto"
          width="3rem"
          height="3rem"
        />
        <p class="text-gray-500 mt-2">No appeal data available</p>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<!-- Publication Dialog -->
<Dialog.Root bind:open={showPublicationDialog}>
  <Dialog.Content
    class="w-11/12 max-w-4xl mx-auto my-8 max-h-[90vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col"
  >
    <Dialog.Header class="flex-shrink-0">
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <Icon
          icon="mdi:certificate-outline"
          width="1.5em"
          height="1.5em"
          class="text-green-600"
        />
        Publication Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process publication application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if publicationLoading}
        <div class="flex items-center gap-2 text-green-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading publication details...</span>
        </div>
      {:else if publicationError}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {publicationError}
        </div>
      {:else if publicationDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon icon="mdi:file-document-outline" class="text-green-600" />
              File Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="font-semibold">File Number:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {publicationDetails.fileId ?? "N/A"}
                </p>
              </div>
              <div>
                <Label class="font-semibold">Publication Date:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {publicationDetails.publicationDate
                    ? new Date(
                        publicationDetails.publicationDate,
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <!-- Attachments -->
          <div class="mb-6">
            <Label
              for="publication-attachments"
              class="font-semibold mb-3 block flex items-center gap-2"
            >
              <Icon icon="mdi:attachment" class="text-green-600" />
              Publication Attachments:
            </Label>
            {#if publicationDetails.attachments && publicationDetails.attachments.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each publicationDetails.attachments as attachment, index}
                  <div
                    class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name ||
                            `Publication Document ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {publicationDetails
                            .attachments.length}
                        </div>
                      </div>
                      <div class="flex-shrink-0">
                        {#if Array.isArray(attachment.url)}
                          {#each attachment.url as url, urlIndex}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener"
                              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                              <Icon
                                icon="mdi:file-eye"
                                width="1.2em"
                                height="1.2em"
                              />
                              <span
                                >View {attachment.url.length > 1
                                  ? urlIndex + 1
                                  : ""}</span
                              >
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon
                              icon="mdi:file-eye"
                              width="1.2em"
                              height="1.2em"
                            />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div
                class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed"
              >
                <Icon
                  icon="mdi:file-outline"
                  width="2em"
                  height="2em"
                  class="mx-auto mb-2 opacity-50"
                />
                <p>No attachments submitted</p>
              </div>
            {/if}
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label
              for="publication-comment"
              class="block font-medium mb-1 flex items-center gap-2"
            >
              <Icon icon="mdi:comment-text-outline" class="text-green-600" />
              Decision Comment: <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="publication-comment"
              bind:value={publicationComment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
              placeholder="Enter your review comment and decision reason..."
              required
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handlePublicationDecision(true)}
              disabled={publicationSubmitting || !publicationComment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handlePublicationDecision(false)}
              disabled={publicationSubmitting || !publicationComment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer
      class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4 border-t bg-gray-50"
    >
      <Button
        on:click={() => (showPublicationDialog = false)}
        variant="outline"
      >
        <Icon
          icon="mdi:close"
          width="1.2em"
          height="1.2em"
          class="inline mr-1"
        />
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Withdrawal Dialog -->
<Dialog.Root bind:open={showWithdrawalDialog}>
  <Dialog.Content
    class="w-11/12 max-w-4xl mx-auto my-8 max-h-[90vh] rounded-xl shadow-lg bg-white border border-gray-200 flex flex-col"
  >
    <Dialog.Header class="flex-shrink-0">
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <Icon
          icon="mdi:file-remove-outline"
          width="1.5em"
          height="1.5em"
          class="text-green-600"
        />
        Withdrawal Request Details
      </Dialog.Title>
      <Dialog.Description>
        Review and process withdrawal application details.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto p-4">
      {#if withdrawalLoading}
        <div class="flex items-center gap-2 text-green-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading withdrawal details...</span>
        </div>
      {:else if withdrawalError}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {withdrawalError}
        </div>
      {:else if withdrawalDetails}
        <div class="space-y-6">
          <!-- File Information -->
          <div class="bg-gray-100 rounded-lg p-4">
            <h3 class="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon icon="mdi:file-document-outline" class="text-green-600" />
              File Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label class="font-semibold">File Number:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {withdrawalDetails.fileId}
                </p>
              </div>
              <div>
                <Label class="font-semibold">Withdrawal Request Date:</Label>
                <p class="mt-1 p-2 bg-white rounded border">
                  {withdrawalDetails.withdrawalRequestDate
                    ? new Date(
                        withdrawalDetails.withdrawalRequestDate,
                      ).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <!-- Withdrawal Letter Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-document" class="text-green-600" />
              Withdrawal Letter Attachments:
            </Label>
            {#if withdrawalDetails.withdrawalLetterAttachments && withdrawalDetails.withdrawalLetterAttachments.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each withdrawalDetails.withdrawalLetterAttachments as attachment, index}
                  <div
                    class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name || `Withdrawal Letter ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {withdrawalDetails
                            .withdrawalLetterAttachments.length}
                        </div>
                      </div>
                      <div class="flex-shrink-0">
                        {#if Array.isArray(attachment.url)}
                          {#each attachment.url as url, urlIndex}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener"
                              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                              <Icon
                                icon="mdi:file-eye"
                                width="1.2em"
                                height="1.2em"
                              />
                              <span
                                >View {attachment.url.length > 1
                                  ? urlIndex + 1
                                  : ""}</span
                              >
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon
                              icon="mdi:file-eye"
                              width="1.2em"
                              height="1.2em"
                            />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div
                class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed"
              >
                <Icon
                  icon="mdi:file-outline"
                  width="2em"
                  height="2em"
                  class="mx-auto mb-2 opacity-50"
                />
                <p>No withdrawal letter attachments</p>
              </div>
            {/if}
          </div>

          <!-- Supporting Document Attachments -->
          <div class="mb-6">
            <Label class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:file-multiple" class="text-green-600" />
              Supporting Document Attachments:
            </Label>
            {#if withdrawalDetails.supportingDocumentAttachments && withdrawalDetails.supportingDocumentAttachments.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each withdrawalDetails.supportingDocumentAttachments as attachment, index}
                  <div
                    class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name ||
                            `Supporting Document ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {withdrawalDetails
                            .supportingDocumentAttachments.length}
                        </div>
                      </div>
                      <div class="flex-shrink-0">
                        {#if Array.isArray(attachment.url)}
                          {#each attachment.url as url, urlIndex}
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener"
                              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                              <Icon
                                icon="mdi:file-eye"
                                width="1.2em"
                                height="1.2em"
                              />
                              <span
                                >View {attachment.url.length > 1
                                  ? urlIndex + 1
                                  : ""}</span
                              >
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon
                              icon="mdi:file-eye"
                              width="1.2em"
                              height="1.2em"
                            />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div
                class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed"
              >
                <Icon
                  icon="mdi:file-outline"
                  width="2em"
                  height="2em"
                  class="mx-auto mb-2 opacity-50"
                />
                <p>No supporting documents</p>
              </div>
            {/if}
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="withdrawal-comment" class="block font-medium mb-1"
              >Comment:</Label
            >
            <Textarea
              id="withdrawal-comment"
              bind:value={withdrawalComment}
              rows={3}
              class="w-full border rounded p-2 focus:ring-2 focus:ring-green-200"
              placeholder="Type your comment here..."
              required
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 mt-4 justify-end">
            <Button
              class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleWithdrawalDecision(true)}
              disabled={withdrawalSubmitting || !withdrawalComment.trim()}
            >
              <Icon
                icon="mdi:check-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Approve
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handleWithdrawalDecision(false)}
              disabled={withdrawalSubmitting || !withdrawalComment.trim()}
            >
              <Icon
                icon="mdi:close-circle-outline"
                width="1.2em"
                height="1.2em"
                class="inline mr-1"
              />
              Reject
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4">
      <Button on:click={() => (showWithdrawalDialog = false)} variant="outline">
        <Icon
          icon="mdi:close"
          width="1.2em"
          height="1.2em"
          class="inline mr-1"
        />
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Patent Assignment Dialog -->
<PatentAssignmentDialog
  bind:open={showPatentAssignmentDialog}
  fileId={patentAssignmentFileId}
  applicationId={patentAssignmentApplicationId}
  status={patentAssignmentStatus}
/>

<!-- Design Assignment Dialog -->
<DesignAssignmentDialog
  bind:open={showDesignAssignmentDialog}
  fileId={designAssignmentFileId}
  applicationId={designAssignmentApplicationId}
  status={designAssignmentStatus}
/>

<!-- Patent License Dialog -->
<PatentLicenseDialog
  bind:open={showPatentLicenseDialog}
  fileId={patentLicenseFileId}
  applicationId={patentLicenseApplicationId}
  status={patentLicenseStatus}
/>

<!-- Design License Dialog -->
<DesignLicenseDialog
  bind:open={showDesignLicenseDialog}
  fileId={designLicenseFileId}
  applicationId={designLicenseApplicationId}
  status={designLicenseStatus}
/>

<!-- Patent Merger Dialog -->
<PatentMergerDialog
  bind:open={showPatentMergerDialog}
  fileId={patentMergerFileId}
  applicationId={patentMergerApplicationId}
  status={patentMergerStatus}
/>

<!-- Design Merger Dialog -->
<DesignMergerDialog
  bind:open={showDesignMergerDialog}
  fileId={designMergerFileId}
  applicationId={designMergerApplicationId}
  status={designMergerStatus}
/>

<!-- Ownership History Dialog -->
<OwnershipHistoryDialog
  bind:open={showOwnershipHistoryDialog}
  entries={allApplications}
  closed={() => (showOwnershipHistoryDialog = false)}
/>

<!-- Offline Renewal Dialog -->
<OfflineRenewalDialog
  bind:open={showOfflineRenewalDialog}
  applicationId={offlineRenewalApplicationId}
  status={offlineRenewalStatus}
/>

<!-- Patent Mortgage Dialog -->
<PatentMortgageDialog
  bind:open={showPatentMortgageDialog}
  fileId={patentMortgageFileId}
  applicationId={patentMortgageApplicationId}
  status={patentMortgageStatus}
/>

<!-- Design Mortgage Dialog -->
<DesignMortgageDialog
  bind:open={showDesignMortgageDialog}
  fileId={designMortgageFileId}
  applicationId={designMortgageApplicationId}
  status={designMortgageStatus}
/>

<!-- Patent CTC Dialog -->
<PatentCTCDialog
  bind:open={showPatentCTCDialog}
  fileId={patentCTCFileId}
  applicationId={patentCTCApplicationId}
  status={patentCTCStatus}
/>

<!-- Design CTC Dialog -->
<DesignCTCDialog
  bind:open={showDesignCTCDialog}
  fileId={designCTCFileId}
  applicationId={designCTCApplicationId}
  status={designCTCStatus}
/>

<!-- Trademark CTC Dialog -->
<TrademarkCTCDialog
  bind:open={showTrademarkCTCDialog}
  fileId={trademarkCTCFileId}
  applicationId={trademarkCTCApplicationId}
  status={trademarkCTCStatus}
/>

<!-- Patent Amendment Dialog -->
<PatentAmendmentDialog
  bind:open={showPatentAmendmentDialog}
  fileId={patentAmendmentFileId}
  applicationId={patentAmendmentApplicationId}
  status={patentAmendmentStatus}
/>

<!-- Design Amendment Dialog -->
<DesignAmendmentDialog
  bind:open={showDesignAmendmentDialog}
  fileId={designAmendmentFileId}
  applicationId={designAmendmentApplicationId}
  status={designAmendmentStatus}
/>

{#if showStatusHistory}
  <svelte:component this={historyComponent} {...historyData} />
{/if}
<Sheet.Root
  bind:open={showUpdateStatusForm}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      newStatus = null;
      newStatusReason = null;
      newStatusAttachment = null;
    }
  }}
>
  <Sheet.Content
    side="right"
    class="overflow-y-auto w-full sm:max-w-[560px] p-0 bg-white"
  >
    <!-- Header -->
    <div class="px-6 pt-6 pb-5 border-b border-slate-100">
      <div class="flex items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900"
        >
          <Icon
            icon="mdi:swap-horizontal-bold"
            width="1.25em"
            class="text-white"
          />
        </div>
        <div class="flex-1 min-w-0">
          <Sheet.Title
            class="text-lg font-semibold text-slate-900 tracking-tight"
          >
            Recall Application Status
          </Sheet.Title>
          <Sheet.Description class="text-xs text-slate-500 mt-1">
            {mapTypeToString(selectedApplication?.applicationType ?? 0)} • Current:
            <span class="font-medium text-slate-700">
              {selectedApplication?.currentStatus != null
                ? ApplicationStatuses[selectedApplication.currentStatus]
                : "—"}
            </span>
          </Sheet.Description>
        </div>
      </div>

      <!-- Stepper -->
      <div class="flex items-center gap-2 mt-5">
        {#each [0, 1, 2] as step}
          {@const current = newStatusContent ?? 0}
          <div
            class="h-1.5 flex-1 rounded-full transition-colors {step <= current
              ? 'bg-slate-900'
              : 'bg-slate-200'}"
          />
        {/each}
      </div>
      <div
        class="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 mt-2 font-medium"
      >
        <span class={(newStatusContent ?? 0) >= 0 ? "text-slate-900" : ""}
          >Select</span
        >
        <span class={(newStatusContent ?? 0) >= 1 ? "text-slate-900" : ""}
          >Confirm</span
        >
        <span class={(newStatusContent ?? 0) >= 2 ? "text-slate-900" : ""}
          >Done</span
        >
      </div>
    </div>

    <!-- Body -->
    <div class="px-6 py-5">
      {#if newStatusContent === null || newStatusContent === 0}
        <div class="space-y-5">
          <div>
            <Label
              class="text-xs font-semibold text-slate-700 uppercase tracking-wide"
            >
              New Status
            </Label>
            <div class="grid grid-cols-2 gap-2 mt-2">
              {#each getAvailableStatuses(selectedApplication) as status}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                  on:click={() => (newStatus = status)}
                  class="cursor-pointer select-none rounded-lg border px-3 py-2 text-xs font-medium transition-all
                    {newStatus === status
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'}"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="truncate">
                      {status.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    {#if newStatus === status}
                      <Icon icon="mdi:check" width="0.9em" class="shrink-0" />
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div>
            <Label
              for="status-reason"
              class="text-xs font-semibold text-slate-700 uppercase tracking-wide"
            >
              Reason for Change
            </Label>
            <Textarea
              id="status-reason"
              class="mt-2 min-h-32 rounded-lg border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-sm resize-none"
              placeholder="Provide a reason for this status change..."
              bind:value={newStatusReason}
            />
          </div>

          <div>
            <Label
              for="status-attachment"
              class="text-xs font-semibold text-slate-700 uppercase tracking-wide"
            >
              Supporting Attachment
            </Label>
            <label
              for="status-attachment"
              class="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-3 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0"
                >
                  <Icon
                    icon={newStatusAttachment
                      ? "mdi:file-check-outline"
                      : "mdi:cloud-upload-outline"}
                    width="1.15em"
                    class={newStatusAttachment
                      ? "text-emerald-600"
                      : "text-slate-500"}
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {newStatusAttachment
                      ? newStatusAttachment.name
                      : "Choose a file to upload"}
                  </p>
                  <p class="text-xs text-slate-500">
                    {newStatusAttachment
                      ? `${(newStatusAttachment.size / 1024).toFixed(1)} KB`
                      : "PDF, image, or document"}
                  </p>
                </div>
              </div>
              {#if newStatusAttachment}
                <button
                  type="button"
                  class="text-xs text-slate-500 hover:text-red-600 shrink-0"
                  on:click|preventDefault|stopPropagation={() =>
                    (newStatusAttachment = null)}
                >
                  Remove
                </button>
              {:else}
                <span class="text-xs font-medium text-slate-700 shrink-0">
                  Browse
                </span>
              {/if}
            </label>
            <input
              id="status-attachment"
              type="file"
              class="sr-only"
              on:change={handleStatusAttachmentChange}
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            class="h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
            on:click={() => {
              showUpdateStatusForm = false;
              newStatusReason = null;
              newStatus = null;
              newStatusAttachment = null;
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!newStatus ||
              !newStatusReason?.trim() ||
              !newStatusAttachment}
            on:click={() => (newStatusContent = 1)}
          >
            Continue
            <Icon icon="mdi:arrow-right" class="ml-1.5" width="0.95em" />
          </Button>
        </div>
      {:else if newStatusContent === 1}
        <div class="space-y-5">
          <div
            class="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"
          >
            <Icon
              icon="mdi:alert-circle-outline"
              width="1.25em"
              class="text-amber-600 shrink-0 mt-0.5"
            />
            <p class="text-xs text-amber-800 leading-relaxed">
              Please confirm this status change. This action will be recorded in
              the application history.
            </p>
          </div>

          <dl
            class="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden"
          >
            <div class="flex items-center justify-between px-4 py-3">
              <dt class="text-xs font-medium text-slate-500">Current Status</dt>
              <dd class="text-sm font-medium text-slate-900">
                {selectedApplication?.currentStatus != null
                  ? ApplicationStatuses[selectedApplication.currentStatus]
                  : "—"}
              </dd>
            </div>
            <div
              class="flex items-center justify-between px-4 py-3 bg-slate-50/50"
            >
              <dt class="text-xs font-medium text-slate-500">New Status</dt>
              <dd class="flex items-center gap-2">
                <Icon
                  icon="mdi:arrow-right"
                  width="0.9em"
                  class="text-slate-400"
                />
                <span class="text-sm font-semibold text-slate-900"
                  >{newStatus}</span
                >
              </dd>
            </div>
            {#if newStatusReason}
              <div class="px-4 py-3">
                <dt class="text-xs font-medium text-slate-500 mb-1">Reason</dt>
                <dd
                  class="text-sm text-slate-700 whitespace-pre-wrap break-words"
                >
                  {newStatusReason}
                </dd>
              </div>
            {/if}
          </dl>

          <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              disabled={isNewStatusLoading}
              variant="outline"
              class="h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
              on:click={() => (newStatusContent = null)}
            >
              <Icon icon="mdi:arrow-left" class="mr-1.5" width="0.95em" />
              Back
            </Button>
            <Button
              disabled={isNewStatusLoading}
              class="h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              on:click={() => confirmChange()}
            >
              {#if isNewStatusLoading}
                <Icon
                  icon="line-md:loading-loop"
                  class="mr-1.5 animate-spin"
                  width="1em"
                />
                Updating...
              {:else}
                <Icon icon="mdi:check" class="mr-1.5" width="0.95em" />
                Confirm Change
              {/if}
            </Button>
          </div>
        </div>
      {:else if newStatusContent === 2}
        <div class="flex flex-col items-center text-center py-8 gap-4">
          <div
            class="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-100/60"
          >
            <Icon
              icon="clarity:success-standard-line"
              width="1.75rem"
              class="text-emerald-600"
            />
          </div>
          <div class="space-y-1">
            <p class="text-base font-semibold text-slate-900">Status Updated</p>
            <p class="text-xs text-slate-500">
              The application status has been changed successfully.
            </p>
          </div>
          <Button
            class="w-full mt-2 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
            on:click={() => {
              showUpdateStatusForm = false;
              isNewStatusLoading = false;
              newStatusContent = null;
              newStatus = null;
              newStatusReason = null;
              newStatusAttachment = null;
            }}
          >
            Done
          </Button>
        </div>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
<div class="px-2 py-2 overflow-x-auto overflow-y-auto">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-1">s/n</Table.Head>
        <Table.Head class="w-32">Date</Table.Head>
        <Table.Head class="w-32">Type</Table.Head>
        <Table.Head class="w-32">Payment ID</Table.Head>
        <Table.Head class="w-32">Application Status</Table.Head>
        <Table.Head class="w-32">History</Table.Head>
        <Table.Head class="w-32">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each allApplications as application, i (i)}
        <Table.Row>
          <!-- for S/N -->
          <Table.Cell class="w-1">{i + 1}</Table.Cell>
          <!-- for Date -->
          <Table.Cell class="w-32"
            >{mapDateToStringNoDate(application.applicationDate)}</Table.Cell
          >
          <!-- for Type -->
          <Table.Cell>
            <p class="rounded-md bg-gray-400 text-black p-1 w-fit">
              {#if application.applicationType === FormApplicationTypes.NewOpposition && (application.currentStatus === 30 || application.currentStatus === 29 || application.currentStatus === 31)}
                Counter Statement
              {:else if application.applicationType === FormApplicationTypes.NewOpposition && application.currentStatus === 33}
                Statutory Declaration
              {:else if application.applicationType === FormApplicationTypes.CounterStatement || application.applicationType === FormApplicationTypes.StatutoryDeclaration}
                {mapTypeToString(application.applicationType ?? 0)}
              {:else}
                {mapTypeToString(application.applicationType ?? 0)}
              {/if}
            </p>
          </Table.Cell>
          <!-- for Payment ID -->
          <Table.Cell>{application.paymentId ?? "No Payment Id"}</Table.Cell>
          <!-- for Application Status -->
          <Table.Cell>
            {#if application.applicationType === FormApplicationTypes.NewOpposition && (application.currentStatus === 30 || application.currentStatus === 29 || application.currentStatus === 31)}
              <span
                class="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                >Awaiting Counter Statement</span
              >
            {:else if application.applicationType === FormApplicationTypes.NewOpposition && application.currentStatus === 33}
              <span
                class="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
                >Awaiting Statutory Declaration</span
              >
            {:else if application.applicationType === FormApplicationTypes.CounterStatement || application.applicationType === FormApplicationTypes.StatutoryDeclaration}
              <span
                class="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                >Submitted</span
              >
            {:else}
              <AppStatusTag value={application.currentStatus ?? undefined} />
            {/if}
          </Table.Cell>
          <!-- for Payment Status -->
          <Table.Cell>
            <Button on:click={async () => await ViewHistory(application)}
              >History</Button
            >
          </Table.Cell>
          <!-- for Actions -->
          <Table.Cell>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger on:click>More</DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Group>
                  <!-- Ownership Change Application -->
                  {#if application.applicationType === FormApplicationTypes.Ownership}
                    <DropdownMenu.Item
                      on:click={() => openOwnershipHistoryDialog()}
                      >View Application</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Change Status (Admin only) -->
                  {#if application.applicationType === FormApplicationTypes.NewApplication}
                    {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.SuperAdmin, UserRoles.Tech, UserRoles.TrademarkRegistrar, UserRoles.ActingTrademarkRegistrar, UserRoles.PatentDesignRegistrar].some( (r) => $loggedInUser.userRoles.includes(r), )}
                      <DropdownMenu.Item
                        on:click={() => changeStatus(application)}
                        >Recall Application</DropdownMenu.Item
                      >
                      <DropdownMenu.Separator />
                    {/if}
                  {/if}
                  <!-- Data Update Application -->
                  {#if application.applicationType === 2}
                    <DropdownMenu.Item
                      on:click={async () =>
                        await viewDataUpdateApplication(application)}
                      >View application</DropdownMenu.Item
                    >
                  {/if}
                  <!-- verify payments -->
                  {#if application.paymentId !== null && application.paymentId !== "Free"}
                    <DropdownMenu.Item
                      on:click={async () =>
                        await checkPayment(application, application.paymentId)}
                      >Verify Payment ({application.paymentId ??
                        "-"})</DropdownMenu.Item
                    >
                  {/if}
                  <!-- View Recordal Data (Trademarks Only) -->
                  {#if fileData.type === FileTypes.Trademark && ((Array.isArray($loggedInUser?.userRoles) && ($loggedInUser.userRoles.includes(UserRoles.Tech) || $loggedInUser.userRoles.includes(UserRoles.TrademarkCertification)) && application.applicationType === 5) || [8, 7, 9, 10].includes(application.applicationType ?? -1))}
                    <DropdownMenu.Item
                      on:click={() => {
                        viewRecordalData(application);
                      }}>View Application</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Design Assignment Application -->
                  {#if application.applicationType === FormApplicationTypes.Assignment && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignAssignmentDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent Assignment Application -->
                  {#if application.applicationType === FormApplicationTypes.Assignment && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPatentAssignmentDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent License Application -->
                  {#if application.applicationType === FormApplicationTypes.License && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPatentLicenseDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Design License Application -->
                  {#if application.applicationType === FormApplicationTypes.License && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignLicenseDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Design Merger Application -->
                  {#if application.applicationType === FormApplicationTypes.Merger && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignMergerDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent Merger Application -->
                  {#if application.applicationType === FormApplicationTypes.Merger && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPatentMergerDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Design Mortgage Application -->
                  {#if application.applicationType === FormApplicationTypes.Mortgage && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignMortgageDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent Mortgage Application -->
                  {#if application.applicationType === FormApplicationTypes.Mortgage && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPatentMortgageDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Design CTC Application -->
                  {#if application.applicationType === FormApplicationTypes.CertifiedTrueCopy && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignCTCDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Trademark CTC Application -->
                  {#if application.applicationType === FormApplicationTypes.CertifiedTrueCopy && fileData.type === FileTypes.Trademark && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.TrademarkCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openTrademarkCTCDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent CTC Application -->
                  {#if application.applicationType === FormApplicationTypes.CertifiedTrueCopy && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPatentCTCDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Patent Amendment Application -->
                  <!-- {#if application.applicationType === FormApplicationTypes.Amendment && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() => openPatentAmendmentDialog(fileData.fileId, application.id, application.currentStatus ?? 0)}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if} -->
                  <!-- Verify new app payment -->
                  {#if application.applicationType === FormApplicationTypes.NewApplication && application.certificatePaymentId != null}
                    <DropdownMenu.Item
                      on:click={async () =>
                        await checkPayment(
                          application,
                          application.certificatePaymentId ?? null,
                        )}
                      >Verify Certificate payment ({application.certificatePaymentId})</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Appeal Request -->
                  {#if application.applicationType === FormApplicationTypes.AppealRequest}
                    <DropdownMenu.Item
                      on:click={() => {
                        viewAppeal(application);
                      }}>View Application</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Publication status update -->
                  {#if ($loggedInUser?.userRoles?.includes(UserRoles.TrademarkCertification) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)) && application.applicationType === 14 && application.currentStatus === ApplicationStatuses.AwaitingStatusUpdate}
                    <DropdownMenu.Item
                      on:click={() =>
                        openPublicationDialog(fileData?.fileId, application.id)}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Withdrawal App -->
                  {#if application.applicationType === FormApplicationTypes.WithdrawalRequest && application.currentStatus === ApplicationStatuses.RequestWithdrawal}
                    <!-- {@html `<pre>fileData.type: ${fileData.type}, roles: ${JSON.stringify($loggedInUser?.userRoles)}</pre>`} -->
                    {#if fileData.type === 0 && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {:else if fileData.type === 1 && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {:else if fileData.type === 2 && ($loggedInUser?.userRoles?.includes(UserRoles.TrademarkAcceptance) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {/if}
                  {/if}
                  <!-- Design Amendment Application -->
                  {#if application.applicationType === FormApplicationTypes.Amendment && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() =>
                        openDesignAmendmentDialog(
                          fileData.fileId,
                          application.id,
                          application.currentStatus ?? 0,
                        )}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Offline Renewal — Patent & Design -->
                  {#if application.applicationType === FormApplicationTypes.OfflineRenewalRequest && application.currentStatus != null && [ApplicationStatuses.AwaitingRenewalConfirmation, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && (fileData.type === FileTypes.Patent || fileData.type === FileTypes.Design) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentCertification) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() => openOfflineRenewalDialog(application.id, application.currentStatus ?? 0)}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Offline Renewal — Trademark -->
                  {#if application.applicationType === FormApplicationTypes.OfflineRenewalRequest && application.currentStatus != null && [ApplicationStatuses.AwaitingRenewalConfirmation, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && fileData.type === FileTypes.Trademark && ($loggedInUser?.userRoles?.includes(UserRoles.TrademarkCertification) || $loggedInUser?.userRoles?.includes(UserRoles.TrademarkRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
                    <DropdownMenu.Item
                      on:click={() => openOfflineRenewalDialog(application.id, application.currentStatus ?? 0)}
                    >
                      View Application
                    </DropdownMenu.Item>
                  {/if}
                  <!-- Clerical Update / Amendment (Trademark & Patent) -->
                  {#if ((application.applicationType == FormApplicationTypes.ClericalUpdate || application.applicationType == FormApplicationTypes.Amendment || application.applicationType == FormApplicationTypes.Reclassification) && fileData.type === FileTypes.Trademark && application.currentStatus !== ApplicationStatuses.AwaitingPayment) || (application.applicationType === FormApplicationTypes.Amendment && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus))}
                    {#if (fileData.type === FileTypes.Trademark && $loggedInUser?.userRoles && [UserRoles.Staff, UserRoles.Tech, UserRoles.SuperAdmin].some( (r) => $loggedInUser.userRoles.includes(r), )) || (fileData.type === FileTypes.Patent && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin)))}
                      <DropdownMenu.Item
                        on:click={() => {
                          if (fileData.type === FileTypes.Patent) {
                            openPatentAmendmentDialog(
                              fileData.fileId,
                              application.id,
                              application.currentStatus ?? 0,
                            );
                          } else {
                            viewRecordalData(application);
                          }
                        }}>View Application</DropdownMenu.Item
                      >
                    {/if}
                  {/if}

                  <!-- View Opposition -->
                  {#if fileData.fileStatus === ApplicationStatuses.NewOpposition}
                    <DropdownMenu.Item
                      on:click={async () => {
                        oppositionDetailLoading = true;
                        try {
                          const res = await fetch(
                            `${baseURL}/api/opposition/loadSummary?quantity=1&skip=0&fileId=${fileData.fileId}`,
                          );
                          if (res.ok) {
                            const json = await res.json();
                            const oppList = json.data || [];
                            if (oppList.length > 0) {
                              viewOppositionDetail(fileData.fileId);
                            } else {
                              showToast(
                                "error",
                                "No opposition found for this file",
                              );
                            }
                          } else {
                            showToast("error", "Failed to load opposition");
                          }
                        } catch (e) {
                          showToast("error", "Error loading opposition");
                        } finally {
                          oppositionDetailLoading = false;
                        }
                      }}
                    >
                      View Opposition
                    </DropdownMenu.Item>
                  {/if}

                  <!-- LETTERS -->
                  {#if application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Label>Print</DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    {#if application.applicationType === FormApplicationTypes.NewApplication && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 0, 1);
                        }}>Acknowledgement Letter</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 0, 37);
                        }}>Receipt</DropdownMenu.Item
                      >
                      <!-- {#if application.currentStatus === ApplicationStatuses.Active}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 0, 3);
                        }}>Certificate of Registration</DropdownMenu.Item
                      >
                    {/if} -->
                    {/if}
                    <!-- Appeal Docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.AppealRequest && application.currentStatus === ApplicationStatuses.Approved}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 13, 2);
                        }}>Acceptance Letter</DropdownMenu.Item
                      >
                    {/if}
                    <!-- Merger Docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.Merger && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 8, 26);
                        }}>Merger Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 8, 25);
                        }}>Merger Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Approved}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 8, 27);
                          }}>Certificate of Merger</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Assignment docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.Assignment && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 5, 12);
                        }}>Assignment Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 5, 11);
                        }}>Assignment Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Approved}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 5, 13);
                          }}>Certificate of Assignment</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Registered user docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.RegisteredUser && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 7, 29);
                        }}>Registered User Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 7, 28);
                        }}>Registered User Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Approved}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 7, 30);
                          }}>Certificate of Registered User</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Change of Name docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.ChangeOfName && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 9, 32);
                        }}>Change of Name Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 9, 34);
                        }}>Change of Name Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Approved}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 9, 48);
                          }}>Certificate of Change of Name</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Change of Address docs -->
                    {#if fileData.type === FileTypes.Trademark && application.applicationType === FormApplicationTypes.ChangeOfAddress && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 10, 31);
                        }}>Change of Address Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 10, 33);
                        }}>Change of Address Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Approved}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 10, 49);
                          }}>Certificate of Change of Address</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Clerical Update Docs -->
                    {#if application.applicationType === FormApplicationTypes.ClericalUpdate && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 11, 36);
                        }}>Clerical Update Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 11, 35);
                        }}>Clerical Update Receipt</DropdownMenu.Item
                      >
                    {/if}
                    <!-- Certification Docs -->
                    {#if application.applicationType === FormApplicationTypes.Certification && application.currentStatus !== ApplicationStatuses.AwaitingCertification}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 18, 21);
                        }}>Certificate Acknowledgement</DropdownMenu.Item
                      >
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 18, 22);
                        }}>Certificate Payment Receipt</DropdownMenu.Item
                      >
                      {#if application.currentStatus === ApplicationStatuses.Active}
                        <DropdownMenu.Item
                          on:click={() => {
                            generateLetter(application, 18, 3);
                          }}>Certificate</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                    <!-- Certificate -->
                    {#if (application.certificatePaymentId != null || fileData.type === FileTypes.Patent) && application.currentStatus === ApplicationStatuses.Active}
                      {#if $loggedInUser?.userRoles && [UserRoles.TrademarkCertification, UserRoles.Tech, UserRoles.SuperAdmin].some( (r) => $loggedInUser.userRoles.includes(r), )}
                        <DropdownMenu.Item
                          on:click={() => certificate(application)}
                        >
                          Certificate
                        </DropdownMenu.Item>
                      {/if}

                      <!-- Renewal docs -->
                    {:else if application.applicationType == FormApplicationTypes.LicenseRenewal && (application.currentStatus === ApplicationStatuses.Approved || application.currentStatus === ApplicationStatuses.AutoApproved)}
                      {#if $loggedInUser?.userRoles && [UserRoles.TrademarkCertification, UserRoles.Tech, UserRoles.SuperAdmin].some( (r) => $loggedInUser.userRoles.includes(r), )}
                        <DropdownMenu.Item
                          on:click={() => renewalCertificate(application)}
                        >
                          Renewal Certificate</DropdownMenu.Item
                        >
                      {/if}
                    {/if}
                  {/if}<!-- end LETTERS guard -->
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

<!-- Opposition Detail Sheet -->
<Sheet.Root bind:open={showOppositionDetail}>
  <Sheet.Content side="right" class="w-full sm:max-w-2xl overflow-y-auto">
    {#if oppositionDetailLoading}
      <div class="flex justify-center items-center h-full">
        <Icon icon="line-md:loading-loop" class="w-8 h-8 text-green-600" />
      </div>
    {:else if selectedOpposition}
      <Sheet.Header>
        <Sheet.Title class="text-2xl font-bold text-slate-900"
          >Opposition Details</Sheet.Title
        >
        <Sheet.Description class="text-slate-600 mt-2">
          File: <span class="font-semibold"
            >{selectedOpposition.fileNumber}</span
          >
        </Sheet.Description>
      </Sheet.Header>

      <!-- Opposition Tabs (when multiple oppositions exist on the same file) -->
      {#if fileOppositions.length > 1}
        <div class="mt-4 border-b border-slate-200">
          <div class="flex gap-1 overflow-x-auto pb-0">
            {#each fileOppositions as opp, idx}
              <button
                on:click={() => switchOpposition(idx)}
                class="px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors
									{activeOppositionIndex === idx
                  ? 'bg-green-50 text-green-700 border border-b-0 border-green-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}"
              >
                Opposition {idx + 1}
                <span class="ml-1 text-xs text-slate-400"
                  >({opp.name?.split(" ")[0] ?? "Unknown"})</span
                >
              </button>
            {/each}
          </div>
          <p class="text-xs text-slate-500 mt-2 mb-1">
            Showing {activeOppositionIndex + 1} of {fileOppositions.length} oppositions
            on this file
          </p>
        </div>
      {/if}

      <div class="space-y-6 mt-6">
        <!-- Status Section -->
        <div
          class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
        >
          <div class="space-y-3">
            <div>
              <p class="text-sm font-semibold text-slate-600">Opposition ID</p>
              <p
                class="text-sm font-mono text-slate-800 mt-1"
                title={selectedOpposition.id}
              >
                OPP-{selectedOpposition.id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div class="border-t border-green-200 pt-3">
              <p class="text-sm font-semibold text-slate-600">File Status</p>
              <div class="mt-1">
                <AppStatusTag value={selectedOpposition.fileStatus} />
              </div>
            </div>
            <div class="border-t border-green-200 pt-3">
              <p class="text-sm font-semibold text-slate-600">
                Opposition Application Status
              </p>
              <div class="mt-1">
                {#if (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 36}
                  <AppStatusTag value={36} />
                {:else if selectedOpposition.hasCounterStatement || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 33}
                  <span
                    class="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
                    >Awaiting Statutory Declaration</span
                  >
                {:else if (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 30 || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 29 || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 31}
                  <span
                    class="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                    >Awaiting Counter Statement</span
                  >
                {:else}
                  <AppStatusTag
                    value={selectedOpposition.status ??
                      selectedOpposition.oppositionStatus}
                  />
                {/if}
              </div>
            </div>
          </div>
          {#if selectedOpposition.hasCounterStatement || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 33}
            <div
              class="mt-3 pt-3 border-t border-green-200 flex items-center gap-2 text-orange-600"
            >
              <Icon icon="mdi:alert-circle" class="w-5 h-5" />
              <span class="text-sm font-medium">Counter Statement Filed</span>
              {#if selectedOpposition.counterStatementDate}
                <span class="text-xs text-slate-600"
                  >on {mapDateToString(
                    selectedOpposition.counterStatementDate,
                  )}</span
                >
              {/if}
            </div>
          {:else}
            <div
              class="mt-3 pt-3 border-t border-red-200 flex items-center gap-2 text-red-600"
            >
              <Icon icon="mdi:close-circle" class="w-5 h-5" />
              <span class="text-sm font-medium">No Counter Statement Yet</span>
            </div>
          {/if}
        </div>

        <!-- Opposition Details -->
        <div class="space-y-4">
          <div class="border-b border-slate-200 pb-3">
            <p class="text-xs font-semibold text-slate-500 uppercase">
              Payment Reference
            </p>
            <p class="text-sm text-slate-700 font-mono mt-1">
              {selectedOpposition.paymentId ?? selectedOpposition.rrr ?? "—"}
            </p>
          </div>
          <div class="border-b border-slate-200 pb-3">
            <p class="text-xs font-semibold text-slate-500 uppercase">
              Opposition Date
            </p>
            <p class="text-sm text-slate-700 mt-1">
              {mapDateToString(selectedOpposition.date)}
            </p>
          </div>
        </div>

        <!-- Opposer Information -->
        <div>
          <h3 class="font-semibold text-slate-900 text-lg mb-4">
            Opposer Information
          </h3>
          <div class="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <p class="text-xs font-semibold text-slate-600 uppercase">Name</p>
              <p class="text-sm text-slate-900 mt-1">
                {selectedOpposition.name}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-600 uppercase">
                Email
              </p>
              <p class="text-sm text-slate-900 mt-1">
                {selectedOpposition.email}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-600 uppercase">
                Phone
              </p>
              <p class="text-sm text-slate-900 mt-1">
                {selectedOpposition.phone || "—"}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-600 uppercase">
                Address
              </p>
              <p class="text-sm text-slate-900 mt-1">
                {selectedOpposition.address || "—"}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-600 uppercase">
                Nationality
              </p>
              <p class="text-sm text-slate-900 mt-1">
                {selectedOpposition.nationality || "—"}
              </p>
            </div>
          </div>
        </div>

        <!-- Opposition Grounds -->
        <div>
          <h3 class="font-semibold text-slate-900 text-lg mb-4">
            Grounds for Opposition
          </h3>
          <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p class="text-sm text-slate-700 whitespace-pre-wrap">
              {selectedOpposition.reason}
            </p>
          </div>
        </div>

        <!-- Supporting Documents -->
        {#if selectedOpposition.supportingDocs && selectedOpposition.supportingDocs.length > 0}
          <div>
            <h3 class="font-semibold text-slate-900 text-lg mb-4">
              Supporting Documents
            </h3>
            <div class="space-y-2">
              {#each selectedOpposition.supportingDocs as doc, idx}
                <a
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      icon="mdi:file-document"
                      class="w-5 h-5 text-slate-600"
                    />
                    <span class="text-sm font-medium text-slate-900"
                      >Document {idx + 1}</span
                    >
                  </div>
                  <Icon icon="mdi:download" class="w-4 h-4 text-green-600" />
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Counter Statements (if filed) -->
        {#if selectedOpposition.counterStatements && selectedOpposition.counterStatements.filter((c) => !c.oppositionId || c.oppositionId === selectedOpposition.id).length > 0}
          <div>
            <h3 class="font-semibold text-slate-900 text-lg mb-4">
              Counter Statements
            </h3>
            <div class="space-y-4">
              {#each selectedOpposition.counterStatements.filter((c) => !c.oppositionId || c.oppositionId === selectedOpposition.id) as cs, idx}
                <div
                  class="bg-orange-50 border border-orange-200 rounded-lg p-4"
                >
                  <div class="flex items-start justify-between mb-2">
                    <p class="text-sm font-semibold text-orange-900">
                      Counter Statement {idx + 1}
                    </p>
                    <p class="text-xs text-orange-700">
                      {mapDateToString(cs.submittedDate)}
                    </p>
                  </div>
                  <p class="text-sm text-orange-900 whitespace-pre-wrap">
                    {cs.text}
                  </p>
                  {#if cs.attachments && cs.attachments.length > 0}
                    <div class="mt-3 pt-3 border-t border-orange-200">
                      <p class="text-xs font-semibold text-orange-700 mb-2">
                        Attachments:
                      </p>
                      <div class="space-y-1">
                        {#each cs.attachments as attachment}
                          <a
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs text-orange-600 hover:text-orange-800 underline block"
                            >View Document</a
                          >
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Statutory Declarations (if filed) -->
        {#if selectedOpposition.statutoryDeclarations && selectedOpposition.statutoryDeclarations.length > 0}
          <div>
            <h3 class="font-semibold text-slate-900 text-lg mb-4">
              Statutory Declarations
            </h3>
            <div class="space-y-4">
              {#each selectedOpposition.statutoryDeclarations as sd, idx}
                <div
                  class="{sd.role === 'applicant'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'} border rounded-lg p-4"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <p
                        class="text-sm font-semibold {sd.role === 'applicant'
                          ? 'text-green-900'
                          : 'text-blue-900'}"
                      >
                        Declaration {idx + 1}
                      </p>
                      <span
                        class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full {sd.role ===
                        'applicant'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-blue-200 text-blue-800'}"
                      >
                        {sd.role === "applicant" ? "Applicant" : "Opposer"}
                      </span>
                    </div>
                    <p
                      class="text-xs {sd.role === 'applicant'
                        ? 'text-green-700'
                        : 'text-blue-700'}"
                    >
                      {mapDateToString(sd.submittedDate ?? sd.dateCreated)}
                    </p>
                  </div>
                  {#if sd.text || sd.comment}
                    <p
                      class="text-sm {sd.role === 'applicant'
                        ? 'text-green-900'
                        : 'text-blue-900'} whitespace-pre-wrap"
                    >
                      {sd.text ?? sd.comment}
                    </p>
                  {/if}
                  {#if sd.attachments && sd.attachments.length > 0}
                    <div
                      class="mt-3 pt-3 border-t {sd.role === 'applicant'
                        ? 'border-green-200'
                        : 'border-blue-200'}"
                    >
                      <p
                        class="text-xs font-semibold {sd.role === 'applicant'
                          ? 'text-green-700'
                          : 'text-blue-700'} mb-2"
                      >
                        Attachments:
                      </p>
                      <div class="space-y-1">
                        {#each sd.attachments as attachment}
                          <a
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs {sd.role === 'applicant'
                              ? 'text-green-600 hover:text-green-800'
                              : 'text-blue-600 hover:text-blue-800'} underline block"
                            >View Document</a
                          >
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- File Counter Statement Button -->
      {#if selectedOpposition && (!selectedOpposition.hasCounterStatement || selectedOpposition.oppositionStatus === 31)}
        <div class="mt-8 pt-6 border-t border-slate-200">
          <Button
            on:click={() => {
              const fileNumber = selectedOpposition.fileNumber;
              const oppId = selectedOpposition.id;
              window.location.href = `/opposition?step=counterstatement&fileNumber=${fileNumber}&oppositionId=${oppId}`;
            }}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="mdi:reply" class="w-4 h-4 mr-2" />
            File Counter Statement
          </Button>
        </div>
      {/if}

      <!-- File Statutory Declaration Button -->
      {#if selectedOpposition && (selectedOpposition.hasCounterStatement || (selectedOpposition.status ?? selectedOpposition.oppositionStatus) === 33) && !(selectedOpposition.statutoryDeclarations && selectedOpposition.statutoryDeclarations.some((sd) => sd.role === "applicant"))}
        <div class="mt-8 pt-6 border-t border-slate-200">
          <Button
            on:click={() => {
              const fileNumber = selectedOpposition.fileNumber;
              const oppId = selectedOpposition.id;
              window.location.href = `/opposition?step=statutorydeclaration&role=applicant&fileNumber=${fileNumber}&oppositionId=${oppId}`;
            }}
            class="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Icon icon="mdi:file-document-edit" class="w-4 h-4 mr-2" />
            File Statutory Declaration
          </Button>
        </div>
      {/if}
    {/if}
  </Sheet.Content>
</Sheet.Root>
