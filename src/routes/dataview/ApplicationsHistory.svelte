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
  // import { au } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';

  // Variables
  // ======================
  export let allApplications: ApplicationHistoryType[];
  export let allOppositions: OppositionHistoryType[] | [];
  export let isAdmin: boolean = false;
  export let fileData: any;
  export let showMissingDetailsForm: () => {};
  let selectedApplication: ApplicationHistoryType | null = null;
  let showStatusHistory: boolean = false;
  let historyComponent: typeof HistorySheet | null = null;
  let isNewStatusLoading: boolean = false;
  let historyData = {};
  let showDataComparison: boolean = false;
  let newStatus: ApplicationStatuses | null = null;
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
        if (
          application.currentStatus === ApplicationStatuses.AwaitingPayment ||
          application.currentStatus ===
            ApplicationStatuses.AwaitingCertification
        ) {
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
        `${baseURL}/api/files/ManualUpdate?fileId=${fileData.id}&applicationId=${manualUpdate?.id}&userId=${$loggedInUser?.creatorId}&userName=${name}&isCertificate=${isCertificate}`,
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
        showToast("error", msg);
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
        case 8:
          endpoint = `/api/files/GetMergerApplication`;
          break;
        case 7:
          endpoint = `/api/files/GetRegUserApplication`;
          break;
        case 5:
          endpoint = `/api/files/GetAssignmentApplication`;
          break;
        case 9:
        case 10:
          endpoint = `/api/files/GetChangeDataRecordal`;
          break;
        case 11:
        case 17:
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
        userId: $loggedInUser?.id
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
        userId: $loggedInUser?.id
      };

      const res = await fetch(`${baseURL}/api/files/approve-amendment`, {
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
        userId: $loggedInUser?.id
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

  // console.log("fileData:", fileData);
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
          oldData={selectedApplication?.oldValue}
          newData={selectedApplication?.newValue}
          type={selectedApplication?.fieldToChange ?? ""}
        />
      {:else if dataType() === "attachments"}
        <AttachmentsComparison
          oldAttachments={selectedApplication?.oldValue}
          newAttachments={selectedApplication?.newValue}
        />
      {:else if dataType() === "correspondence"}
        <CorrespondenceComparison
          oldDetails={selectedApplication?.oldValue}
          newDetails={selectedApplication?.newValue}
        />
      {:else}
        <OtherComparison
          oldValue={selectedApplication?.oldValue}
          newValue={selectedApplication?.newValue}
          field={selectedApplication?.fieldToChange}
        />
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showRecordalDialog}>
  <Dialog.Content
    class="w-11/12 max-w-4xl mx-auto my-4 max-h-[90vh] overflow-hidden flex flex-col"
  >
    <Dialog.Header>
      <Dialog.Title>
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
      <Dialog.Description>
        {mapTypeToString(selectedApplication?.applicationType || 0)} Details
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-auto">
      {#if recordalLoading}
        <div class="flex justify-center items-center h-64">
          <Icon
            icon="line-md:loading-loop"
            width="2.5rem"
            height="2.5rem"
            class="animate-spin"
          />
        </div>
      {:else if recordalData}
        <div class="p-4 space-y-4">
          {#if selectedApplication?.applicationType === FormApplicationTypes.Assignment}
            <!-- Assignment Details -->
            <div class="border rounded-lg p-4 bg-gray-50">
              <!-- Assignor Details Section -->
              <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-900 mb-4">
                  Assignee Details
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each Object.entries(recordalData) as [key, value]}
                    {#if value != null && !key
                        .toLowerCase()
                        .startsWith("assignor") && !["id", "documentUrl", "authorizationLetterUrl", "assignmentDeedUrl", "appealDocs", "oldAttachmentUrl", "newAttachmentUrl"].includes(key.toLowerCase()) && !key
                        .toLowerCase()
                        .endsWith("url") && key.toLowerCase() !== "isapproved"}
                      <div class="break-words">
                        <Label
                          class="font-semibold capitalize text-sm text-gray-700"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </Label>
                        <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                          {#if Array.isArray(value)}
                            <ul class="list-disc pl-5 space-y-1">
                              {#each value as item}
                                <li class="break-words text-sm">{item}</li>
                              {/each}
                            </ul>
                          {:else}
                            <p class="text-sm text-gray-900">{value}</p>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>

              <!-- Assignee Details Section -->
              <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-900 mb-4">
                  Assignor Details
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each Object.entries(recordalData) as [key, value]}
                    {#if !["id", "documentUrl", "authorizationLetterUrl", "assignmentDeedUrl", "appealDocs", "oldAttachmentUrl", "fileid", "isapproved", "newAttachmentUrl"].includes(key.toLowerCase()) && value != null && !key
                        .toLowerCase()
                        .endsWith("url") && key
                        .toLowerCase()
                        .startsWith("assignor")}
                      <div class="break-words">
                        <Label
                          class="font-semibold capitalize text-sm text-gray-700"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </Label>
                        <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                          {#if Array.isArray(value)}
                            <ul class="list-disc pl-5 space-y-1">
                              {#each value as item}
                                <li class="break-words text-sm">{item}</li>
                              {/each}
                            </ul>
                          {:else}
                            <p class="text-sm text-gray-900">{value}</p>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>

              <!-- Handle attachment images -->
              {#if recordalData.oldAttachmentUrl || recordalData.OldAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >Old Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.oldAttachmentUrl ||
                        recordalData.OldAttachmentUrl}
                      alt="Old Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
              {#if recordalData.newAttachmentUrl || recordalData.NewAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >New Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.newAttachmentUrl ||
                        recordalData.NewAttachmentUrl}
                      alt="New Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Document Buttons Section -->
            <div class="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
              {#if recordalData.documentUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.documentUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document-outline" width="1.2em" />
                  View Document
                </Button>
              {/if}
              {#if recordalData.assignmentDeedUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.assignmentDeedUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-sign" width="1.2em" />
                  View Assignment Deed
                </Button>
              {/if}
              {#if recordalData.authorizationLetterUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.authorizationLetterUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document" width="1.2em" />
                  View Authorization Letter
                </Button>
              {/if}
            </div>
          {:else if selectedApplication?.applicationType === FormApplicationTypes.Merger}
            <!-- Assignment Details -->
            <div class="border rounded-lg p-4 bg-gray-50">
              <!-- Assignor Details Section -->
              <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-900 mb-4">
                  New Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each Object.entries(recordalData) as [key, value]}
                    {#if value != null && !key
                        .toLowerCase()
                        .startsWith("old") && !["id", "documentUrl", "authorizationLetterUrl", "assignmentDeedUrl", "appealDocs", "oldAttachmentUrl", "newAttachmentUrl"].includes(key.toLowerCase()) && !key
                        .toLowerCase()
                        .endsWith("url") && key.toLowerCase() !== "isapproved"}
                      <div class="break-words">
                        <Label
                          class="font-semibold capitalize text-sm text-gray-700"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </Label>
                        <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                          {#if Array.isArray(value)}
                            <ul class="list-disc pl-5 space-y-1">
                              {#each value as item}
                                <li class="break-words text-sm">{item}</li>
                              {/each}
                            </ul>
                          {:else}
                            <p class="text-sm text-gray-900">{value}</p>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>

              <!-- Assignee Details Section -->
              <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-900 mb-4">
                  Existing Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each Object.entries(recordalData) as [key, value]}
                    {#if !["id", "documentUrl", "authorizationLetterUrl", "assignmentDeedUrl", "appealDocs", "oldAttachmentUrl", "fileid", "isapproved", "newAttachmentUrl"].includes(key.toLowerCase()) && value != null && !key
                        .toLowerCase()
                        .endsWith("url") && key.toLowerCase().startsWith("old")}
                      <div class="break-words">
                        <Label
                          class="font-semibold capitalize text-sm text-gray-700"
                        >
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </Label>
                        <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                          {#if Array.isArray(value)}
                            <ul class="list-disc pl-5 space-y-1">
                              {#each value as item}
                                <li class="break-words text-sm">{item}</li>
                              {/each}
                            </ul>
                          {:else}
                            <p class="text-sm text-gray-900">{value}</p>
                          {/if}
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>

              <!-- Handle attachment images -->
              {#if recordalData.oldAttachmentUrl || recordalData.OldAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >Old Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.oldAttachmentUrl ||
                        recordalData.OldAttachmentUrl}
                      alt="Old Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
              {#if recordalData.newAttachmentUrl || recordalData.NewAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >New Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.newAttachmentUrl ||
                        recordalData.NewAttachmentUrl}
                      alt="New Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Document Buttons Section -->
            <div class="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
              {#if recordalData.documentUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.documentUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document-outline" width="1.2em" />
                  View Document
                </Button>
              {/if}
              {#if recordalData.assignmentDeedUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.assignmentDeedUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-sign" width="1.2em" />
                  View Assignment Deed
                </Button>
              {/if}
              {#if recordalData.authorizationLetterUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.authorizationLetterUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document" width="1.2em" />
                  View Authorization Letter
                </Button>
              {/if}
            </div>
          {:else if [7, 9, 10].includes(selectedApplication?.applicationType ?? -1)}
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(recordalData) as [key, value]}
                  {#if !["id", "isApproved", "documentUrl", "authorizationLetterUrl", "assignmentDeedUrl", "appealDocs", "oldAttachmentUrl", "newAttachmentUrl"].includes(key.toLowerCase()) && value != null && !key
                      .toLowerCase()
                      .endsWith("url")}
                    <div class="break-words">
                      <Label
                        class="font-semibold capitalize text-sm text-gray-700"
                      >
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </Label>
                      <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                        {#if Array.isArray(value)}
                          <ul class="list-disc pl-5 space-y-1">
                            {#each value as item}
                              <li class="break-words text-sm">{item}</li>
                            {/each}
                          </ul>
                        {:else}
                          <p class="text-sm text-gray-900">{value}</p>
                        {/if}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>

              <!-- Handle attachment images -->
              {#if recordalData.oldAttachmentUrl || recordalData.OldAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >Old Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.oldAttachmentUrl ||
                        recordalData.OldAttachmentUrl}
                      alt="Old Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
              {#if recordalData.newAttachmentUrl || recordalData.NewAttachmentUrl}
                <div class="mt-4">
                  <Label class="font-semibold text-sm text-gray-700 mb-2 block"
                    >New Attachment:</Label
                  >
                  <div class="border rounded-lg p-3 bg-white">
                    <img
                      src={recordalData.newAttachmentUrl ||
                        recordalData.NewAttachmentUrl}
                      alt="New Attachment"
                      class="max-w-full h-auto rounded border mx-auto"
                      style="max-height: 400px; object-fit: contain;"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Document Buttons Section -->
            <div class="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
              {#if recordalData.documentUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.documentUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document-outline" width="1.2em" />
                  View Document
                </Button>
              {/if}
              {#if recordalData.appealDocs && Array.isArray(recordalData.appealDocs)}
                {#each recordalData.appealDocs as docUrl, index}
                  <Button
                    on:click={() => window.open(docUrl, "_blank")}
                    variant="outline"
                    size="sm"
                    class="flex items-center gap-2"
                  >
                    <Icon icon="mdi:file-document-outline" width="1.2em" />
                    View Appeal Document {index + 1}
                  </Button>
                {/each}
              {/if}

              {#if recordalData.assignmentDeedUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.assignmentDeedUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-sign" width="1.2em" />
                  View Assignment Deed
                </Button>
              {/if}
              {#if recordalData.authorizationLetterUrl}
                <Button
                  on:click={() =>
                    window.open(recordalData.authorizationLetterUrl, "_blank")}
                  variant="outline"
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Icon icon="mdi:file-document" width="1.2em" />
                  View Authorization Letter
                </Button>
              {/if}
            </div>
          {:else if selectedApplication?.applicationType === FormApplicationTypes.ClericalUpdate || selectedApplication?.applicationType === FormApplicationTypes.Amendment}
            <!-- Clerical Update / Amendment Details -->
            <div class="border rounded-lg p-4 bg-gray-50">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(recordalData) as [key, value]}
                  {#if value != null && !["id", "isApproved", "documentUrl"].includes(key)}
                    <div class="break-words">
                      <Label
                        class="font-semibold capitalize text-sm text-gray-700"
                      >
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace("Url", "")
                          .trim()}:
                      </Label>
                      {#if typeof value === "string" && value.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)}
                        <div class="mt-1 border rounded-lg p-3 bg-white">
                          <img
                            src={value}
                            alt={key}
                            class="max-w-full h-auto rounded border mx-auto"
                            style="max-height: 400px; object-fit: contain;"
                          />
                        </div>
                      {:else if key.endsWith("Url") && typeof value === "string" && value}
                        <Button
                          on:click={() => window.open(String(value), "_blank")}
                          variant="outline"
                          size="sm"
                          class="flex items-center gap-2 mt-1"
                        >
                          <Icon
                            icon="mdi:file-document-outline"
                            width="1.2em"
                          />
                          View Document
                        </Button>
                      {:else}
                        <div class="mt-1 p-3 bg-white rounded border shadow-sm">
                          <p class="text-sm text-gray-900 break-all">{value}</p>
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
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
          <p class="text-gray-500 mt-2">No application data available</p>
        </div>
      {/if}

      {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.TrademarkCertification, UserRoles.SuperAdmin, UserRoles.Tech, UserRoles.TrademarkAcceptance].some( (r) => $loggedInUser.userRoles.includes(r), )}
        {#if [5, 7, 8, 9, 10, 11, 17].includes(selectedApplication?.applicationType) && selectedApplication?.currentStatus != ApplicationStatuses.Approved && selectedApplication?.currentStatus != ApplicationStatuses.Rejected}
          <div class="mt-4">
            <Label
              for="approval-reason"
              class="text-sm font-semibold text-gray-900"
            >
              Decision Reason <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="approval-reason"
              class="min-w-full min-h-32 mt-1"
              placeholder="Enter detailed reason for approval or denial..."
              bind:value={reason}
            />
            {#if reason && reason.trim().length > 0 && reason.trim().length < 10}
              <p class="text-xs text-red-500 mt-1 flex items-center gap-1">
                <Icon icon="mdi:alert-circle" width="14" />
                Reason must be at least 10 characters
              </p>
            {/if}
          </div>
        {/if}
      {/if}
      <!-- {#if $loggedInUser?.roles?.includes(UserRoles.TrademarkCertification)}
			{#if [5, 7, 8, 9, 10, 11, 17].includes(selectedApplication?.applicationType) && (selectedApplication?.currentStatus == ApplicationStatuses.Approved || selectedApplication?.currentStatus == ApplicationStatuses.Rejected)}
				<div class="mt-4">
					<Label for="approval-reason">Decision Reason</Label>
					<Textarea
						id="approval-reason"
						class="min-w-full min-h-32 mt-1"
						placeholder={selectedApplication.reason}
					/>
				</div>
			{/if}
		{/if}		 -->
      <Dialog.Footer class="mt-4 flex flex-wrap gap-2 justify-end">
        {#if Array.isArray($loggedInUser?.userRoles) && [UserRoles.TrademarkCertification, UserRoles.SuperAdmin, UserRoles.Tech, UserRoles.TrademarkAcceptance].some( (r) => $loggedInUser.userRoles.includes(r), )}
          {#if [5, 7, 8, 9, 10, 11, 17].includes(selectedApplication?.applicationType) && (selectedApplication?.currentStatus == ApplicationStatuses.AwaitingRecordalProcess || selectedApplication?.currentStatus == ApplicationStatuses.Amendment)}
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
              class="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon
                icon="mdi:check-circle-outline"
                class="mr-1"
                width="1.2em"
              />
              Approve Application
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
                denyRecordal(selectedApplication);
              }}
              disabled={!reason || reason.trim().length < 10}
              class="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon
                icon="mdi:close-circle-outline"
                class="mr-1"
                width="1.2em"
              />
              Deny Application
            </Button>
          {/if}
        {/if}

        <Button
          on:click={() => {
            showRecordalDialog = false;
            reason = "";
          }}
          variant="outline"
        >
          <Icon icon="mdi:close" class="mr-1" width="1.2em" />
          Close
        </Button>
      </Dialog.Footer>
    </div></Dialog.Content
  >
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
              on:click={handleDenyAppeal}
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
              on:click={handleApproveAppeal}
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
    class="w-full max-w-lg mx-auto my-8 rounded-xl shadow-lg bg-white border border-gray-200"
  >
    <Dialog.Header>
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <Icon
          icon="mdi:certificate-outline"
          width="1.5em"
          height="1.5em"
          class="text-blue-600"
        />
        Publication Details
      </Dialog.Title>
    </Dialog.Header>
    <div class="px-4 py-2">
      {#if publicationLoading}
        <div class="flex items-center gap-2 text-blue-600 py-8">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading...</span>
        </div>
      {:else if publicationError}
        <div class="text-red-500 py-8 flex items-center gap-2">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {publicationError}
        </div>
      {:else if publicationDetails}
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Icon
              icon="mdi:file-document-outline"
              width="1.2em"
              height="1.2em"
              class="text-gray-500"
            />
            <span class="font-semibold">File Number:</span>
            <span class="text-gray-700">{publicationDetails.fileId}</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon
              icon="mdi:calendar"
              width="1.2em"
              height="1.2em"
              class="text-gray-500"
            />
            <span class="font-semibold">Publication Date:</span>
            <span class="text-gray-700">
              {publicationDetails.publicationDate
                ? new Date(
                    publicationDetails.publicationDate,
                  ).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <Icon
                icon="mdi:attachment"
                width="1.2em"
                height="1.2em"
                class="text-gray-500"
              />
              <span class="font-semibold">Attachments:</span>
            </div>
            {#if publicationDetails.attachments && publicationDetails.attachments.length}
              <ul class="space-y-2 ml-6">
                {#each publicationDetails.attachments as att}
                  <li class="flex items-center gap-2">
                    <Icon
                      icon="mdi:file-pdf-box"
                      width="1.2em"
                      height="1.2em"
                      class="text-red-500"
                    />
                    <span>{att.name}</span>
                    {#if Array.isArray(att.url)}
                      {#each att.url as url}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener"
                          class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                          title="View"
                        >
                          <Icon
                            icon="mdi:eye-outline"
                            width="1em"
                            height="1em"
                          />
                          <span>View</span>
                        </a>
                      {/each}
                    {:else}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener"
                        class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                        title="View"
                      >
                        <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                        <span>View</span>
                      </a>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <span class="text-gray-500 ml-6">No attachments</span>
            {/if}
          </div>
          <div>
            <label for="publication-comment" class="block font-medium mb-1"
              >Comment:</label
            >
            <textarea
              id="publication-comment"
              bind:value={publicationComment}
              rows="3"
              class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-200"
              placeholder="Type your comment here..."
              required
            ></textarea>
          </div>
          <div class="flex gap-4 mt-4">
            <button
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
            </button>
            <button
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
            </button>
          </div>
        </div>
      {/if}
    </div>
    <Dialog.Footer class="mt-4 flex justify-end px-4 pb-4">
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
    class="w-11/12 max-w-2xl mx-auto my-8 rounded-xl shadow-lg bg-white border border-gray-200"
  >
    <Dialog.Header>
      <Dialog.Title class="text-2xl font-bold flex items-center gap-2">
        <Icon
          icon="mdi:file-remove-outline"
          width="1.5em"
          height="1.5em"
          class="text-red-600"
        />
        Withdrawal Request Details
      </Dialog.Title>
      <Dialog.Description
        >Review and process withdrawal application details.</Dialog.Description
      >
    </Dialog.Header>
    <div class="p-4">
      {#if withdrawalLoading}
        <div class="flex items-center gap-2 text-red-600 py-8 justify-center">
          <Icon
            icon="line-md:loading-loop"
            width="2em"
            height="2em"
            class="animate-spin"
          />
          <span>Loading...</span>
        </div>
      {:else if withdrawalError}
        <div class="text-red-500 py-8 flex items-center gap-2 justify-center">
          <Icon icon="mdi:alert-circle-outline" width="1.5em" height="1.5em" />
          {withdrawalError}
        </div>
      {:else if withdrawalDetails}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label class="font-semibold">File Number:</Label>
            <p class="mt-1 p-2 bg-gray-50 rounded border">
              {withdrawalDetails.fileId}
            </p>
          </div>
          <div>
            <Label class="font-semibold">Withdrawal Request Date:</Label>
            <p class="mt-1 p-2 bg-gray-50 rounded border">
              {withdrawalDetails.withdrawalRequestDate
                ? new Date(
                    withdrawalDetails.withdrawalRequestDate,
                  ).toLocaleString()
                : "N/A"}
            </p>
          </div>
          <!-- <div>
                        <Label class="font-semibold">Withdrawal Date:</Label>
                        <p class="mt-1 p-2 bg-gray-50 rounded border">
                            {withdrawalDetails.withdrawalDate
                                ? new Date(withdrawalDetails.withdrawalDate).toLocaleString()
                                : 'N/A'}
                        </p>
                    </div> -->
        </div>
        <div class="mb-4">
          <Label class="font-semibold mb-1"
            >Withdrawal Letter Attachments:</Label
          >
          {#if withdrawalDetails.withdrawalLetterAttachments && withdrawalDetails.withdrawalLetterAttachments.length}
            <ul class="list-disc pl-5 space-y-2">
              {#each withdrawalDetails.withdrawalLetterAttachments as att}
                <li>
                  <span class="font-medium">{att.name}:</span>
                  {#if Array.isArray(att.url)}
                    {#each att.url as url}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener"
                        class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                      >
                        <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                        <span>View</span>
                      </a>
                    {/each}
                  {:else}
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener"
                      class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                      <span>View</span>
                    </a>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <span class="text-gray-500 ml-6"
              >No withdrawal letter attachments</span
            >
          {/if}
        </div>
        <div class="mb-4">
          <Label class="font-semibold mb-1"
            >Supporting Document Attachments:</Label
          >
          {#if withdrawalDetails.supportingDocumentAttachments && withdrawalDetails.supportingDocumentAttachments.length}
            <ul class="list-disc pl-5 space-y-2">
              {#each withdrawalDetails.supportingDocumentAttachments as att}
                <li>
                  <span class="font-medium">{att.name}:</span>
                  {#if Array.isArray(att.url)}
                    {#each att.url as url}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener"
                        class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                      >
                        <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                        <span>View</span>
                      </a>
                    {/each}
                  {:else}
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener"
                      class="ml-2 text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      <Icon icon="mdi:eye-outline" width="1em" height="1em" />
                      <span>View</span>
                    </a>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else}
            <span class="text-gray-500 ml-6">No supporting documents</span>
          {/if}
        </div>
        <div class="mb-4">
          <Label for="withdrawal-comment" class="block font-medium mb-1"
            >Comment:</Label
          >
          <Textarea
            id="withdrawal-comment"
            bind:value={withdrawalComment}
            rows="3"
            class="w-full border rounded p-2 focus:ring-2 focus:ring-red-200"
            placeholder="Type your comment here..."
            required
          />
        </div>
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
      {/if}
    </div>
    <Dialog.Footer class="mt-4 flex justify-end px-4 pb-4">
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
          on:click={() => (newStatusContent = null)}>Cancel</Button
        >
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
          }}>OK</Button
        >
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
                  <DropdownMenu.Item
                    on:click={async () =>
                      await checkPayment(application, application.paymentId)}
                    >Verify Payment ({application.paymentId ??
                      "-"})</DropdownMenu.Item
                  >
                  <!-- View Recordal Data -->
                  {#if (Array.isArray($loggedInUser?.userRoles) && ($loggedInUser.userRoles.includes(UserRoles.Tech) || $loggedInUser.userRoles.includes(UserRoles.TrademarkCertification)) && application.applicationType === 5) || [8, 7, 9, 10].includes(application.applicationType)}
                    <DropdownMenu.Item
                      on:click={() => {
                        viewRecordalData(application);
                      }}>View Application</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Verify certificate payment -->
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
                  {#if $loggedInUser?.userRoles?.includes(UserRoles.TrademarkCertification) && application.applicationType === 14 && application.currentStatus === ApplicationStatuses.AwaitingStatusUpdate}
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
                    {#if fileData.type === 0 && $loggedInUser?.userRoles?.includes(UserRoles.PatentExaminer)}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {:else if fileData.type === 1 && $loggedInUser?.userRoles?.includes(UserRoles.DesignExaminer)}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {:else if fileData.type === 2 && $loggedInUser?.userRoles?.includes(UserRoles.TrademarkAcceptance)}
                      <DropdownMenu.Item
                        on:click={() =>
                          openWithdrawalDialog(fileData.fileId, application.id)}
                      >
                        View Withdrawal Application
                      </DropdownMenu.Item>
                    {/if}
                  {/if}
                  <!-- Clerical Update / Amendment -->
                  {#if (application.applicationType == FormApplicationTypes.ClericalUpdate || application.applicationType == FormApplicationTypes.Amendment) && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
                    {#if $loggedInUser?.userRoles && [UserRoles.Staff, UserRoles.Tech, UserRoles.SuperAdmin].some( (r) => $loggedInUser.userRoles.includes(r), )}
                      <DropdownMenu.Item
                        on:click={() => viewRecordalData(application)}
                        >View Application</DropdownMenu.Item
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
                        generateLetter(application, 0, 2);
                      }}>Acceptance Letter</DropdownMenu.Item
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
                  {#if application.applicationType === FormApplicationTypes.AppealRequest && application.currentStatus === ApplicationStatuses.Approved}
                    <DropdownMenu.Item
                      on:click={() => {
                        generateLetter(application, 13, 2);
                      }}>Acceptance Letter</DropdownMenu.Item
                    >
                  {/if}
                  <!-- Merger Docs -->
                  {#if application.applicationType === FormApplicationTypes.Merger && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                  {#if application.applicationType === FormApplicationTypes.Assignment && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                  {#if application.applicationType === FormApplicationTypes.RegisteredUser && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                  {#if application.applicationType === FormApplicationTypes.ChangeOfName && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                  {#if application.applicationType === FormApplicationTypes.ChangeOfAddress && application.currentStatus !== ApplicationStatuses.AwaitingPayment}
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
                  {:else if application.applicationType == 1 && application.currentStatus === ApplicationStatuses.Approved}
                    {#if $loggedInUser?.userRoles?.includes(UserRoles.TrademarkCertification || UserRoles.Tech || UserRoles.SuperAdmin)}
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
