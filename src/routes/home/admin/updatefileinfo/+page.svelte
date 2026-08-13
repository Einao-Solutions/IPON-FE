<script lang="ts">
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import {
    baseURL,
    ApplicationStatuses,
    FormApplicationTypes,
    FileTypes,
  } from "$lib/helpers";
  import { MapTradeMarkClass } from "$lib/constants";
  import { toast } from "svelte-french-toast";
  import { Button } from "$lib/components/ui/button";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import {
    mapDateToString,
    mapTypeToString,
  } from "../../../../routes/home/components/dashboardutils";
  import { mapStatusToString } from "$lib/designutils";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { Value } from "$lib/components/ui/select";
  import ApplicationsHistory from "../../../dataview/ApplicationsHistory.svelte";
  import DatePickerCustom from "../../../application/components/DatePickerCustom.svelte";
  import { FileType } from "lucide-svelte";
  let fileId = "";
  let isLoading = false;
  let showForm = false;
  let filing: any = null;
  let showSuccessModal = false;
  let showFailureModal = false;
  let userName = "";
  let notFoundMessage = "";

  loggedInUser.subscribe((user) => {
    userName = user?.firstName + " " + user?.lastName;
  });

  function ensureArrays(obj: any) {
    if (!obj) return obj;
    obj.applicants = Array.isArray(obj.applicants) ? obj.applicants : [];
    obj.inventors = Array.isArray(obj.inventors) ? obj.inventors : [];
    obj.priorityInfo = Array.isArray(obj.priorityInfo) ? obj.priorityInfo : [];
    obj.firstPriorityInfo = Array.isArray(obj.firstPriorityInfo)
      ? obj.firstPriorityInfo
      : [];
    obj.designCreators = Array.isArray(obj.designCreators)
      ? obj.designCreators
      : [];
    obj.applicationHistory = Array.isArray(obj.applicationHistory)
      ? obj.applicationHistory
      : [];
    obj.attachments = Array.isArray(obj.attachments) ? obj.attachments : [];
    return obj;
  }
  // Change File Status
  function getEnumOptions(s: any) {
    return Object.keys(s)
      .filter((key) => isNaN(Number(key)))
      .map((key) => ({
        value: s[key],
        label: key,
      }));
  }
  const statusOptions = getEnumOptions(ApplicationStatuses);
  const applicationTypes = getEnumOptions(FormApplicationTypes);
  // === ADD/DELETE FUNCTIONS ===
  // Helpers to safely convert between string and Date
  const toDateOrUndefined = (v: string) => {
    if (!v) return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  };
  const toISODateStringOrEmpty = (d: Date | undefined) => {
    if (!d) return "";
    // Keep date-only string (YYYY-MM-DD) if that’s what your API expects
    return d.toISOString().slice(0, 10);
  };
  // Generate UUID-like ID to match existing format
  const generateId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Add new applicant
  const addApplicant = () => {
    if (!filing.applicants) filing.applicants = [];
    const newApplicant = {
      id: generateId(),
      name: "",
      country: "",
      state: "",
      city: "",
      phone: "",
      email: "",
      address: "",
    };
    filing.applicants = [...filing.applicants, newApplicant];
  };

  const deleteApplicant = (index: number) => {
    filing.applicants = filing.applicants.filter((_: any, i: number) => i !== index);
  };

  //change file status
  const fileStatus = (s: ApplicationStatuses) => {
    const newStatus = s;
    filing.fileStatus = [...filing.fileStatus, newStatus];
  };

  interface StatusChange {
    newStatus: ApplicationStatuses | null;
    userId: string;
    fileId: string;
    reason: string;
  }

  let statusUpdate: StatusChange = {
    newStatus: null,
    userId: "",
    fileId: "",
    reason: "",
  };

  async function changeFileStatus(app: StatusChange) {
    const result = await fetch(`${baseURL}/api/admin/ChangeStatus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${$loggedInToken}`,
      },
      body: JSON.stringify({
        newStatus: statusUpdate.newStatus,
        userId: $loggedInUser?.id,
        fileId: filing.fileId,
        reason: statusUpdate.reason,
      }),
    });
    if (result.ok) {
      const text = await result.text();
      const data = text ? JSON.parse(text) : null;
      window.alert("Status Changed Successfully!");
      toast.success("Status Changed Successfully", {
        position: "top-right",
      });
    } else {
      toast.error("Failed to Change Status", {
        position: "top-right",
      });
      throw new Error("Verification failed");
    }
  }

  // === RECORDAL FORM DATA ===
  // Assignment form data
  let assignmentData = {
    assignorName: "",
    assignorEmail: "",
    assignorPhone: "",
    assignorNationality: "",
    assignorAddress: "",
    assigneeName: "",
    assigneeEmail: "",
    assigneePhone: "",
    assigneeNationality: "",
    assigneeCountry: "",
    assigneeAddress: "",
    dateOfAssignment: "",
    assignmentDeed: null as File | null,
    authorizationLetter: null as File | null,
  };

  // View-only copies for opening existing application history entries
  let selectedRecordal: { applicationType: number; hist: any } | null = null;
  let viewAssignmentData: any = {};
  let viewRegisteredUserData: any = {};
  let viewMergerData: any = {};
  let viewChangeOfNameData: any = {};
  let viewChangeOfAddressData: any = {};

  const safePick = (obj: any, ...paths: string[]) => {
    for (const p of paths) {
      if (!obj) continue;
      // support nested like 'newValue.name'
      const parts = p.split(".");
      let cur = obj;
      for (const part of parts) {
        if (cur == null) break;
        cur = cur[part];
      }
      if (cur !== undefined && cur !== null) return cur;
    }
    return "";
  };

  function openRecordalView(hist: any) {
    console.log("VIEW CLICKED - raw hist:", JSON.stringify(hist, null, 2));
    selectedRecordal = { applicationType: hist.applicationType, hist };
    newApp = {
      ...newApp,
      applicationType: hist.applicationType,
      applicationDate: hist.applicationDate ? hist.applicationDate.slice(0, 10) : "",
      currentStatus: hist.currentStatus ?? ApplicationStatuses.None,
      paymentId: hist.paymentId ?? "",
      certificatePaymentId: hist.certificatePaymentId ?? null,
      fileNumber: filing.fileId || "",
    };

    // Assignment (type 5) — populate from hist.assignment first, then oldValue/newValue fallback
    const a = hist?.assignment ?? {};
    const ov = hist?.oldValue ?? {};
    const nv = hist?.newValue ?? {};
    viewAssignmentData = {
      assignorName:        a.assignorName        ?? ov.name        ?? "",
      assignorEmail:       a.assignorEmail       ?? ov.email       ?? "",
      assignorPhone:       a.assignorPhone       ?? ov.phone       ?? "",
      assignorNationality: a.assignorNationality ?? ov.nationality ?? "",
      assignorAddress:     a.assignorAddress     ?? ov.address     ?? "",
      assignorCountry:     a.assignorCountry     ?? ov.country     ?? "",

      assigneeName:        a.assigneeName        ?? nv.assigneeName        ?? nv.name        ?? "",
      assigneeEmail:       a.assigneeEmail       ?? nv.assigneeEmail       ?? nv.email       ?? "",
      assigneePhone:       a.assigneePhone       ?? nv.assigneePhone       ?? nv.phone       ?? "",
      assigneeNationality: a.assigneeNationality ?? nv.assigneeNationality ?? nv.nationality ?? "",
      assigneeAddress:     a.assigneeAddress     ?? nv.assigneeAddress     ?? nv.address     ?? "",
      assigneeCountry:     a.assigneeCountry     ?? nv.assigneeCountry     ?? nv.country     ?? "",

      dateOfAssignment:    a.dateOfAssignment    ?? nv.dateOfAssignment    ?? "",
      assignmentDeed: null,
      authorizationLetter: null,
    };
    // Registered User (type 7)
    viewRegisteredUserData = {
      name: safePick(hist, "newValue.name", "newValue.registeredName", "name") || "",
      email: safePick(hist, "newValue.email", "email") || "",
      phone: safePick(hist, "newValue.phone", "phone") || "",
      nationality: safePick(hist, "newValue.nationality", "nationality") || "",
      address: safePick(hist, "newValue.address", "address") || "",
      document: null,
    };

    // Merger (type 8)
    viewMergerData = {
      name: safePick(hist, "newValue.name", "newValue.mergerName", "name") || "",
      email: safePick(hist, "newValue.email", "email") || "",
      phone: safePick(hist, "newValue.phone", "phone") || "",
      dateOfMerger: safePick(hist, "newValue.dateOfMerger", "dateOfMerger") || "",
      nationality: safePick(hist, "newValue.nationality", "nationality") || "",
      address: safePick(hist, "newValue.address", "address") || "",
      document: null,
    };

    // Change of Name (type 9)
    viewChangeOfNameData = {
      newName: safePick(hist, "newValue.newName", "newValue.name", "newName") || "",
      supportingDocument: null,
    };

    // Change of Address (type 10)
    viewChangeOfAddressData = {
      newAddress: safePick(hist, "newValue.newAddress", "newValue.address", "newAddress") || "",
      supportingDocument: null,
    };

    assignmentData = { ...assignmentData, ...viewAssignmentData };
    registeredUserData = { ...registeredUserData, ...viewRegisteredUserData };
    mergerData = { ...mergerData, ...viewMergerData };
    changeOfNameData = { ...changeOfNameData, ...viewChangeOfNameData };
    changeOfAddressData = { ...changeOfAddressData, ...viewChangeOfAddressData };
    console.log("assignmentData AFTER set:", JSON.stringify(assignmentData, null, 2));
  }

  function closeRecordalView() {
    selectedRecordal = null;
  }

  // Registered Users form data
  let registeredUserData = {
    name: "",
    email: "",
    phone: "",
    nationality: "",
    address: "",
    document: null as File | null,
  };

  // Merger form data
  let mergerData = {
    name: "",
    email: "",
    phone: "",
    dateOfMerger: "",
    nationality: "",
    address: "",
    document: null as File | null,
  };

  // Change of Name form data
  let changeOfNameData = {
    newName: "",
    supportingDocument: null as File | null,
  };

  // Change of Address form data
  let changeOfAddressData = {
    newAddress: "",
    supportingDocument: null as File | null,
  };

  // Helper to check if selected type is a recordal type
  $: isRecordalType = [5, 7, 8, 9, 10].includes(newApp.applicationType);

  //add app history
  let newApp: AppHistory = {
    applicationDate: "",
    applicationType: FormApplicationTypes.None,
    currentStatus: ApplicationStatuses.None,
    userId: "",
    paymentId: "",
    certificatePaymentId: null,
    fileNumber: "",
  };

  interface AppHistory {
    applicationDate: string;
    applicationType: FormApplicationTypes;
    currentStatus: ApplicationStatuses;
    userId: string;
    paymentId: string;
    certificatePaymentId: string | null;
    fileNumber: string;
  }

  // Add new inventor
  const addInventor = () => {
    if (!filing.inventors) filing.inventors = [];
    const newInventor = {
      id: generateId(),
      name: "",
      country: "",
      state: "",
      city: "",
      phone: "",
      email: "",
      address: "",
    };
    filing.inventors = [...filing.inventors, newInventor];
  };

  // Delete inventor
  const deleteInventor = (index: number) => {
    filing.inventors = filing.inventors.filter(
      (_: any, i: number) => i !== index
    );
  };

  // Add new priority info
  const addPriorityInfo = () => {
    if (!filing.priorityInfo) filing.priorityInfo = [];
    const newPriority = {
      id: generateId(),
      country: "",
      filingNumber: "",
      filingDate: "",
    };
    filing.priorityInfo = [...filing.priorityInfo, newPriority];
  };

  // Delete priority info
  const deletePriorityInfo = (index: number) => {
    filing.priorityInfo = filing.priorityInfo.filter(
      (_: any, i: number) => i !== index
    );
  };

  // Add new first priority info
  const addFirstPriorityInfo = () => {
    if (!filing.firstPriorityInfo) filing.firstPriorityInfo = [];
    const newFirstPriority = {
      id: generateId(),
      country: "",
      filingNumber: "",
      filingDate: "",
    };
    filing.firstPriorityInfo = [...filing.firstPriorityInfo, newFirstPriority];
  };

  // Delete first priority info
  const deleteFirstPriorityInfo = (index: number) => {
    filing.firstPriorityInfo = filing.firstPriorityInfo.filter(
      (_: any, i: number) => i !== index
    );
  };

  // Delete design creator
  const deleteDesignCreator = (index: number) => {
    filing.designCreators = filing.designCreators.filter(
      (_: any, i: number) => i !== index
    );
  };

  // === ATTACHMENT HANDLING FUNCTIONS ===

  // Canonical attachment option lists per file type
  type AttachmentOption = { value: string; label: string };

  const patentAttachmentOptions: AttachmentOption[] = [
    { value: 'pct', label: 'PCT Document' },
    { value: 'patentDrawing', label: 'Patent Drawing' },
    { value: 'priorityDocument', label: 'Priority Document' },
    { value: 'cs', label: 'Claims and Specifications' },
    { value: 'complete_specifications', label: 'Complete Specifications' },
    { value: 'poa', label: 'Power of Attorney' },
    { value: 'noveltyStatement', label: 'Novelty Statement' },
    { value: 'deed_of_assignment', label: 'Deed of Assignment' },
    { value: 'authorization', label: 'Letter of Authorization' },
    { value: 'other1', label: 'Supporting Document 1' },
    { value: 'other2', label: 'Supporting Document 2' },
    { value: 'others', label: 'Other Document' },
  ];

  const trademarkAttachmentOptions: AttachmentOption[] = [
    { value: 'representation', label: 'Proposed Trademark Representation' },
    { value: 'poa', label: 'Power of Attorney' },
    { value: 'priorityDocument', label: 'Priority Document' },
    { value: 'authorization', label: 'Letter of Authorization' },
    { value: 'deed_of_assignment', label: 'Deed of Assignment' },
    { value: 'other1', label: 'Supporting Document 1' },
    { value: 'other2', label: 'Supporting Document 2' },
    { value: 'others', label: 'Other Document' },
  ];

  const designAttachmentOptions: AttachmentOption[] = [
    { value: 'designDrawings', label: 'Design Drawings' },
    { value: 'statementOfNovelty', label: 'Statement of Novelty' },
    { value: 'designPriorityDocument', label: 'Design Priority Document' },
    { value: 'poa', label: 'Power of Attorney' },
    { value: 'authorization', label: 'Letter of Authorization' },
    { value: 'deed_of_assignment', label: 'Deed of Assignment' },
    { value: 'other1', label: 'Supporting Document 1' },
    { value: 'other2', label: 'Supporting Document 2' },
    { value: 'others', label: 'Other Document' },
  ];

  // Track new file uploads for attachments
  let newAttachments: Array<{
    Name: string;
    fileName: string;
    contentType: string;
    data: string;
  }> = [];

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:type/subtype;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file upload for attachments
  const handleAttachmentUpload = async (
    files: FileList,
    attachmentName: string
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await fileToBase64(file);
        const newAttachment = {
          Name: attachmentName,
          fileName: file.name,
          contentType: file.type,
          data: base64Data,
        };
        newAttachments = [...newAttachments, newAttachment];
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };

  const onAttachmentFileChange = (event: Event, attachmentName: string) => {
    const input = event.currentTarget as HTMLInputElement | null;
    if (input?.files) handleAttachmentUpload(input.files, attachmentName);
  };

  // Remove existing attachment URL
  const removeAttachmentUrl = (attachmentIndex: number, urlIndex: number) => {
    if (
      filing.attachments[attachmentIndex] &&
      filing.attachments[attachmentIndex].url
    ) {
      filing.attachments[attachmentIndex].url = filing.attachments[
        attachmentIndex
      ].url.filter((_: any, i: number) => i !== urlIndex);
    }
  };

  // Add new attachment category
  const addAttachmentCategory = () => {
    if (!filing.attachments) filing.attachments = [];
    const newCategory = {
      name: "",
      url: [],
    };
    filing.attachments = [...filing.attachments, newCategory];
  };

  // Delete attachment category
  const deleteAttachmentCategory = (index: number) => {
    filing.attachments = filing.attachments.filter(
      (_: any, i: number) => i !== index
    );
  };

  // Remove new attachment from upload list
  const removeNewAttachment = (index: number) => {
    newAttachments = newAttachments.filter((_: any, i: number) => i !== index);
  };

  // Remove new attachment
  // const removeNewAttachment = (index: number) => {
  //   newAttachments = newAttachments.filter((_: any, i: number) => i !== index);
  // };

  // Add new attachment category
  // const addAttachmentCategory = () => {
  //   if (!filing.attachments) filing.attachments = [];
  //   const newCategory = {
  //     name: '',
  //     url: []
  //   };
  //   filing.attachments = [...filing.attachments, newCategory];
  // };

  // Delete attachment category
  // const deleteAttachmentCategory = (index: number) => {
  //   filing.attachments = filing.attachments.filter((_: any, i: number) => i !== index);
  // };

  const fetchFiling = async () => {
    if (!fileId.trim()) return;
    isLoading = true;
    showForm = false;
    notFoundMessage = "";

    try {
      const res = await fetch(
        `${baseURL}/api/files/GetAllFileDetails?fileNumber=${encodeURIComponent(fileId)}`
      );
      if (!res.ok) throw new Error("Filing not found");

      const data = await res.json();
      // console.log('RAW DATA:', data);

      // ✅ Fix: Assign properly whether array or single object
      filing = Array.isArray(data) ? data[0] : data;
      if (!filing) throw new Error("No filing data found");

      filing = ensureArrays(filing); // <-- Normalize arrays here
      showForm = true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      notFoundMessage = "No file found for this file number.";
    } finally {
      isLoading = false;
    }
  };
  let editingId: string | null = null;
  let draft: any = {};

  const startEdit = (hist: any) => {
    editingId = hist.id;
    draft = { ...hist };
  };

  const cancelEdit = () => {
    editingId = null;
    draft = {};
  };

  const saveEdit = async () => {
    const body = {
      fileNumber: filing.fileId,
      applicationId: draft.id,
      applicationDate: draft.applicationDate
        ? new Date(draft.applicationDate)
        : null,
      applicationType: draft.applicationType,
      currentStatus: draft.currentStatus,
      paymentId: draft.paymentId ?? null,
      certificatePaymentId: draft.certificatePaymentId ?? null,
    };
    const res = await fetch(`${baseURL}/api/admin/ApplicationHistory`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${$loggedInToken}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const idx = filing.applicationHistory.findIndex(
        (x: any) => x.id === draft.id
      );
      if (idx >= 0) filing.applicationHistory[idx] = { ...draft };
      cancelEdit();
      toast.success("Application history updated", {
        position: "top-right",
      });
    } else {
      console.error("Update failed", await res.text());
      toast.error("Failed to update application history", {
        position: "top-right",
      });
    }
  };

  // Delete application history
  const deleteApplicationHistory = async (hist: any) => {
    if (!confirm("Are you sure you want to delete this application history entry?")) return;
    try {
      const res = await fetch(`${baseURL}/api/admin/ApplicationHistory`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken}`,
        },
        body: JSON.stringify({
          fileNumber: filing.fileId,
          applicationId: hist.id,
        }),
      });
      if (res.ok) {
        filing.applicationHistory = filing.applicationHistory.filter(
          (x: any) => x.id !== hist.id
        );
        if (editingId === hist.id) cancelEdit();
        toast.success("Application history deleted", {
          position: "top-right",
        });
      } else {
        const errText = await res.text();
        console.error("Delete failed", errText);
        toast.error("Failed to delete application history", {
          position: "top-right",
        });
      }
    } catch (err) {
      console.error("Error deleting application history:", err);
      toast.error("An error occurred while deleting", {
        position: "top-right",
      });
    }
  };

  // File input handlers for recordal forms
  const handleAssignmentDeedUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    assignmentData.assignmentDeed = file;
    viewAssignmentData.assignmentDeed = file;
  };

  const handleAssignmentLetterUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    assignmentData.authorizationLetter = file;
    viewAssignmentData.authorizationLetter = file;
  };

  const handleRegisteredUserDocUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    registeredUserData.document = file;
    viewRegisteredUserData.document = file;
  };

  const handleMergerDocUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    mergerData.document = file;
    viewMergerData.document = file;
  };

  const handleChangeOfNameDocUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    changeOfNameData.supportingDocument = file;
    viewChangeOfNameData.supportingDocument = file;
  };

  const handleChangeOfAddressDocUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    changeOfAddressData.supportingDocument = file;
    viewChangeOfAddressData.supportingDocument = file;
  };

  // Helper to convert a File to the backend attachment shape
  const fileToAttachment = async (file: File | null) => {
    if (!file) return null;
    const base64 = await fileToBase64(file);
    return { fileName: file.name, contentType: file.type || "application/octet-stream", data: base64 };
  };

  // Build and POST a new application history entry
  const addApplicationHistory = async (app: any) => {
    try {
      isLoading = true;
      const body: any = {
        fileNumber: filing.fileId,
        applicationType: app.applicationType,
        applicationDate: app.applicationDate ? new Date(app.applicationDate) : new Date(),
        currentStatus: app.currentStatus ?? ApplicationStatuses.None,
        paymentId: app.paymentId ?? null,
        certificatePaymentId: app.certificatePaymentId ?? null,
      };

      // Attach recordal-specific newValue/oldValue
      if (app.applicationType === FormApplicationTypes.Assignment) {
        body.oldValue = {
          name: assignmentData.assignorName || filing.applicants?.[0]?.name || filing.correspondence?.name || "",
          email: assignmentData.assignorEmail || filing.applicants?.[0]?.email || filing.correspondence?.email || "",
          phone: assignmentData.assignorPhone || filing.applicants?.[0]?.phone || "",
          nationality: assignmentData.assignorNationality || filing.applicants?.[0]?.nationality || "",
          address: assignmentData.assignorAddress || filing.applicants?.[0]?.address || filing.correspondence?.address || "",
        };
        body.newValue = {
          assigneeName: assignmentData.assigneeName,
          assigneeEmail: assignmentData.assigneeEmail,
          assigneePhone: assignmentData.assigneePhone,
          assigneeNationality: assignmentData.assigneeNationality,
          assigneeAddress: assignmentData.assigneeAddress,
        };
        const deed = await fileToAttachment(assignmentData.assignmentDeed);
        const auth = await fileToAttachment(assignmentData.authorizationLetter);
        body.newValue.attachments = [deed, auth].filter(Boolean);
      }

      if (app.applicationType === FormApplicationTypes.RegisteredUser) {
        body.oldValue = { name: filing.registeredUser?.name || "" };
        body.newValue = {
          name: registeredUserData.name,
          email: registeredUserData.email,
          phone: registeredUserData.phone,
          nationality: registeredUserData.nationality,
          address: registeredUserData.address,
        };
        const doc = await fileToAttachment(registeredUserData.document);
        body.newValue.attachments = [doc].filter(Boolean);
      }

      if (app.applicationType === FormApplicationTypes.Merger) {
        body.oldValue = { name: filing.applicants?.[0]?.name || "" };
        body.newValue = {
          name: mergerData.name,
          email: mergerData.email,
          phone: mergerData.phone,
          dateOfMerger: mergerData.dateOfMerger,
          nationality: mergerData.nationality,
          address: mergerData.address,
        };
        const doc = await fileToAttachment(mergerData.document);
        body.newValue.attachments = [doc].filter(Boolean);
      }

      if (app.applicationType === FormApplicationTypes.ChangeOfName) {
        body.oldValue = { name: filing.applicants?.[0]?.name || filing.correspondence?.name || "" };
        body.newValue = { newName: changeOfNameData.newName };
        const doc = await fileToAttachment(changeOfNameData.supportingDocument);
        body.newValue.attachments = [doc].filter(Boolean);
      }

      if (app.applicationType === FormApplicationTypes.ChangeOfAddress) {
        body.oldValue = { address: filing.correspondence?.address || "" };
        body.newValue = { newAddress: changeOfAddressData.newAddress };
        const doc = await fileToAttachment(changeOfAddressData.supportingDocument);
        body.newValue.attachments = [doc].filter(Boolean);
      }

      const res = await fetch(`${baseURL}/api/admin/ApplicationHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const created = await res.json();
        filing.applicationHistory = filing.applicationHistory || [];
        filing.applicationHistory = [created, ...filing.applicationHistory];
        toast.success("Application history added", { position: "top-right" });
      } else {
        const txt = await res.text();
        console.error("Failed to add application history:", txt);
        toast.error("Failed to add application", { position: "top-right" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding application", { position: "top-right" });
    } finally {
      isLoading = false;
    }
  };

  // Submit from the opened recordal view (uses view* data)
  const submitRecordalFromView = async () => {
    if (!selectedRecordal) return;
    const t = selectedRecordal.applicationType;
    // Build a lightweight app object similar to newApp
    const appObj: any = {
      applicationType: t,
      applicationDate: new Date().toISOString(),
      currentStatus: ApplicationStatuses.None,
      paymentId: null,
      certificatePaymentId: null,
    };

    // copy view data into the canonical form objects so addApplicationHistory can read them
    if (t === FormApplicationTypes.Assignment) {
      assignmentData = { ...assignmentData, ...viewAssignmentData };
    }
    if (t === FormApplicationTypes.RegisteredUser) {
      registeredUserData = { ...registeredUserData, ...viewRegisteredUserData };
    }
    if (t === FormApplicationTypes.Merger) {
      mergerData = { ...mergerData, ...viewMergerData };
    }
    if (t === FormApplicationTypes.ChangeOfName) {
      changeOfNameData = { ...changeOfNameData, ...viewChangeOfNameData };
    }
    if (t === FormApplicationTypes.ChangeOfAddress) {
      changeOfAddressData = { ...changeOfAddressData, ...viewChangeOfAddressData };
    }

    await addApplicationHistory(appObj);
    closeRecordalView();
  };

  const saveChanges = async () => {
    try {
      isLoading = true;
      filing.updatedBy = userName;

      // Prepare the payload with the new attachment structure
      const payload = {
        ...filing,
        UpdatedAttachments: {
          ExistingAttachments: filing.attachments || [],
          NewAttachments: newAttachments,
        },
      };

      const res = await fetch(`${baseURL}/api/files/update-filing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      showSuccessModal = true;

      setTimeout(() => {
        goto("/home/admin");
      }, 2500); // Wait 1.5 seconds before navigating
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      showFailureModal = true;
      console.error("Error updating file:", message);
    } finally {
      isLoading = false;
    }
  };

  $: if (filing?.trademarkClass) {
    const description = MapTradeMarkClass(Number(filing.trademarkClass));
    if (description) {
      filing.trademarkClassDescription = description;
    }
  }

</script>

<div class="space-y-4 p-4">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-bold">Update File Information</h1>

    <button
      on:click={() => goto("/home/admin")}
      class="border rounded p-2 text-white bg-black hover:bg-gray-600 transition-colors"
    >
      Back
    </button>
  </div>

  <form class="flex gap-2" on:submit|preventDefault={fetchFiling}>
    <input
      class="border rounded p-2 w-full"
      bind:value={fileId}
      placeholder="Enter File ID"
      on:input={() => (notFoundMessage = "")}
    />
    <Button type="submit">Search</Button>
  </form>

  {#if notFoundMessage && !isLoading}
    <p class="text-red-500 text-sm mt-2">{notFoundMessage}</p>
  {/if}

  {#if isLoading}
    <div
      class="animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent mx-auto my-4"
    ></div>
  {/if}

  {#if showForm && filing}
    <div in:fade class="space-y-8">
      <!-- PATENT FILES (fileType = 0) -->
      {#if filing.type === FileTypes.Patent}
        <!-- Patent Information Section -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              Patent Information
            </summary>
            <div
              class="grid gap-4 mt-4 bg-white p-4 rounded border border-slate-100"
            >
              <label for="filing-origin" class="font-medium text-gray-700"
                >Filing Origin</label
              >
              <select
                id="filing-origin"
                class="input"
                bind:value={filing.filingOrigin}
              >
                <option value="">Select Filing Origin</option>
                <option value="Local">Local</option>
                <option value="Foreign">Foreign</option>
              </select>

              <label for="filing-country" class="font-medium text-gray-700"
                >Filing Country</label
              >
              <input
                id="filing-country"
                class="input"
                bind:value={filing.filingCountry}
                placeholder="Filing Country"
              />

              <label for="patent-type" class="font-medium text-gray-700"
                >Patent Type</label
              >
              <select
                id="patent-type"
                class="input"
                bind:value={filing.patentType}
              >
                <option value="">Select Patent Type</option>
                <option value={0}>Conventional</option>
                <option value={1}>Non-Conventional</option>
                <option value={2}>PCT</option>
              </select>

              <label
                for="patent-application-type"
                class="font-medium text-gray-700">Patent Application Type</label
              >
              <select
                id="patent-application-type"
                class="input"
                bind:value={filing.patentApplicationType}
              >
                <option value="">Select Application Type</option>
                <option value={0}>Patent</option>
                <option value={1}>Business Method</option>
                <option value={2}>Utility Model</option>
              </select>

              <label for="title-of-invention" class="font-medium text-gray-700"
                >Title of Invention</label
              >
              <input
                id="title-of-invention"
                class="input"
                bind:value={filing.titleOfInvention}
                placeholder="Title of Invention"
              />
              <div>
                <label
                  for="rtm-number"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >RTM Number</label
                >
                <input
                  id="rtm-number"
                  class="input"
                  bind:value={filing.rtmNumber}
                  placeholder="RTM Number"
                />
              </div>
              <label for="patent-abstract" class="font-medium text-gray-700"
                >Patent Abstract</label
              >
              <textarea
                id="patent-abstract"
                class="input min-h-24"
                bind:value={filing.patentAbstract}
                placeholder="Patent Abstract"
              />
            </div>
          </details>
        </div>
      {/if}

      <!-- DESIGN FILES (fileType = 1) -->
      {#if filing.type === FileTypes.Design}
        <!-- Design Information Section -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M11 7.343V10.5a.5.5 0 00.5.5h3.157"
                ></path>
              </svg>
              Design Information
            </summary>
            <div class="bg-white p-4 rounded border border-slate-100 mt-4">
              <div class="grid gap-4">
                <div>
                  <label
                    for="design-type"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Design Type</label
                  >
                  <select
                    id="design-type"
                    class="input"
                    bind:value={filing.designType}
                  >
                    <option value="">Select Design Type</option>
                    <option value={0}>Textile</option>
                    <option value={1}>NonTextile</option>
                  </select>
                </div>

                <div>
                  <label
                    for="title-of-design"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Title of Design</label
                  >
                  <input
                    id="title-of-design"
                    class="input"
                    bind:value={filing.titleOfDesign}
                    placeholder="Enter Design Title"
                  />
                </div>
                <div>
                  <label
                    for="rtm-number"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >RTM Number</label
                  >
                  <input
                    id="rtm-number"
                    class="input"
                    bind:value={filing.rtmNumber}
                    placeholder="RTM Number"
                  />
                </div>
                <div>
                  <label
                    for="statement-of-novelty"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Statement of Novelty</label
                  >
                  <textarea
                    id="statement-of-novelty"
                    class="input min-h-24"
                    bind:value={filing.statementOfNovelty}
                    placeholder="Enter novelty statement"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      {/if}

      <!-- TRADEMARK FILES (fileType = 2) -->
      {#if filing.type === FileTypes.Trademark}
        <!-- Trademark Information Section -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                ></path>
              </svg>
              Trademark Information
            </summary>
            <div class="bg-white p-4 rounded border border-slate-100 mt-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="trademark-class"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Trademark Class (1-45)</label
                  >
                  <!-- <input
                    id="trademark-class"
                    class="input"
                    type="number"
                    min="1"
                    max="45"
                    bind:value={filing.trademarkClass}
                    placeholder="Trademark Class (1-45)"
                  /> -->

                  <select
                    id="trademark-class"
                    class="input"
                    bind:value={filing.trademarkClass}
                  >
                    <option value="">Select Trademark Class</option>
                    {#each Array.from({length: 45}, (_, i) => i + 1) as classNum}
                      <option value={classNum}>Class {classNum}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label
                    for="trademark-type"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Trademark Type</label
                  >
                  <select
                    id="trademark-type"
                    class="input"
                    bind:value={filing.trademarkType}
                  >
                    <option value="">Select Trademark Type</option>
                    <option value={0}>Local</option>
                    <option value={1}>Foreign</option>
                  </select>
                </div>

                <div class="md:col-span-2">
                  <label
                    for="logo-description"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Logo Description</label
                  >
                  <select
                    id="logo-description"
                    class="input"
                    bind:value={filing.trademarkLogo}
                  >
                    <option value="">Select Logo Description</option>
                    <option value={0}>Device</option>
                    <option value={1}>Word Mark</option>
                    <option value={2}>Word and Device</option>
                  </select>
                </div>

                <div class="md:col-span-2">
                  <label
                    for="claims-disclaimer"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Claims and Disclaimer</label
                  >
                  <textarea
                    id="claims-disclaimer"
                    class="input min-h-24"
                    bind:value={filing.trademarkDisclaimer}
                    placeholder="Claims and Disclaimer"
                  />
                </div>

                <div>
                  <label
                    for="title-of-trademark"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Title of Trademark</label
                  >
                  <input
                    id="title-of-trademark"
                    class="input"
                    bind:value={filing.titleOfTradeMark}
                    placeholder="Title of Trademark"
                  />
                </div>
                <div>
                  <label
                    for="rtm-number"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >RTM Number</label
                  >
                  <input
                    id="rtm-number"
                    class="input"
                    bind:value={filing.rtmNumber}
                    placeholder="RTM Number"
                  />
                </div>

                <div class="md:col-span-2">
                  <label
                    for="trademark-class-description"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Trademark Class Description</label
                  >
                  <textarea
                    id="trademark-class-description"
                    class="input min-h-24"
                    bind:value={filing.trademarkClassDescription}
                    placeholder="Trademark Class Description"
                  />
                </div>

                <div class="md:col-span-2">
                  <label
                    for="trademark-specification"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Trademark Specification</label
                  >
                  <textarea
                    id="trademark-specification"
                    class="input min-h-24"
                    bind:value={filing.trademarkSpecification}
                    placeholder="Enter trademark specification (goods and services covered under this class)"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      {/if}

      <!-- Applicants (Common for all file types) -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
        <details class="p-6 open">
          <summary
            class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            Applicants
          </summary>
          <div class="grid gap-4 mt-4">
            {#each filing.applicants as applicant, index (applicant.id)}
              <div
                class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <!-- Applicant heading with spacing and delete button -->
                <div
                  class="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded-md"
                >
                  <label
                    for="applicant-{index}-heading"
                    class="block text-base font-semibold text-slate-800"
                    >Applicant {index + 1}</label
                  >
                  <Button
                    variant="destructive"
                    size="sm"
                    on:click={() => deleteApplicant(index)}
                    class="text-xs"
                  >
                    Delete
                  </Button>
                </div>

                <!-- Input fields -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      for="applicant-{index}-name"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Name</label
                    >
                    <input
                      id="applicant-{index}-name"
                      class="input"
                      bind:value={applicant.name}
                      placeholder="Full Name"
                    />
                  </div>

                  <div>
                    <label
                      for="applicant-{index}-nationality"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Nationality</label
                    >
                    <input
                      id="applicant-{index}-nationality"
                      class="input"
                      bind:value={applicant.country}
                      placeholder="Nationality"
                    />
                  </div>

                  <div>
                    <label
                      for="applicant-{index}-state"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >State</label
                    >
                    <input
                      id="applicant-{index}-state"
                      class="input"
                      bind:value={applicant.state}
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label
                      for="applicant-{index}-city"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >City</label
                    >
                    <input
                      id="applicant-{index}-city"
                      class="input"
                      bind:value={applicant.city}
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label
                      for="applicant-{index}-phone"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Phone</label
                    >
                    <input
                      id="applicant-{index}-phone"
                      class="input"
                      bind:value={applicant.phone}
                      placeholder="Phone Number"
                    />
                  </div>

                  <div>
                    <label
                      for="applicant-{index}-email"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Email</label
                    >
                    <input
                      id="applicant-{index}-email"
                      class="input"
                      bind:value={applicant.email}
                      placeholder="Email Address"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label
                      for="applicant-{index}-address"
                      class="block text-sm font-medium text-gray-700 mb-1"
                      >Address</label
                    >
                    <input
                      id="applicant-{index}-address"
                      class="input"
                      bind:value={applicant.address}
                      placeholder="Full Address"
                    />
                  </div>
                </div>
              </div>
            {/each}

            <!-- Add New Applicant Button -->
            <Button
              variant="outline"
              on:click={addApplicant}
              class="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              + Add New Applicant
            </Button>
          </div>
        </details>
      </div>
      <!-- Application History (Common for all file types) -->
      <div class="mt-4">
        <!--      ADD NEW HISTORY CARD     -->
        <div
          class="bg-white border border-slate-200 p-6 rounded-lg shadow-sm mb-6"
        >
          <h3 class="text-lg font-semibold text-slate-800 mb-4">
            Add Application History
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Application Date -->
            <div>
              <label
                class="block text-sm font-medium mb-1"
                for="applicationDate">Application Date</label
              >
              <input
                type="date"
                class="input w-full"
                bind:value={newApp.applicationDate}
              />
            </div>
            <!-- Application Type -->
            <div>
              <label
                class="block text-sm font-medium mb-1"
                for="applicationType">Application Type</label
              >
              <select
                class="input w-full"
                bind:value={newApp.applicationType}
                id="applicationType"
              >
                <option disabled value="">Select Application Type</option>
                {#each applicationTypes as a}
                  <option value={a.value}>{mapTypeToString(a.value)}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- ===== RECORDAL-SPECIFIC FORMS ===== -->
          {#if isRecordalType && filing?.fileId}
            <!-- Assignment Application (type 5) -->
            {#if newApp.applicationType === 5}
              <div class="border border-slate-300 rounded-lg overflow-hidden mt-4">
                <div class="bg-blue-100 px-4 py-2 font-semibold text-blue-900">Assignment Application [Form 16]</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 class="font-semibold mb-3">Assignor Information</h4>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" class="input" bind:value={assignmentData.assignorName} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" class="input" bind:value={assignmentData.assignorEmail} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" class="input" bind:value={assignmentData.assignorPhone} />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                        <input type="text" class="input" bind:value={assignmentData.assignorNationality} />
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea class="input min-h-20" bind:value={assignmentData.assignorAddress}></textarea>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Name: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={assignmentData.assigneeName} placeholder="Enter assignee name" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Email: <span class="text-red-500">*</span></label>
                    <input type="email" class="input" bind:value={assignmentData.assigneeEmail} placeholder="Enter assignee email" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Phone: <span class="text-red-500">*</span></label>
                    <input type="tel" class="input" bind:value={assignmentData.assigneePhone} placeholder="Enter assignee phone" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Nationality: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={assignmentData.assigneeNationality} placeholder="Enter assignee nationality" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Country</label>
                    <input type="text" class="input" readonly value={assignmentData.assigneeCountry} />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignee Address: <span class="text-red-500">*</span></label>
                    <textarea class="input min-h-20" bind:value={assignmentData.assigneeAddress} placeholder="Enter assignee address" required></textarea>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Assignment</label>
                    <input type="text" class="input" readonly value={assignmentData.dateOfAssignment} />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Deed (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleAssignmentDeedUpload} />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Authorization Letter (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleAssignmentLetterUpload} />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Registered Users (type 7) -->
            {#if newApp.applicationType === 7}
              <div class="border border-slate-300 rounded-lg overflow-hidden mt-4">
                <div class="bg-blue-100 px-4 py-2 font-semibold text-blue-900">Registered User Application</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={registeredUserData.name} placeholder="Enter name" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label>
                    <input type="email" class="input" bind:value={registeredUserData.email} placeholder="Enter email" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone: <span class="text-red-500">*</span></label>
                    <input type="tel" class="input" bind:value={registeredUserData.phone} placeholder="Enter phone" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={registeredUserData.nationality} placeholder="Enter nationality" required />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label>
                    <textarea class="input min-h-20" bind:value={registeredUserData.address} placeholder="Enter address" required></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleRegisteredUserDocUpload} />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Merger Application (type 8) -->
            {#if newApp.applicationType === 8}
              <div class="border border-slate-300 rounded-lg overflow-hidden mt-4">
                <div class="bg-blue-100 px-4 py-2 font-semibold text-blue-900">Merger Application [Form 17]</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={mergerData.name} placeholder="Enter name" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email: <span class="text-red-500">*</span></label>
                    <input type="email" class="input" bind:value={mergerData.email} placeholder="Enter email" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone: <span class="text-red-500">*</span></label>
                    <input type="tel" class="input" bind:value={mergerData.phone} placeholder="Enter phone" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Merger: <span class="text-red-500">*</span></label>
                    <input type="date" class="input" bind:value={mergerData.dateOfMerger} required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nationality: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={mergerData.nationality} placeholder="Enter nationality" required />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address: <span class="text-red-500">*</span></label>
                    <textarea class="input min-h-20" bind:value={mergerData.address} placeholder="Enter address" required></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Deed of Merger (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleMergerDocUpload} />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Change of Applicant Name (type 9) -->
            {#if newApp.applicationType === 9}
              <div class="border border-slate-300 rounded-lg overflow-hidden mt-4">
                <div class="bg-blue-100 px-4 py-2 font-semibold text-blue-900">Change of Applicant Name</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">New Name: <span class="text-red-500">*</span></label>
                    <input type="text" class="input" bind:value={changeOfNameData.newName} placeholder="Enter the new applicant name" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleChangeOfNameDocUpload} />
                  </div>
                </div>
              </div>
            {/if}

            <!-- Change of Applicant Address (type 10) -->
            {#if newApp.applicationType === 10}
              <div class="border border-slate-300 rounded-lg overflow-hidden mt-4">
                <div class="bg-blue-100 px-4 py-2 font-semibold text-blue-900">Change of Applicant Address</div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">New Address: <span class="text-red-500">*</span></label>
                    <textarea class="input min-h-20" bind:value={changeOfAddressData.newAddress} placeholder="Enter the new applicant address" required></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF):</label>
                    <input type="file" accept=".pdf" class="input" on:change={handleChangeOfAddressDocUpload} />
                  </div>
                </div>
              </div>
            {/if}
          {/if}

          <!-- ===== EXISTING SIMPLE FORM (below recordal forms) ===== -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <!-- Current Status -->
            <div>
              <label class="block text-sm font-medium mb-1" for="currentStatus"
                >Current Status</label
              >
              <select
                class="input w-full"
                bind:value={newApp.currentStatus}
                id="currentStatus"
              >
                <option disabled value="">Select Status</option>
                {#each statusOptions as s}
                  <option value={s.value}>{mapStatusToString(s.value)}</option>
                {/each}
              </select>
            </div>

            <!-- Payment ID -->
            <div>
              <label class="block text-sm font-medium mb-1" for="paymentId"
                >Payment ID</label
              >
              <input
                class="input w-full"
                placeholder="Payment ID"
                bind:value={newApp.paymentId}
              />
            </div>

            <!-- Certificate Payment ID -->
            <div>
              <label
                class="block text-sm font-medium mb-1"
                for="certificatePaymentId">Certificate Payment ID</label
              >
              <input
                class="input w-full"
                placeholder="Certificate Payment ID"
                bind:value={newApp.certificatePaymentId}
              />
            </div>

            <div class="col-span-2">
              <Button
                size="sm"
                class="mt-2"
                on:click={() => addApplicationHistory(newApp)}
              >
                Add Application
              </Button>
            </div>
          </div>
        </div>
        <!-- ============ App History Table ================= -->
        {#if selectedRecordal}
          <div class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm mb-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold">View Application Details</h3>
              <button class="text-sm text-gray-600 hover:text-gray-800" on:click={closeRecordalView}>Close</button>
            </div>

            {#if selectedRecordal.applicationType === 5}
              <!-- Assignment: show full form preview -->
              <div class="space-y-4">
                <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Form Header</p>
                      <p class="text-sm text-slate-900 mt-2">{safePick(selectedRecordal.hist, 'oldValue.title', 'newValue.title') || '—'}</p>
                    </div>
                    <div class="grid gap-2 text-sm text-slate-700">
                      <div><span class="font-medium">File Number:</span> {safePick(selectedRecordal.hist, 'oldValue.fileNumber', 'newValue.fileNumber') || '—'}</div>
                      <div><span class="font-medium">File Type:</span> {safePick(selectedRecordal.hist, 'oldValue.fileType', 'newValue.fileType') || '—'}</div>
                      <div><span class="font-medium">Product Class:</span> {safePick(selectedRecordal.hist, 'oldValue.productClass', 'newValue.productClass') ?? '—'}</div>
                      <div><span class="font-medium">RTM Number:</span> {safePick(selectedRecordal.hist, 'oldValue.rtmNumber', 'newValue.rtmNumber') || '—'}</div>
                    </div>
                  </div>
                </section>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 class="font-semibold mb-3">Assignor</h4>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assignorName} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assignorEmail} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assignorPhone} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assignorNationality} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea class="input" bind:value={viewAssignmentData.assignorAddress}></textarea>
                  </section>

                  <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 class="font-semibold mb-3">Assignee / New Value</h4>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assigneeName} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assigneeEmail} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assigneePhone} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input class="input mb-2" bind:value={viewAssignmentData.assigneeNationality} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input class="input mb-2" readonly value={selectedRecordal.hist.assignment?.assigneeCountry || viewAssignmentData.assigneeCountry || ''} />
                    <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea class="input mb-2" bind:value={viewAssignmentData.assigneeAddress}></textarea>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Assignment</label>
                    <input class="input mb-2" readonly value={selectedRecordal.hist.assignment?.dateOfAssignment || viewAssignmentData.dateOfAssignment || ''} />
                  </section>
                </div>

                <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 class="font-semibold mb-3">Attachments</h4>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Deed (PDF)</label>
                      <input type="file" accept=".pdf" class="input mb-2" on:change={handleAssignmentDeedUpload} />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Authorization Letter (PDF)</label>
                      <input type="file" accept=".pdf" class="input mb-2" on:change={handleAssignmentLetterUpload} />
                    </div>
                  </div>
                  <div class="flex justify-end mt-2">
                    <Button size="sm" on:click={submitRecordalFromView}>Submit Application</Button>
                  </div>
                </section>
              </div>
            {/if}

            {#if selectedRecordal.applicationType === 7}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded">
                  <h4 class="font-semibold mb-2">Current Registered User (Old)</h4>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input class="input mb-2" readonly value={safePick(selectedRecordal.hist, 'oldValue.name','oldValue.oldValue.name','oldValue.party.name','oldValue.name','oldName') || filing.registeredUser?.name || ""} />
                </div>

                <div class="p-3 rounded">
                  <h4 class="font-semibold mb-2">New Registered User</h4>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input class="input mb-2" bind:value={viewRegisteredUserData.name} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input class="input mb-2" bind:value={viewRegisteredUserData.email} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input class="input mb-2" bind:value={viewRegisteredUserData.phone} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea class="input mb-2" bind:value={viewRegisteredUserData.address}></textarea>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF)</label>
                  <input type="file" accept=".pdf" class="input mb-2" on:change={handleRegisteredUserDocUpload} />
                  <div class="flex justify-end mt-2">
                    <Button size="sm" on:click={submitRecordalFromView}>Submit Application</Button>
                  </div>
                </div>
              </div>
            {/if}

            {#if selectedRecordal.applicationType === 8}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded">
                  <h4 class="font-semibold mb-2">Current Party (Old)</h4>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input class="input mb-2" readonly value={safePick(selectedRecordal.hist, 'oldValue.name','oldValue.oldValue.name','oldValue.party.name','oldValue.name','oldName') || filing.applicants?.[0]?.name || ""} />
                </div>
                <div class="p-3 rounded">
                  <h4 class="font-semibold mb-2">Merger Details (New)</h4>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input class="input mb-2" bind:value={viewMergerData.name} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input class="input mb-2" bind:value={viewMergerData.email} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date of Merger</label>
                  <input type="date" class="input mb-2" bind:value={viewMergerData.dateOfMerger} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea class="input mb-2" bind:value={viewMergerData.address}></textarea>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Deed (PDF)</label>
                  <input type="file" accept=".pdf" class="input mb-2" on:change={handleMergerDocUpload} />
                  <div class="flex justify-end mt-2">
                    <Button size="sm" on:click={submitRecordalFromView}>Submit Application</Button>
                  </div>
                </div>
              </div>
            {/if}

            {#if selectedRecordal.applicationType === 9}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded">
                  <h4 class="font-semibold mb-2">Current Name (Old)</h4>
                  <input class="input" readonly value={safePick(selectedRecordal.hist, 'oldValue.name','oldValue.oldValue.name','oldValue.party.name','oldValue.name','oldName') || filing.applicants?.[0]?.name || filing.correspondence?.name || ""} />
                </div>
                <div class="p-3 rounded">
                  <h4 class="font-semibold mb-2">New Name</h4>
                  <input class="input mb-2" bind:value={viewChangeOfNameData.newName} />
                  <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF)</label>
                  <input type="file" accept=".pdf" class="input mb-2" on:change={handleChangeOfNameDocUpload} />
                  <div class="flex justify-end mt-2">
                    <Button size="sm" on:click={submitRecordalFromView}>Submit Application</Button>
                  </div>
                </div>
              </div>
            {/if}

            {#if selectedRecordal.applicationType === 10}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded">
                  <h4 class="font-semibold mb-2">Current Address (Old)</h4>
                  <textarea class="input" readonly>{safePick(selectedRecordal.hist, 'oldValue.address','oldValue.oldValue.address','oldValue.party.address','oldValue.address','oldAddress') || filing.correspondence?.address || ""}</textarea>
                </div>
                <div class="p-3 rounded">
                  <h4 class="font-semibold mb-2">New Address</h4>
                  <textarea class="input mb-2" bind:value={viewChangeOfAddressData.newAddress}></textarea>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Supporting Document (PDF)</label>
                  <input type="file" accept=".pdf" class="input mb-2" on:change={handleChangeOfAddressDocUpload} />
                  <div class="flex justify-end mt-2">
                    <Button size="sm" on:click={submitRecordalFromView}>Submit Application</Button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="overflow-x-auto">
          <table
            class="min-w-full bg-white border border-slate-200 rounded-lg shadow-sm"
          >
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-semibold">#</th>
                <th class="px-4 py-2 text-left text-sm font-semibold"
                  >Application Date</th
                >
                <th class="px-4 py-2 text-left text-sm font-semibold">Status</th
                >
                <th class="px-4 py-2 text-left text-sm font-semibold"
                  >Payment ID</th
                >
                <th class="px-4 py-2 text-left text-sm font-semibold"
                  >Certificate Payment ID</th
                >
                <th class="px-4 py-2 text-left text-sm font-semibold"
                  >Actions</th
                >
              </tr>
            </thead>

            <tbody>
              {#each filing.applicationHistory as hist, index (hist.id)}
                <tr class="border-t hover:bg-slate-50 transition">
                  <td class="px-4 py-3 text-sm">{index + 1}</td>

                  <td class="px-4 py-3 text-sm">
                    {#if editingId === hist.id}
                      <input
                        type="date"
                        class="border rounded px-2 py-1 text-sm w-full"
                        bind:value={draft.applicationDate}
                      />
                    {:else}
                      {mapDateToString(hist.applicationDate) || "-"}
                    {/if}
                  </td>

                  <td class="px-4 py-3 text-sm">
                    {#if editingId === hist.id}
                      <select
                        class="border rounded px-2 py-1 text-sm w-full"
                        bind:value={draft.currentStatus}
                      >
                        {#each statusOptions as s}
                          <option value={s.value}
                            >{mapStatusToString(s.value)}</option
                          >
                        {/each}
                      </select>
                    {:else}
                      {mapStatusToString(hist.currentStatus)}
                    {/if}
                  </td>

                  <td class="px-4 py-3 text-sm">
                    {#if editingId === hist.id}
                      <input
                        type="text"
                        class="border rounded px-2 py-1 text-sm w-full"
                        placeholder="Payment ID"
                        bind:value={draft.paymentId}
                      />
                    {:else}
                      {hist.paymentId || "-"}
                    {/if}
                  </td>

                  <td class="px-4 py-3 text-sm">
                    {#if editingId === hist.id}
                      <input
                        type="text"
                        class="border rounded px-2 py-1 text-sm w-full"
                        placeholder="Certificate Payment ID"
                        bind:value={draft.certificatePaymentId}
                      />
                    {:else}
                      {hist.certificatePaymentId || "-"}
                    {/if}
                  </td>

                  <td class="px-4 py-3 text-sm">
                    {#if editingId === hist.id}
                      <div class="flex items-center gap-2">
                        <button
                          class="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1 rounded-md text-sm hover:bg-emerald-700 transition"
                          on:click={saveEdit}
                          title="Save"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                          Save
                        </button>

                        <button
                          class="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-3 py-1 rounded-md text-sm hover:bg-slate-50 transition"
                          on:click={cancelEdit}
                          title="Cancel"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          Cancel
                        </button>

                        <button
                          class="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 transition"
                          on:click={() => deleteApplicationHistory(hist)}
                          title="Delete"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    {:else}
                      <div class="flex items-center gap-2">
                        <button
                          class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                          on:click={() => openRecordalView(hist)}
                          title="View"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View
                        </button>

                        <button
                          class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                          on:click={() => startEdit(hist)}
                          title="Edit"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 00.707-.293l9.414-9.414a2 2 0 000-2.828l-3.586-3.586a2 2 0 00-2.828 0L4.707 13.293A1 1 0 004 14v4z"></path></svg>
                          Edit
                        </button>
                      </div>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Correspondence Information (Common for all file types) -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
        <details class="p-6 open">
          <summary
            class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            Correspondence Information
          </summary>
          <div class="bg-white p-4 rounded border border-slate-100 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  for="correspondence-name"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Name</label
                >
                <input
                  id="correspondence-name"
                  class="input"
                  bind:value={filing.correspondence.name}
                  placeholder="Contact Name"
                />
              </div>

              <div>
                <label
                  for="correspondence-email"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Email</label
                >
                <input
                  id="correspondence-email"
                  class="input"
                  bind:value={filing.correspondence.email}
                  placeholder="Email Address"
                />
              </div>

              <div>
                <label
                  for="correspondence-phone"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Phone</label
                >
                <input
                  id="correspondence-phone"
                  class="input"
                  bind:value={filing.correspondence.phone}
                  placeholder="Phone Number"
                />
              </div>

              <div>
                <label
                  for="correspondence-state"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >State</label
                >
                <input
                  id="correspondence-state"
                  class="input"
                  bind:value={filing.correspondence.state}
                  placeholder="State"
                />
              </div>

              <div>
                <label
                  for="correspondence-nationality"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Nationality</label
                >
                <input
                  id="correspondence-nationality"
                  class="input"
                  bind:value={filing.correspondence.nationality}
                  placeholder="Nationality"
                />
              </div>

              <div class="md:col-span-2">
                <label
                  for="correspondence-address"
                  class="block text-sm font-medium text-gray-700 mb-1"
                  >Address</label
                >
                <input
                  id="correspondence-address"
                  class="input"
                  bind:value={filing.correspondence.address}
                  placeholder="Full Address"
                />
              </div>
            </div>
          </div>
        </details>
      </div>
      <!-- File Status (Common for all file types) -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
        <details class="p-6 open">
          <summary
            class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#10B981"
                stroke-width="2"
                fill="#10B98120"
              />
              <path
                d="M9 12.5l1.8 1.8L15 10"
                stroke="#065F46"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            File Status
          </summary>

          <div class="bg-white p-4 rounded border border-slate-100 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Current File Status -->
              <div>
                <p class="mb-1">Current File Status:</p>
                <AppStatusTag value={filing.fileStatus} />
              </div>

              <!-- New File Status -->
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 mb-1"
                  for="new-status"
                >
                  New File Status
                </label>
                <select
                  class="border rounded px-2 py-1 w-full"
                  bind:value={statusUpdate.newStatus}
                >
                  {#each statusOptions as statuses}
                    <option value={statuses.value}>
                      {mapStatusToString(statuses.value)}
                    </option>
                  {/each}
                </select>
              </div>

              <!-- Reason -->
              <div class="md:col-span-2">
                <label
                  class="block text-sm font-medium text-gray-700 mb-1"
                  for="reason-status"
                >
                  Reason
                </label>
                <input
                  type="text"
                  class="border rounded px-2 py-1 w-full"
                  placeholder="Enter reason for status change"
                  bind:value={statusUpdate.reason}
                />
              </div>

              <!-- Update Button -->
              <div class="md:col-span-2 flex justify-end">
                <Button
                  size="sm"
                  on:click={() => changeFileStatus(statusUpdate)}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- PATENT SPECIFIC SECTIONS -->
      {#if filing.type === FileTypes.Patent}
        <!-- Inventors Information (Only for Patents) -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                ></path>
              </svg>
              Inventors Information
            </summary>
            <div class="grid gap-4 mt-4">
              {#each filing.inventors as inventor, index (inventor.id)}
                <div
                  class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <!-- Inventor heading with spacing and delete button -->
                  <div
                    class="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded-md"
                  >
                    <label
                      for="inventor-{index}-heading"
                      class="block text-base font-semibold text-slate-800"
                      >Inventor {index + 1}</label
                    >
                    <Button
                      variant="destructive"
                      size="sm"
                      on:click={() => deleteInventor(index)}
                      class="text-xs"
                    >
                      Delete
                    </Button>
                  </div>

                  <!-- Input fields -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="inventor-{index}-name"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Name</label
                      >
                      <input
                        id="inventor-{index}-name"
                        class="input"
                        bind:value={inventor.name}
                        placeholder="Full Name"
                      />
                    </div>

                    <div>
                      <label
                        for="inventor-{index}-nationality"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Nationality</label
                      >
                      <input
                        id="inventor-{index}-nationality"
                        class="input"
                        bind:value={inventor.country}
                        placeholder="Nationality"
                      />
                    </div>

                    <div>
                      <label
                        for="inventor-{index}-state"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >State</label
                      >
                      <input
                        id="inventor-{index}-state"
                        class="input"
                        bind:value={inventor.state}
                        placeholder="State"
                      />
                    </div>

                    <div>
                      <label
                        for="inventor-{index}-city"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >City</label
                      >
                      <input
                        id="inventor-{index}-city"
                        class="input"
                        bind:value={inventor.city}
                        placeholder="City"
                      />
                    </div>

                    <div>
                      <label
                        for="inventor-{index}-phone"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Phone</label
                      >
                      <input
                        id="inventor-{index}-phone"
                        class="input"
                        bind:value={inventor.phone}
                        placeholder="Phone Number"
                      />
                    </div>

                    <div>
                      <label
                        for="inventor-{index}-email"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Email</label
                      >
                      <input
                        id="inventor-{index}-email"
                        class="input"
                        bind:value={inventor.email}
                        placeholder="Email Address"
                      />
                    </div>

                    <div class="md:col-span-2">
                      <label
                        for="inventor-{index}-address"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Address</label
                      >
                      <input
                        id="inventor-{index}-address"
                        class="input"
                        bind:value={inventor.address}
                        placeholder="Full Address"
                      />
                    </div>
                  </div>
                </div>
              {/each}

              <!-- Add New Inventor Button -->
              <Button
                variant="outline"
                on:click={addInventor}
                class="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                + Add New Inventor
              </Button>
            </div>
          </details>
        </div>
        <!-- </Button> -->
        <!-- </div> -->
        <!-- </details> -->

        {#if filing.patentType === 0 || filing.patentType === 2}
          <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
            <details class="p-6 open">
              <summary
                class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  ></path>
                </svg>
                First Priority Information
              </summary>
              <div class="grid gap-4 mt-4">
                {#if filing.firstPriorityInfo}
                  {#each filing.firstPriorityInfo as priority, index (priority.id)}
                    <div
                      class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        class="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-md"
                      >
                        <label
                          for="first-priority-{index}-heading"
                          class="text-base font-semibold text-slate-800"
                          >Priority {index + 1}</label
                        >
                        <Button
                          variant="destructive"
                          size="sm"
                          on:click={() => deleteFirstPriorityInfo(index)}
                          class="text-xs"
                        >
                          Delete
                        </Button>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            for="first-priority-{index}-country"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Country</label
                          >
                          <input
                            id="first-priority-{index}-country"
                            class="input"
                            bind:value={priority.country}
                            placeholder="Country"
                          />
                        </div>

                        <div>
                          <label
                            for="first-priority-{index}-number"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Application Number</label
                          >
                          <input
                            id="first-priority-{index}-number"
                            class="input"
                            bind:value={priority.number}
                            placeholder="Application Number"
                          />
                        </div>

                        <div class="md:col-span-2">
                          <label
                            for="first-priority-{index}-date"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Filing Date</label
                          >
                          <input
                            id="first-priority-{index}-date"
                            class="input"
                            type="date"
                            bind:value={priority.date}
                            placeholder="Filing Date"
                          />
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}

                <!-- Add New First Priority Button -->
                <Button
                  variant="outline"
                  on:click={addFirstPriorityInfo}
                  class="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  + Add New First Priority
                </Button>
              </div>
            </details>
          </div>
        {/if}

        <!-- Priority Info Section -->
        <!-- Show for all patent types, but with different titles -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              {#if filing.patentType === 1}
                Priority Information
              {:else}
                Additional Priority Information
              {/if}
            </summary>
            <div class="grid gap-4 mt-4">
              {#each filing.priorityInfo as priority, index (priority.id)}
                <div
                  class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    class="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-md"
                  >
                    <label
                      for="priority-{index}-name"
                      class="text-base font-semibold text-slate-800"
                      >Priority {index + 1}</label
                    >
                    <Button
                      variant="destructive"
                      size="sm"
                      on:click={() => deletePriorityInfo(index)}
                      class="text-xs"
                    >
                      Delete
                    </Button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="priority-{index}-country"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Country</label
                      >
                      <input
                        id="priority-{index}-country"
                        class="input"
                        bind:value={priority.country}
                        placeholder="Country"
                      />
                    </div>

                    <div>
                      <label
                        for="priority-{index}-number"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Application Number</label
                      >
                      <input
                        id="priority-{index}-number"
                        class="input"
                        bind:value={priority.number}
                        placeholder="Application Number"
                      />
                    </div>

                    <div class="md:col-span-2">
                      <label
                        for="priority-{index}-date"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Filing Date</label
                      >
                      <input
                        id="priority-{index}-date"
                        class="input"
                        type="date"
                        bind:value={priority.date}
                        placeholder="Filing Date"
                      />
                    </div>
                  </div>
                </div>
              {/each}

              <!-- Add New Priority Info Button -->
              <Button
                variant="outline"
                on:click={addPriorityInfo}
                class="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                + Add New Priority Info
              </Button>
            </div>
          </details>
        </div>
        <!-- on:click={addPriorityInfo}
              class="mt-2"
            >
              + Add New Priority Info
            </Button>
          </div>
        </details> -->
      {/if}

      <!-- DESIGN SPECIFIC SECTIONS -->
      {#if filing.type === FileTypes.Design}
        <!-- Design Creators (Only for Designs) -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              Design Creators
            </summary>
            <div class="grid gap-4 mt-4">
              {#each filing.designCreators as creator, index (creator.id)}
                <div
                  class="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded-md">
                    <label
                      for="creator-{index}-heading"
                      class="text-base font-semibold text-slate-800"
                      >Creator {index + 1}</label
                    >
                    <Button
                      variant="destructive"
                      size="sm"
                      on:click={() => deleteDesignCreator(index)}
                      class="text-xs"
                    >
                      Delete
                    </Button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="creator-{index}-name"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Name</label
                      >
                      <input
                        id="creator-{index}-name"
                        class="input"
                        bind:value={creator.name}
                        placeholder="Full Name"
                      />
                    </div>

                    <div>
                      <label
                        for="creator-{index}-country"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Country</label
                      >
                      <input
                        id="creator-{index}-country"
                        class="input"
                        bind:value={creator.country}
                        placeholder="Country"
                      />
                    </div>

                    <div>
                      <label
                        for="creator-{index}-phone"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Phone Number</label
                      >
                      <input
                        id="creator-{index}-phone"
                        class="input"
                        bind:value={creator.phone}
                        placeholder="Phone Number"
                      />
                    </div>

                    <div>
                      <label
                        for="creator-{index}-email"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Email</label
                      >
                      <input
                        id="creator-{index}-email"
                        class="input"
                        bind:value={creator.email}
                        placeholder="Email Address"
                      />
                    </div>

                    <div class="md:col-span-2">
                      <label
                        for="creator-{index}-address"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Address</label
                      >
                      <input
                        id="creator-{index}-address"
                        class="input"
                        bind:value={creator.address}
                        placeholder="Full Address"
                      />
                    </div>
                  </div>
                </div>
              {/each}

              <!-- Add New Creator Button -->
              <!-- <Button 
                variant="outline" 
                on:click={addDesignCreator}
                class="mt-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                + Add New Creator
              </Button> -->
            </div>
          </details>
        </div>
      {/if}

      <!-- ATTACHMENTS SECTIONS -->
      <!-- Patent Attachments (Only for Patents) -->
      {#if filing.type === FileTypes.Patent}
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
              Attachments (Patent)
            </summary>
            <div class="bg-white p-4 rounded border border-slate-100 mt-4">
              <p class="text-sm text-gray-600 mb-4">
                POA, CS, Patent Drawing, Other Supporting Documents
              </p>

              <!-- Existing Attachments -->
              <div class="space-y-4">
                <h4 class="font-semibold text-sm">Existing Attachments</h4>
                {#each filing.attachments as attachment, index (attachment.id || index)}
                  <div
                    class="border border-slate-200 p-4 rounded-lg space-y-3 bg-slate-50"
                  >
                    <div class="flex justify-between items-center">
                      <label
                        for="patent-attachment-{index}-name"
                        class="text-sm font-medium text-slate-800"
                        >Attachment Category {index + 1}</label
                      >
                      <Button
                        variant="destructive"
                        size="sm"
                        on:click={() => deleteAttachmentCategory(index)}
                        class="text-xs"
                      >
                        Delete Category
                      </Button>
                    </div>

                    <select
                      id="patent-attachment-{index}-name"
                      class="input"
                      bind:value={attachment.name}
                    >
                      <option value="">-- Select Attachment Type --</option>
                      {#each patentAttachmentOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                      {#if attachment.name && !patentAttachmentOptions.some((o) => o.value === attachment.name)}
                        <option value={attachment.name}>{attachment.name} (existing)</option>
                      {/if}
                    </select>

                    <!-- Existing URLs -->
                    <div class="space-y-2">
                      <label for="patent-attachment-{index}-url" class="text-xs font-medium text-gray-600"
                        >Existing Files:</label
                      >
                      {#each attachment.url as link, linkIndex}
                        <div class="flex items-center gap-2">
                          <input
                            id="patent-attachment-{index}-url-{linkIndex}"
                            class="input flex-1"
                            bind:value={attachment.url[linkIndex]}
                            placeholder="Attachment URL"
                            readonly
                          />

                          <!-- View Button with Eye Icon -->
                          <button
                            type="button"
                            class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                            on:click={() =>
                              window.open(attachment.url[linkIndex], "_blank")}
                            title="View attachment"
                          >
                            <svg
                              class="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                          </button>

                          <Button
                            variant="outline"
                            size="sm"
                            on:click={() =>
                              removeAttachmentUrl(index, linkIndex)}
                            class="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      {/each}
                    </div>

                    <!-- File Upload for this category -->
                    <div class="space-y-2">
                      <label
                        for="patent-attachment-{index}-new-files"
                        class="text-xs font-medium text-gray-600"
                        >Add New Files:</label
                      >
                      <input
                        id="patent-attachment-{index}-new-files"
                        type="file"
                        multiple
                        class="input"
                        on:change={(e) => onAttachmentFileChange(e, attachment.name)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                {/each}

                <!-- Add New Attachment Category Button -->
                <Button
                  variant="outline"
                  on:click={addAttachmentCategory}
                  class="mt-2"
                >
                  + Add New Attachment Category
                </Button>
              </div>

              <!-- New Attachments Preview -->
              {#if newAttachments.length > 0}
                <div class="space-y-4 mt-4">
                  <h4 class="font-semibold text-sm">New Files to Upload</h4>
                  {#each newAttachments as newAttachment, index}
                    <div class="border p-3 rounded space-y-2 bg-green-50">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium"
                          >Category: {newAttachment.Name}</span
                        >
                        <Button
                          variant="outline"
                          size="sm"
                          on:click={() => removeNewAttachment(index)}
                          class="text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                      <p class="text-xs text-gray-600">
                        File: {newAttachment.fileName}
                      </p>
                      <p class="text-xs text-gray-600">
                        Type: {newAttachment.contentType}
                      </p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </details>
        </div>
      {/if}

      <!-- Trademark Attachments (Only for Trademarks) -->
      {#if filing.type === FileTypes.Trademark}
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
              Attachments (Trademark)
            </summary>
            <div class="bg-white p-4 rounded border border-slate-100 mt-4">
              <p class="text-sm text-gray-600 mb-4">
                POA, Proposed Trademark Representation, Supporting Document 1,
                Supporting Document 2
              </p>

              <!-- Existing Attachments -->
              <div class="space-y-4">
                <h4 class="font-semibold text-sm">Existing Attachments</h4>
                {#each filing.attachments as attachment, index (attachment.id || index)}
                  <div class="border p-3 rounded space-y-2 bg-blue-50">
                    <div class="flex justify-between items-center">
                      <label
                        for="trademark-attachment-{index}-name"
                        class="text-sm font-medium"
                        >Attachment Category {index + 1}</label
                      >
                      <Button
                        variant="destructive"
                        size="sm"
                        on:click={() => deleteAttachmentCategory(index)}
                        class="text-xs"
                      >
                        Delete Category
                      </Button>
                    </div>

                    <select
                      id="trademark-attachment-{index}-name"
                      class="input"
                      bind:value={attachment.name}
                    >
                      <option value="">-- Select Attachment Type --</option>
                      {#each trademarkAttachmentOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                      {#if attachment.name && !trademarkAttachmentOptions.some((o) => o.value === attachment.name)}
                        <option value={attachment.name}>{attachment.name} (existing)</option>
                      {/if}
                    </select>

                    <!-- Existing URLs -->
                    <div class="space-y-2">
                      <span class="text-xs font-medium text-gray-600"
                        >Existing Files:</span
                      >
                      {#each attachment.url as link, linkIndex}
                        <div class="flex items-center gap-2">
                          <input
                            id="trademark-attachment-{index}-url-{linkIndex}"
                            class="input flex-1"
                            bind:value={attachment.url[linkIndex]}
                            placeholder="Attachment URL"
                            readonly
                          />

                          <!-- View Button with Eye Icon -->
                          <button
                            type="button"
                            class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                            on:click={() =>
                              window.open(attachment.url[linkIndex], "_blank")}
                            title="View attachment"
                          >
                            <svg
                              class="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                          </button>

                          <Button
                            variant="outline"
                            size="sm"
                            on:click={() =>
                              removeAttachmentUrl(index, linkIndex)}
                            class="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      {/each}
                    </div>

                    <!-- File Upload for this category -->
                    <div class="space-y-2">
                      <label
                        for="trademark-attachment-{index}-new-files"
                        class="text-xs font-medium text-gray-600"
                        >Add New Files:</label
                      >
                      <input
                        id="trademark-attachment-{index}-new-files"
                        type="file"
                        multiple
                        class="input"
                        on:change={(e) => onAttachmentFileChange(e, attachment.name)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                {/each}

                <!-- Add New Attachment Category Button -->
                <Button
                  variant="outline"
                  on:click={addAttachmentCategory}
                  class="mt-2"
                >
                  + Add New Attachment Category
                </Button>
              </div>

              <!-- New Attachments Preview -->
              {#if newAttachments.length > 0}
                <div class="space-y-4 mt-4">
                  <h4 class="font-semibold text-sm">New Files to Upload</h4>
                  {#each newAttachments as newAttachment, index}
                    <div class="border p-3 rounded space-y-2 bg-green-50">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium"
                          >Category: {newAttachment.Name}</span
                        >
                        <Button
                          variant="outline"
                          size="sm"
                          on:click={() => removeNewAttachment(index)}
                          class="text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                      <p class="text-xs text-gray-600">
                        File: {newAttachment.fileName}
                      </p>
                      <p class="text-xs text-gray-600">
                        Type: {newAttachment.contentType}
                      </p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </details>
        </div>
      {/if}

      <!-- Design Attachments (Only for Designs) -->
      {#if filing.type === FileTypes.Design}
        <div class="bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
          <details class="p-6 open">
            <summary
              class="text-lg font-semibold cursor-pointer text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
              Attachments (Design)
            </summary>
            <div class="bg-white p-4 rounded border border-slate-100 mt-4">
              <p class="text-sm text-gray-600 mb-4">
                POA, Novelty Statement, Design Representations (4 images max),
                Priority Documents
              </p>

              <!-- Existing Attachments -->
              <div class="space-y-4">
                <h4 class="font-semibold text-sm">Existing Attachments</h4>
                {#each filing.attachments as attachment, index (attachment.id || index)}
                  <div class="border p-3 rounded space-y-2 bg-blue-50">
                    <div class="flex justify-between items-center">
                      <label
                        for="design-attachment-{index}-name"
                        class="text-sm font-medium"
                        >Attachment Category {index + 1}</label
                      >
                      <Button
                        variant="destructive"
                        size="sm"
                        on:click={() => deleteAttachmentCategory(index)}
                        class="text-xs"
                      >
                        Delete Category
                      </Button>
                    </div>

                    <select
                      id="design-attachment-{index}-name"
                      class="input"
                      bind:value={attachment.name}
                    >
                      <option value="">-- Select Attachment Type --</option>
                      {#each designAttachmentOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                      {#if attachment.name && !designAttachmentOptions.some((o) => o.value === attachment.name)}
                        <option value={attachment.name}>{attachment.name} (existing)</option>
                      {/if}
                    </select>

                    <!-- Existing URLs -->
                    <div class="space-y-2">
                      <span class="text-xs font-medium text-gray-600"
                        >Existing Files:</span
                      >
                      {#each attachment.url as link, linkIndex}
                        <div class="flex items-center gap-2">
                          <input
                            id="design-attachment-{index}-url-{linkIndex}"
                            class="input flex-1"
                            bind:value={attachment.url[linkIndex]}
                            placeholder="Attachment URL"
                            readonly
                          />

                          <!-- View Button with Eye Icon -->
                          <button
                            type="button"
                            class="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                            on:click={() =>
                              window.open(attachment.url[linkIndex], "_blank")}
                            title="View attachment"
                          >
                            <svg
                              class="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                          </button>

                          <Button
                            variant="outline"
                            size="sm"
                            on:click={() =>
                              removeAttachmentUrl(index, linkIndex)}
                            class="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      {/each}
                    </div>

                    <!-- File Upload for this category -->
                    <div class="space-y-2">
                      <label
                        for="design-attachment-{index}-new-files"
                        class="text-xs font-medium text-gray-600"
                        >Add New Files:</label
                      >
                      <input
                        id="design-attachment-{index}-new-files"
                        type="file"
                        multiple
                        class="input"
                        on:change={(e) => onAttachmentFileChange(e, attachment.name)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                {/each}

                <!-- Add New Attachment Category Button -->
                <Button
                  variant="outline"
                  on:click={addAttachmentCategory}
                  class="mt-2"
                >
                  + Add New Attachment Category
                </Button>
              </div>

              <!-- New Attachments Preview -->
              {#if newAttachments.length > 0}
                <div class="space-y-4 mt-4">
                  <h4 class="font-semibold text-sm">New Files to Upload</h4>
                  {#each newAttachments as newAttachment, index}
                    <div class="border p-3 rounded space-y-2 bg-green-50">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium"
                          >Category: {newAttachment.Name}</span
                        >
                        <Button
                          variant="outline"
                          size="sm"
                          on:click={() => removeNewAttachment(index)}
                          class="text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                      <p class="text-xs text-gray-600">
                        File: {newAttachment.fileName}
                      </p>
                      <p class="text-xs text-gray-600">
                        Type: {newAttachment.contentType}
                      </p>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </details>
        </div>
      {/if}

      <!-- Save Changes Button -->
      <Button class="mt-4" on:click={saveChanges}>Save</Button>
    </div>
  {/if}
</div>

{#if showSuccessModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded shadow-md text-center w-full max-w-sm">
      <h2 class="text-xl font-semibold text-green-800">Success!</h2>
      <p class="mt-2">File updated successfully.</p>
      <button
        class="mt-4 bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700"
        on:click={() => (showSuccessModal = false)}
      >
        Close
      </button>
    </div>
  </div>
{/if}

{#if showFailureModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded shadow-md text-center w-full max-w-sm">
      <h2 class="text-xl font-semibold text-red-600">Update Failed</h2>
      <p class="mt-2">Something went wrong. Please try again.</p>
      <button
        class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        on:click={() => (showFailureModal = false)}
      >
        Close
      </button>
    </div>
  </div>
{/if}

<style>
  .input {
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    padding: 0.5rem;
    width: 100%;
  }

  details > summary {
    outline: none;
  }

  details[open] > summary {
    font-weight: bold;
  }
</style>
