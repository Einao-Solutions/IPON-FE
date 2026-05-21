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
  let showRecordalDialog = false;
  let recordalData: any = null;
  let recordalLoading = false;
  let remita_confirmation = "checking";
  let amount = "";
  let paymentDate = "";
  let status = "";
  let validateRRR = "";
  let paymentDesc = "";
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
    const map = new Map<
      string,
      { field: string; left: any; right: any }
    >();
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
      if (isLeft) row.left = v;
      else row.right = v;
    }
    return order.map((id) => map.get(id)!);
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

      const result = await response.json();
      ({ amount, paymentDate, status, paymentDesc } = result);
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
      const body = {
        fileId: fileData.id,
        applicationId: selectedApplication.id,
        applicationType: selectedApplication.applicationType,
        beforeStatus: selectedApplication.currentStatus,
        afterStatus: mapStatusStringToStatus(String(newStatus ?? "")),
        reason: newStatusReason,
        userId: $loggedInUser?.creatorId,
        userName: name,
      };

      const response = await fetch(
        `${baseURL}/api/files/AdminUpdateApplication`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const latestData = await response.json();
        fileData = latestData;
        applicationData.set(latestData);
        newStatusContent = 2;
      }
    } catch (error) {
      console.error("Status change error:", error);
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
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Payment Confirmation</AlertDialog.Title>
      <AlertDialog.Description>Response From Remita</AlertDialog.Description>

      <div class="pt-4 mx-auto text-center">
        {#if remita_confirmation === "checking"}
          <div class="flex flex-col items-center justify-center py-4">
            <Icon
              icon="line-md:loading-loop"
              width="2rem"
              height="2rem"
              class="animate-spin"
            />
            <p class="mt-2">Verifying payment status...</p>
          </div>
        {:else if remita_confirmation === "success"}
          <div class="space-y-4 py-2">
            <div class="text-green-600">
              <Icon
                icon="clarity:success-standard-line"
                width="2rem"
                height="2rem"
                class="mx-auto"
              />
              <p class="font-bold mt-2">Successfully updated application</p>
            </div>
            <Button on:click={() => (showAlertDialog = false)} class="w-full"
              >Close</Button
            >
          </div>
        {:else if remita_confirmation === "verify_update"}
          <div class="space-y-3">
            <h3 class="font-semibold text-lg">Payment Information</h3>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <span class="font-medium">Amount Paid:</span>
              <span>₦{amount}</span>

              <span class="font-medium">Payment Date:</span>
              <span>{paymentDate || "N/A"}</span>

              <span class="font-medium">Payment Status:</span>
              <span
                class={status === "00" ? "text-green-600" : "text-yellow-600"}
              >
                {status === "00" ? "Successful" : "Pending"}
              </span>

              <span class="font-medium">Description:</span>
              <span>{paymentDesc || "No description"}</span>
            </div>

            <div class="flex gap-2 pt-3">
              {#if showManualUpdate}
                <Button
                  on:click={updateManual}
                  class="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Confirm Payment
                </Button>
              {/if}
              {#if $loggedInUser?.userRoles.includes(UserRoles.Tech || UserRoles.SuperAdmin)}
                {#if updateCert}
                  <Button
                    on:click={() =>
                      updateCertPaymentStatus(validateRRR, fileData.fileId)}
                    class="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Update Certificate Status
                  </Button>
                {/if}
              {/if}

              <Button
                on:click={() => (showAlertDialog = false)}
                class="flex-1"
                variant={showManualUpdate ? "outline" : "default"}
              >
                {showManualUpdate ? "Cancel" : "Close"}
              </Button>
            </div>
          </div>
        {/if}
      </div>
    </AlertDialog.Header>
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
        <div class="space-y-0">
          {#if selectedApplication?.applicationType === FormApplicationTypes.Assignment || selectedApplication?.applicationType === FormApplicationTypes.Merger || selectedApplication?.applicationType === FormApplicationTypes.ClericalUpdate || selectedApplication?.applicationType === FormApplicationTypes.Amendment || [7, 9, 36, 10].includes(selectedApplication?.applicationType ?? -1)}
            {@const isAssignment =
              selectedApplication?.applicationType ===
              FormApplicationTypes.Assignment}
            {@const leftPrefix = isAssignment ? "assignor" : "old"}
            {@const rightPrefix = isAssignment ? "assignee" : "new"}
            {@const leftLabel = isAssignment ? "Assignor (Previous)" : "Previous"}
            {@const rightLabel = isAssignment ? "Assignee (New)" : "New"}
            {@const rows = pairOldNew(recordalData, leftPrefix, rightPrefix)}
            {@const hasAnyLeft = rows.some((r) => r.left !== undefined)}
            <section>
              <table class="w-full text-sm border border-slate-200 rounded">
                <thead>
                  <tr class="border-b border-slate-200 bg-slate-50">
                    <th
                      class="text-left px-3 py-2 font-semibold text-slate-900 text-xs w-1/4"
                      >Field</th
                    >
                    {#if hasAnyLeft}
                      <th
                        class="text-left px-3 py-2 font-semibold text-slate-900 text-xs w-3/8 border-l border-slate-200"
                        >{leftLabel}</th
                      >
                    {/if}
                    <th
                      class="text-left px-3 py-2 font-semibold text-slate-900 text-xs border-l border-slate-200"
                      >{hasAnyLeft ? rightLabel : "Details"}</th
                    >
                  </tr>
                </thead>
                <tbody>
                  {#each rows as row}
                    <tr class="border-b border-slate-200 hover:bg-slate-50 align-top">
                      <td
                        class="px-3 py-2 font-medium text-slate-700 whitespace-nowrap"
                        >{row.field}</td
                      >
                      {#if hasAnyLeft}
                        <td class="px-3 py-2 text-slate-800 border-l border-slate-200 {row.left !== undefined && row.right !== undefined && JSON.stringify(row.left) !== JSON.stringify(row.right) ? 'bg-amber-50' : ''}">
                          {#if Array.isArray(row.left)}
                            <div class="space-y-0.5">
                              {#each row.left as item}<div>{item}</div>{/each}
                            </div>
                          {:else if row.left === undefined}
                            <span class="text-slate-400 italic">—</span>
                          {:else}
                            {row.left}
                          {/if}
                        </td>
                      {/if}
                      <td class="px-3 py-2 text-slate-800 border-l border-slate-200 {hasAnyLeft && row.left !== undefined && row.right !== undefined && JSON.stringify(row.left) !== JSON.stringify(row.right) ? 'bg-emerald-50 font-medium' : ''}">
                        {#if Array.isArray(row.right)}
                          <div class="space-y-0.5">
                            {#each row.right as item}<div>{item}</div>{/each}
                          </div>
                        {:else if row.right === undefined}
                          <span class="text-slate-400 italic">—</span>
                        {:else}
                          {row.right}
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </section>
          {/if}

          <!-- Shared: Attachments -->
          {#if recordalData.oldAttachmentUrl || recordalData.OldAttachmentUrl || recordalData.newAttachmentUrl || recordalData.NewAttachmentUrl}
            <section class="mt-3">
              <h4 class="text-xs font-semibold text-slate-900 mb-2">
                Attachments
              </h4>
              <div class="flex flex-wrap gap-4">
                {#if recordalData.oldAttachmentUrl || recordalData.OldAttachmentUrl}
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-slate-600"
                      >Previous</span
                    >
                    <img
                      src={recordalData.oldAttachmentUrl ||
                        recordalData.OldAttachmentUrl}
                      alt="Old Attachment"
                      class="max-w-xs h-auto rounded border border-slate-200"
                      style="max-height: 150px; object-fit: contain;"
                    />
                  </div>
                {/if}
                {#if recordalData.newAttachmentUrl || recordalData.NewAttachmentUrl}
                  <div class="flex flex-col gap-1">
                    <span class="text-xs font-medium text-slate-600"
                      >Updated</span
                    >
                    <img
                      src={recordalData.newAttachmentUrl ||
                        recordalData.NewAttachmentUrl}
                      alt="New Attachment"
                      class="max-w-xs h-auto rounded border border-slate-200"
                      style="max-height: 150px; object-fit: contain;"
                    />
                  </div>
                {/if}
              </div>
            </section>
          {/if}

          <!-- Shared: Documents -->
          {#if recordalData.documentUrl || recordalData.assignmentDeedUrl || recordalData.authorizationLetterUrl || (recordalData.appealDocs && recordalData.appealDocs.length > 0)}
            <section class="mt-3">
              <h4 class="text-xs font-semibold text-slate-900 mb-2">
                Supporting Documents
              </h4>
              <div class="flex flex-wrap gap-2">
                {#if recordalData.documentUrl}
                  <Button
                    on:click={() =>
                      window.open(recordalData.documentUrl, "_blank")}
                    variant="outline"
                    size="sm"
                    class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Icon
                      icon="mdi:file-document-outline"
                      width="1em"
                    />Document
                  </Button>
                {/if}
                {#if recordalData.assignmentDeedUrl}
                  <Button
                    on:click={() =>
                      window.open(recordalData.assignmentDeedUrl, "_blank")}
                    variant="outline"
                    size="sm"
                    class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Icon icon="mdi:file-sign" width="1em" />Assignment Deed
                  </Button>
                {/if}
                {#if recordalData.authorizationLetterUrl}
                  <Button
                    on:click={() =>
                      window.open(
                        recordalData.authorizationLetterUrl,
                        "_blank",
                      )}
                    variant="outline"
                    size="sm"
                    class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Icon
                      icon="mdi:file-certificate-outline"
                      width="1em"
                    />Authorization
                  </Button>
                {/if}
                {#if recordalData.appealDocs && Array.isArray(recordalData.appealDocs)}
                  {#each recordalData.appealDocs as docUrl, index}
                    <Button
                      on:click={() => window.open(docUrl, "_blank")}
                      variant="outline"
                      size="sm"
                      class="gap-1 text-xs border-slate-300 hover:bg-slate-50"
                    >
                      <Icon
                        icon="mdi:file-document-outline"
                        width="1em"
                      />Appeal {index + 1}
                    </Button>
                  {/each}
                {/if}
              </div>
            </section>
          {/if}
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
            <Label for="publication-attachments" class="font-semibold mb-3 block flex items-center gap-2">
              <Icon icon="mdi:attachment" class="text-green-600" />
              Publication Attachments:
            </Label>
            {#if publicationDetails.attachments && publicationDetails.attachments.length}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each publicationDetails.attachments as attachment, index}
                  <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name || `Publication Document ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {publicationDetails.attachments.length}
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
                              <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                              <span>View {attachment.url.length > 1 ? urlIndex + 1 : ""}</span>
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
                <p>No attachments submitted</p>
              </div>
            {/if}
          </div>

          <!-- Comment Section -->
          <div class="mb-4">
            <Label for="publication-comment" class="block font-medium mb-1 flex items-center gap-2">
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
              <Icon icon="mdi:check-circle-outline" width="1.2em" height="1.2em" class="inline mr-1" />
              Approve
            </Button>
            <Button
              class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded shadow disabled:opacity-50 transition"
              on:click={() => handlePublicationDecision(false)}
              disabled={publicationSubmitting || !publicationComment.trim()}
            >
              <Icon icon="mdi:close-circle-outline" width="1.2em" height="1.2em" class="inline mr-1" />
              Reject
            </Button>
          </div>

        </div>
      {/if}
    </div>

    <Dialog.Footer class="flex-shrink-0 mt-4 flex justify-end px-4 pb-4 border-t bg-gray-50">
      <Button on:click={() => (showPublicationDialog = false)} variant="outline">
        <Icon icon="mdi:close" width="1.2em" height="1.2em" class="inline mr-1" />
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
                  <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name || `Withdrawal Letter ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {withdrawalDetails.withdrawalLetterAttachments.length}
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
                              <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                              <span>View {attachment.url.length > 1 ? urlIndex + 1 : ""}</span>
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
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
                  <div class="border rounded-lg p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 truncate">
                          {attachment.name || `Supporting Document ${index + 1}`}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                          Document {index + 1} of {withdrawalDetails.supportingDocumentAttachments.length}
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
                              <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                              <span>View {attachment.url.length > 1 ? urlIndex + 1 : ""}</span>
                            </a>
                          {/each}
                        {:else}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap"
                          >
                            <Icon icon="mdi:file-eye" width="1.2em" height="1.2em" />
                            <span>View</span>
                          </a>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <Icon icon="mdi:file-outline" width="2em" height="2em" class="mx-auto mb-2 opacity-50" />
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
    }
  }}
>
  <Sheet.Content side="right" class="overflow-y-auto w-[600px]">
    <Sheet.Header>
      <Sheet.Title>
        Change Status for {selectedApplication?.applicationType}
      </Sheet.Title>
      <Sheet.Description>Select new status and reason</Sheet.Description>
    </Sheet.Header>
    {#if newStatusContent === null || newStatusContent === 0}
      <div class="flex flex-col gap-4">
        <Label>Select new Status</Label>
        <div class="grid grid-cols-2 gap-4">
          {#each Object.keys(ApplicationStatuses).filter( (x) => isNaN(parseInt(x)), ) as status}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="border rounded-md w-fit {newStatus === status
                ? 'bg-green-300'
                : ''} p-2 m-2"
              on:click={() => (newStatus = status)}
            >
              {status}
            </div>
          {/each}
        </div>
        <Textarea
          class="min-w-full min-h-48"
          placeholder="type reason for change..."
          bind:value={newStatusReason}
        />
      </div>
      <Sheet.Footer class="mt-4">
        <Button
          variant="outline"
          on:click={() => {
            showUpdateStatusForm = false;
            newStatusReason = null;
            newStatus = null;
          }}>Cancel</Button
        >
        <Button
          variant="default"
          on:click={() => {
            newStatusContent = 1;
          }}>Ok</Button
        >
      </Sheet.Footer>
    {:else if newStatusContent === 1}
      <div class="flex flex-col gap-4">
        <div>
          Are you sure you want to change the status to <p
            class="border rounded-md w-fit p-2 m-2"
          >
            {newStatus}
          </p>
          ?
        </div>
        <Button
          disabled={isNewStatusLoading === true}
          variant="outline"
          on:click={() => (newStatusContent = null)}>Cancel</Button>
        <Button
          disabled={isNewStatusLoading === true}
          on:click={() => confirmChange()}
        >
          <Icon
            class={isNewStatusLoading === true ? "" : "hidden"}
            icon="eos-icons:bubble-loading"
            width="1.2rem"
            height="1.2rem"
          />
          Ok</Button
          >
      </div>
    {:else if newStatusContent === 2}
      <div class="flex flex-col items-center justify-center">
        <p>Status Change successful</p>
        <Button
          on:click={() => {
            showUpdateStatusForm = false;
            isNewStatusLoading = false;
            newStatusContent = null;
            newStatus = null;
            newStatusReason = null;
          }}>OK</Button>
        </div>
    {/if}
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
            >{mapDateToString(application.applicationDate)}</Table.Cell
          >
          <!-- for Type -->
          <Table.Cell
            ><p class="rounded-md bg-gray-400 text-black p-1 w-fit">
              {mapTypeToString(application.applicationType ?? 0)}
            </p>
          </Table.Cell>
          <!-- for Payment ID -->
          <Table.Cell>{application.paymentId ?? "No Payment Id"}</Table.Cell>
          <!-- for Application Status -->
          <Table.Cell>
            <AppStatusTag
              value={application.currentStatus ?? undefined}
            /></Table.Cell
          >
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
                  {#if application.applicationType === FormApplicationTypes.Assignment && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.Assignment && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.License && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.License && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.Merger && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.Merger && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.Mortgage && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.Mortgage && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.CertifiedTrueCopy && fileData.type === FileTypes.Design && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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
                  {#if application.applicationType === FormApplicationTypes.CertifiedTrueCopy && fileData.type === FileTypes.Patent && application.currentStatus != null && [ApplicationStatuses.AwaitingRecordalProcess, ApplicationStatuses.Approved, ApplicationStatuses.Rejected].includes(application.currentStatus) && ($loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer) || $loggedInUser?.userRoles?.includes(UserRoles.PatentDesignRegistrar) || $loggedInUser?.userRoles?.includes(UserRoles.SuperAdmin))}
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

                  <!-- LETTERS -->
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
                    {#if application.currentStatus === ApplicationStatuses.Active}
                      <DropdownMenu.Item
                        on:click={() => {
                          generateLetter(application, 0, 3);
                        }}>Certificate of Registration</DropdownMenu.Item
                      >
                    {/if}
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
                  {#if application.applicationType === FormApplicationTypes.Certification && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
