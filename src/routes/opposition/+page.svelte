<script lang="ts">
  import { onMount } from "svelte";
  import coatOfArms from "$lib/assets/logo.png";
  import cldLogo from "$lib/assets/cld.png";
  import ministry from "$lib/assets/ministry.png";
  import { baseURL } from "$lib/helpers";
  import { mapStatusToString } from "../home/components/dashboardutils";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import { countriesMap } from "$lib/constants";
  import { goto } from "$app/navigation";
  import { Toaster, toast } from "svelte-sonner";
  import { page } from "$app/stores";
  import { loggedInUser } from "$lib/store";
  import { loggedInToken } from "$lib/store";
  interface FileInfo {
    fileNumber: string;
    fileTitle: string;
    class: string;
    representationUrl: string;
    applicantName: string;
    opposerName: string;
    paymentId: string;
    cost: string;
    fileId: string;
    oppositionId: string;
    status: number | string;
  }
  type OppositionFormData = {
    fileNumber: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    nationality: string;
    reason: string;
    paymentId: string;
    fileId: string;
    attachments?: File[];
    fileTitle?: string;
  };
  interface FormData {
    fileNumber: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    nationality: string;
    reason: string;
    attachments: FileList | null;
    paymentId: string;
    fileId: string;
    fileTitle?: string;
  }

  let currentStep: "landing" | "search" | "results" | "form" | "cs-search" | "cs-results" | "cs-form" | "cs-invoice" | "sd-role" | "sd-search" | "sd-results" | "sd-form" | "sd-invoice" = "landing";
  let searchInput: string = "";
  let fileInfo: FileInfo | null = null;

  // Counter Statement state
  let csSearchInput: string = "";
  let csFileInfo: FileInfo | null = null;
  let csStatementText: string = "";
  let csAttachments: File[] = [];
  let csFileInputElement: HTMLInputElement;
  let csIsLoading: boolean = false;
  let csIsSubmitting: boolean = false;
  let csRRR: string = "";
  let csInvoice: {
    fileNumber: string;
    fileTitle: string;
    applicantName: string;
    class: string;
    representationUrl: string;
    cost: string;
    serviceFee: string;
    paymentId: string;
  } | null = null;
  const CS_GOVT_FEE = 8000;
  const CS_SERVICE_FEE = 3500;
  const CS_TOTAL = CS_GOVT_FEE + CS_SERVICE_FEE;

  // Statutory Declaration state
  let sdRole: "opposer" | "applicant" | null = null;
  let sdSearchInput: string = "";
  let sdFileInfo: FileInfo | null = null;
  let sdOppositions: any[] = []; // For applicant flow: list of oppositions
  let sdComment: string = "";
  let sdAttachments: File[] = [];
  let sdFileInputElement: HTMLInputElement;
  let sdIsLoading: boolean = false;
  let sdIsSubmitting: boolean = false;
  let sdRRR: string = "";
  let sdInvoice: {
    fileNumber: string;
    fileTitle: string;
    applicantName: string;
    class: string;
    representationUrl: string;
    cost: string;
    serviceFee: string;
    paymentId: string;
    opposerName: string;
    oppositionId: string;
  } | null = null;
  const SD_GOVT_FEE = 8000;
  const SD_SERVICE_FEE = 3500;
  const SD_TOTAL = SD_GOVT_FEE + SD_SERVICE_FEE;
  let formData: FormData = {
    fileNumber: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    nationality: "",
    reason: "",
    attachments: null,
    paymentId: "",
    fileId: "",
    fileTitle: "",
  };
  let pubFile: string | null = null;
  let isLoading: boolean = false;
  let fileInputElement: HTMLInputElement;
  onMount(() => {
    const urlFileId = $page.url.searchParams.get("fileId");
    const urlStep = $page.url.searchParams.get("step");
    const urlFileNumber = $page.url.searchParams.get("fileNumber");
    pubFile = urlFileId;

    if (urlStep === "counterstatement" && urlFileNumber && urlFileNumber !== "undefined") {
      // Auto-trigger counter statement — pre-fill input and search immediately
      csSearchInput = urlFileNumber;
      currentStep = "cs-search";
      const urlOppositionId = $page.url.searchParams.get("oppositionId");
      handleCSSearchWithNumber(urlFileNumber, urlOppositionId ?? undefined);
    } else if (urlStep === "statutorydeclaration") {
      // Auto-trigger statutory declaration — pre-fill and search immediately
      const urlOppositionId = $page.url.searchParams.get("oppositionId");
      const urlRole = $page.url.searchParams.get("role") ?? "opposer";
      sdRole = urlRole;
      if (urlOppositionId) {
        sdSearchInput = urlOppositionId;
        currentStep = "sd-search";
        handleSDSearchWithId(urlOppositionId);
      } else if (urlFileNumber) {
        sdSearchInput = urlFileNumber;
        currentStep = "sd-search";
        handleSDSearchWithId(urlFileNumber);
      }
    } else if (urlFileId) {
      // auto trigger search with fileId — skip landing, go straight to search
      currentStep = "search";
      handleSearch(urlFileId);
    }
  });

  async function handleCSSearchWithNumber(fileNumber: string, overrideOppositionId?: string) {
    csIsLoading = true;
    toast.loading("Fetching File Information", { description: "Please hold on...", duration: 1000 });
    try {
      const response = await fetch(
        `${baseURL}/api/opposition/CounterStatementSearch?fileNumber=${fileNumber.trim()}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const foundFile = await response.json();
      if (response.ok) {
        const d = foundFile.data ?? foundFile;
        csFileInfo = {
          fileNumber: d.fileNumber,
          fileTitle: d.fileName ?? d.fileTitle,
          applicantName: d.fileOwner ?? d.applicantName,
          class: d.trademarkClass?.toString() ?? d.class,
          representationUrl: d.representationUrl && d.representationUrl !== "null" ? d.representationUrl : "",
          paymentId: d.paymentId ?? "",
          cost: d.cost ?? "",
          fileId: d.fileId ?? "",
          oppositionId: overrideOppositionId ?? d.oppositionId ?? "",
        };
        currentStep = "cs-results";
      } else {
        toast.error("File not found or is not currently Opposed.");
      }
    } catch (err) {
      toast.error("File not found or is not currently Opposed.");
    } finally {
      csIsLoading = false;
    }
  }

  async function handleSDSearchWithId(input: string) {
    sdIsLoading = true;
    toast.loading("Fetching Opposition Details", { description: "Please hold on...", duration: 1000 });
    try {
      // Try oppositionId first
      let queryParam = `oppositionId=${encodeURIComponent(input.toLowerCase())}`;
      let response = await fetch(
        `${baseURL}/api/opposition/getOppositionDetail?${queryParam}`,
        { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${$loggedInToken}` } }
      );
      if (!response.ok) {
        // Fallback to fileNumber
        response = await fetch(
          `${baseURL}/api/opposition/getOppositionDetail?fileNumber=${encodeURIComponent(input.trim())}`,
          { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${$loggedInToken}` } }
        );
      }
      if (response.ok) {
        const result = await response.json();
        const raw = result.opposition ?? result.data ?? result;
        const d = Array.isArray(raw) ? raw[0] : raw;
        if (d) {
          sdFileInfo = {
            fileNumber: d.fileNumber ?? "",
            fileTitle: d.fileName ?? d.fileTitle ?? d.title ?? "",
            applicantName: d.fileOwner ?? d.applicantName ?? "",
            opposerName: d.opposerName ?? d.name ?? "",
            class: d.trademarkClass?.toString() ?? d.class?.toString() ?? "",
            representationUrl: d.representationUrl && d.representationUrl !== "null" ? d.representationUrl : "",
            paymentId: d.paymentId ?? "",
            cost: d.cost ?? "",
            fileId: d.fileId ?? "",
            oppositionId: d.id ?? d.oppositionId ?? input,
            status: d.status ?? d.oppositionStatus ?? "",
          };
          sdOppositions = [];
          currentStep = "sd-form";
        } else {
          toast.error("Opposition not found.");
          currentStep = "sd-search";
        }
      } else {
        toast.error("Opposition not found.");
        currentStep = "sd-search";
      }
    } catch (err) {
      toast.error("Failed to fetch opposition details.");
      currentStep = "sd-search";
    } finally {
      sdIsLoading = false;
    }
  }

  async function handleSearch(fileNumber: string) {
    isLoading = true;
    const query = fileNumber;

    // if(!fileNumber){
    // 	query = searchInput.trim();
    // }
    console.log("Searching for file number:", query);
    if (!query) {
      alert("Please enter a file number.");
      isLoading = false;
      return;
    }
    toast.loading("Fetching File Information", {
      description: "Please hold on, this might take a while",
      duration: 1000,
    });
    try {
      const response = await fetch(
        `${baseURL}/api/opposition/OppositionSearch?fileNumber=${query}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const foundFile = await response.json();
      if (response.ok) {
        localStorage.setItem(
          "fileData",
          JSON.stringify({ fileInfo: foundFile }),
        );

        fileInfo = foundFile;
        currentStep = "results";
      } else {
        toast.error("Sorry, Only Files in Publication can be opposed.");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Sorry, Only Files in Publication can be opposed.");
    } finally {
      isLoading = false;
    }
  }

  function handleProceed() {
    currentStep = "form";
    // Set the file number in the form data
    if (fileInfo) {
      formData.fileNumber = fileInfo.fileNumber;
      formData.paymentId = fileInfo.paymentId;
      formData.fileId = fileInfo.fileId;
      formData.fileTitle = fileInfo.fileTitle;
    }
    console.log(formData);
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      formData.attachments = target.files;
    }
  }
  async function handlePayment() {
    if (fileInfo?.cost && fileInfo.paymentId) {

      await goto(
        `/payment/?type=opposition&rrr=${fileInfo.paymentId}`,
      );
    }
  }

  async function handleSubmit() {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.reason.trim()
    ) {
      alert("Please fill in all required fields (Name, Email, and Reason).");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    isLoading = true;

    // Build FormData for submission
    const submitData = new FormData();
    submitData.append("FileNumber", formData.fileNumber);
    submitData.append("Name", formData.name);
    submitData.append("Phone", formData.phone);
    submitData.append("Email", formData.email);
    submitData.append("Address", formData.address);
    submitData.append("Nationality", formData.nationality);
    submitData.append("Reason", formData.reason);
    submitData.append("PaymentId", formData.paymentId);
    submitData.append("FileId", formData.fileId);
    submitData.append("FileTitle", formData.fileTitle ?? "");
    submitData.append("UserId", $loggedInUser?.id ?? "");

    // Add supporting documents (for API only)
    if (formData.attachments) {
      for (let i = 0; i < formData.attachments.length; i++) {
        submitData.append("SupportingDocs", formData.attachments[i]);
      }
    }

    // Save only serializable data to sessionStorage
    const serializableData: Omit<OppositionFormData, "attachments"> = {
      fileNumber: formData.fileNumber,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      nationality: formData.nationality,
      reason: formData.reason,
      paymentId: formData.paymentId,
      fileId: formData.fileId,
    };
    localStorage.setItem("oppositionData", JSON.stringify(serializableData));

    try {
      const response = await fetch(`${baseURL}/api/opposition/NewOpposition`, {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        toast.success("Opposition submitted successfully!", {
          description: "Redirecting to payment...",
        });
        await handlePayment();
      } else {
        const error = await response.text();
        toast.error("Failed to submit opposition", { description: `${error}` });

      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit opposition", { description: `${error}` });
    }

    isLoading = false;
  }

  function goBack() {
    if (currentStep === "search") {
      currentStep = "landing";
    } else if (currentStep === "results") {
      currentStep = "search";
    } else if (currentStep === "form") {
      currentStep = "results";
    } else if (currentStep === "cs-search") {
      currentStep = "landing";
    } else if (currentStep === "cs-results") {
      currentStep = "cs-search";
    } else if (currentStep === "cs-form") {
      currentStep = "cs-results";
    } else if (currentStep === "cs-invoice") {
      currentStep = "cs-form";
    } else if (currentStep === "sd-role") {
      currentStep = "landing";
    } else if (currentStep === "sd-search") {
      currentStep = "sd-role";
    } else if (currentStep === "sd-results") {
      currentStep = "sd-search";
    } else if (currentStep === "sd-form") {
      if (sdRole === "applicant" && sdOppositions.length > 0) {
        currentStep = "sd-results";
      } else {
        currentStep = "sd-results";
      }
    } else if (currentStep === "sd-invoice") {
      currentStep = "sd-form";
    }
  }

  async function handleCSSearch() {
    if (!csSearchInput.trim()) {
      toast.error("Please enter a file number.");
      return;
    }
    csIsLoading = true;
    toast.loading("Fetching File Information", { description: "Please hold on...", duration: 1000 });
    try {
      const response = await fetch(
        `${baseURL}/api/opposition/CounterStatementSearch?fileNumber=${csSearchInput.trim()}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const foundFile = await response.json();
      if (response.ok) {
        const d = foundFile.data ?? foundFile;
        csFileInfo = {
          fileNumber: d.fileNumber,
          fileTitle: d.fileName ?? d.fileTitle,
          applicantName: d.fileOwner ?? d.applicantName,
          class: d.trademarkClass?.toString() ?? d.class,
          representationUrl: d.representationUrl && d.representationUrl !== "null" ? d.representationUrl : "",
          paymentId: d.paymentId ?? "",
          cost: d.cost ?? "",
          fileId: d.fileId ?? "",
          oppositionId: d.oppositionId ?? "",
        };
        currentStep = "cs-results";
      } else {
        toast.error("File not found or is not currently Opposed.");
      }
    } catch (err) {
      toast.error("File not found or is not currently Opposed.");
    } finally {
      csIsLoading = false;
    }
  }

  function handleCSFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      csAttachments = Array.from(target.files);
    }
  }

  async function handleCSSubmit() {
    if (!csStatementText.trim()) {
      toast.error("Please fill in the Counter Statement.");
      return;
    }
    csIsSubmitting = true;
    try {
      const submitData = new FormData();
      submitData.append("FileNumber", csFileInfo?.fileNumber ?? "");
      submitData.append("FileId", csFileInfo?.fileId ?? "");
      submitData.append("OppositionId", csFileInfo?.oppositionId ?? "");
      submitData.append("FileTitle", csFileInfo?.fileTitle ?? "");
      submitData.append("CounterStatement", csStatementText);
      submitData.append("UserId", $loggedInUser?.id ?? "");
      for (const file of csAttachments) {
        submitData.append("SupportingDocs", file);
      }
      console.log("Submitting CS:", {
        FileNumber: csFileInfo?.fileNumber,
        FileId: csFileInfo?.fileId,
        OppositionId: csFileInfo?.oppositionId,
        UserId: $loggedInUser?.id,
        CounterStatement: csStatementText.substring(0, 50),
      });
      const response = await fetch(`${baseURL}/api/opposition/NewCounterStatement`, {
        method: "POST",
        body: submitData,
      });
      const result = await response.json();
      console.log("NewCounterStatement response:", response.status, JSON.stringify(result));
      if (response.ok && (result.success !== false)) {
        const d = result.data ?? result;
        csRRR = d.PaymentId ?? d.paymentId ?? d.RRR ?? d.rrr ?? "";
        csInvoice = {
          fileNumber: d.FileNumber ?? d.fileNumber ?? "",
          fileTitle: d.FileTitle ?? d.fileTitle ?? "",
          applicantName: d.ApplicantName ?? d.applicantName ?? "",
          class: d.Class?.toString() ?? d.class?.toString() ?? "",
          representationUrl: (d.RepresentationUrl ?? d.representationUrl ?? "") || "",
          cost: d.Cost ?? d.cost ?? "",
          serviceFee: d.ServiceFee ?? d.serviceFee ?? "",
          paymentId: csRRR,
        };
        // Save payload so /opposition/paid knows to call UpdateCounterStatementPayment
        sessionStorage.setItem("counterStatementPayload", JSON.stringify({
          paymentId: csRRR,
          fileNumber: csInvoice.fileNumber,
          fileTitle: csInvoice.fileTitle,
          applicantName: csInvoice.applicantName,
        }));
        const govtFee = Number(csInvoice.cost) || CS_GOVT_FEE;
        const svcFee = Number(csInvoice.serviceFee) || CS_SERVICE_FEE;
        const total = govtFee + svcFee;
        await goto(`/payment/?type=counterstatement&rrr=${csRRR}&amount=${total}&fileId=${csFileInfo?.fileId}&name=${encodeURIComponent(csInvoice.applicantName)}&fileNumber=${encodeURIComponent(csInvoice.fileNumber)}`);
      } else {
        const msg = result.message ?? result.error ?? JSON.stringify(result);
        toast.error("Failed to submit counter statement", { description: msg });
      }
    } catch (err) {
      toast.error("Failed to submit counter statement", { description: `${err}` });
    } finally {
      csIsSubmitting = false;
    }
  }

  async function handleCSPayment() {
    if (!csInvoice?.paymentId) { toast.error("Payment reference missing."); return; }
    const rrr = csInvoice.paymentId;
    const govtFee = Number(csInvoice.cost) || CS_GOVT_FEE;
    const svcFee = Number(csInvoice.serviceFee) || CS_SERVICE_FEE;
    const total = govtFee + svcFee;
    sessionStorage.setItem("counterStatementPayload", JSON.stringify({
      paymentId: rrr,
      fileNumber: csInvoice.fileNumber,
      fileTitle: csInvoice.fileTitle,
      amount: total,
    }));
    await goto(`/payment/?type=counterstatement&rrr=${rrr}&amount=${total}&fileId=${csFileInfo?.fileId}&name=${encodeURIComponent(csInvoice?.applicantName ?? '')}&fileNumber=${encodeURIComponent(csInvoice?.fileNumber ?? '')}`);
  }

  // ======== Statutory Declaration Functions ========

  async function handleSDSearchOpposer() {
    if (!sdSearchInput.trim()) {
      toast.error("Please enter an Opposition ID or File Number.");
      return;
    }
    sdIsLoading = true;
    toast.loading("Fetching Opposition Details", { description: "Please hold on...", duration: 1000 });
    try {
      // Clean input: strip "OPP-" prefix if present and lowercase for ID lookup
      let input = sdSearchInput.trim();
      const upperInput = input.toUpperCase();
      const isOppositionId = upperInput.startsWith("OPP-") || (!input.includes("/") && !upperInput.includes("TM") && !upperInput.includes("NG"));
      let queryParam: string;
      
      if (upperInput.startsWith("OPP-")) {
        // User entered display format like "OPP-214150B1" — strip prefix, lowercase
        input = input.substring(4).toLowerCase();
      }
      
      // Try oppositionId first, fallback to fileNumber
      if (isOppositionId) {
        queryParam = `oppositionId=${encodeURIComponent(input)}`;
      } else {
        queryParam = `fileNumber=${encodeURIComponent(input)}`;
      }

      const response = await fetch(
        `${baseURL}/api/opposition/getOppositionDetail?${queryParam}`,
        { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${$loggedInToken}` } }
      );
      console.log("SD Opposer search response status:", response.status);
      let result: any = null;
      try { result = await response.json(); } catch { result = null; }
      console.log("SD Opposer search result:", JSON.stringify(result));
      
      if (response.ok) {
        const raw = result.opposition ?? result.data ?? result;
        if (Array.isArray(raw)) {
          // Multiple oppositions returned (file number search) — show list to pick from
          sdOppositions = raw.filter((o: any) => o != null);
          sdFileInfo = null;
          if (sdOppositions.length === 0) {
            toast.error("No oppositions found.");
          } else if (sdOppositions.length === 1) {
            // Single result, go directly to details
            const d = sdOppositions[0];
            sdFileInfo = {
              fileNumber: d.fileNumber ?? "",
              fileTitle: d.fileName ?? d.fileTitle ?? d.title ?? "",
              applicantName: d.fileOwner ?? d.applicantName ?? "",
              opposerName: d.opposerName ?? d.name ?? "",
              class: d.trademarkClass?.toString() ?? d.class?.toString() ?? "",
              representationUrl: d.representationUrl && d.representationUrl !== "null" ? d.representationUrl : "",
              paymentId: d.paymentId ?? "",
              cost: d.cost ?? "",
              fileId: d.fileId ?? "",
              oppositionId: d.id ?? d.oppositionId ?? "",
              status: d.status ?? d.oppositionStatus ?? "",
            };
            sdOppositions = [];
            currentStep = "sd-results";
          } else {
            currentStep = "sd-results";
          }
        } else {
          const d = raw;
          if (!d) { toast.error("Opposition not found."); sdIsLoading = false; return; }
          sdFileInfo = {
            fileNumber: d.fileNumber ?? "",
            fileTitle: d.fileName ?? d.fileTitle ?? d.title ?? "",
            applicantName: d.fileOwner ?? d.applicantName ?? "",
            opposerName: d.opposerName ?? d.name ?? "",
            class: d.trademarkClass?.toString() ?? d.class?.toString() ?? "",
            representationUrl: d.representationUrl && d.representationUrl !== "null" ? d.representationUrl : "",
            paymentId: d.paymentId ?? "",
            cost: d.cost ?? "",
            fileId: d.fileId ?? "",
            oppositionId: d.id ?? d.oppositionId ?? input,
            status: d.status ?? d.oppositionStatus ?? "",
          };
          sdOppositions = [];
          currentStep = "sd-results";
        }
      } else {
        // If oppositionId search failed, retry with fileNumber
        if (queryParam.startsWith("oppositionId")) {
          const retryResponse = await fetch(
            `${baseURL}/api/opposition/getOppositionDetail?fileNumber=${encodeURIComponent(sdSearchInput.trim())}`,
            { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${$loggedInToken}` } }
          );
          if (retryResponse.ok) {
            let retryResult: any = null;
            try { retryResult = await retryResponse.json(); } catch { retryResult = null; }
            const raw = retryResult?.opposition ?? retryResult?.data ?? retryResult;
            const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
            sdOppositions = data.filter((o: any) => o != null);
            if (sdOppositions.length > 0) {
              currentStep = "sd-results";
            } else {
              toast.error("Opposition not found. Try entering your file number instead.");
            }
          } else {
            toast.error("Opposition not found. Try entering your file number instead.");
          }
        } else {
          toast.error("Opposition not found.");
        }
      }
    } catch (err) {
      console.error("SD Opposer search error:", err);
      toast.error("Failed to fetch opposition details.");
    } finally {
      sdIsLoading = false;
    }
  }

  async function handleSDSearchApplicant() {
    if (!sdSearchInput.trim()) {
      toast.error("Please enter a File Number.");
      return;
    }
    sdIsLoading = true;
    toast.loading("Fetching Oppositions", { description: "Please hold on...", duration: 1000 });
    try {
      const response = await fetch(
        `${baseURL}/api/opposition/getOppositionDetail?fileNumber=${encodeURIComponent(sdSearchInput.trim())}`,
        { method: "GET", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${$loggedInToken}` } }
      );
      const result = await response.json();
      if (response.ok) {
        const raw = result.opposition ?? result.data ?? result;
        const data = Array.isArray(raw) ? raw : [raw];
        sdOppositions = data.filter((o: any) => o != null);
        console.log("SD Oppositions data:", JSON.stringify(sdOppositions.map(o => ({ id: o.id, statutoryDeclarations: o.statutoryDeclarations })), null, 2));
        if (sdOppositions.length === 0) {
          toast.error("No oppositions found for this file.");
        } else {
          currentStep = "sd-results";
        }
      } else {
        const msg = result.message ?? "File not found or has no oppositions.";
        toast.error(msg);
      }
    } catch (err) {
      toast.error("Failed to fetch opposition details.");
    } finally {
      sdIsLoading = false;
    }
  }

  function handleSDSelectOpposition(opp: any) {
    sdFileInfo = {
      fileNumber: opp.fileNumber ?? "",
      fileTitle: opp.fileName ?? opp.fileTitle ?? opp.title ?? "",
      applicantName: opp.fileOwner ?? opp.applicantName ?? "",
      opposerName: opp.opposerName ?? opp.name ?? "",
      class: opp.trademarkClass?.toString() ?? opp.class?.toString() ?? "",
      representationUrl: opp.representationUrl && opp.representationUrl !== "null" ? opp.representationUrl : "",
      paymentId: opp.paymentId ?? "",
      cost: opp.cost ?? "",
      fileId: opp.fileId ?? "",
      oppositionId: opp.id ?? opp.oppositionId ?? "",
      status: opp.status ?? opp.oppositionStatus ?? "",
    };
    currentStep = "sd-form";
  }

  function handleSDFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      sdAttachments = Array.from(target.files);
    }
  }

  async function handleSDSubmit() {
    if (sdAttachments.length === 0) {
      toast.error("Please upload a supporting document.");
      return;
    }
    sdIsSubmitting = true;
    try {
      const submitData = new FormData();
      submitData.append("FileNumber", sdFileInfo?.fileNumber ?? "");
      submitData.append("FileId", sdFileInfo?.fileId ?? "");
      submitData.append("OppositionId", sdFileInfo?.oppositionId ?? "");
      submitData.append("FileTitle", sdFileInfo?.fileTitle ?? "");
      submitData.append("Comment", sdComment);
      submitData.append("UserId", $loggedInUser?.id ?? "");
      submitData.append("Role", sdRole ?? "");
      for (const file of sdAttachments) {
        submitData.append("SupportingDocs", file);
      }
      console.log("Submitting SD:", {
        FileNumber: sdFileInfo?.fileNumber,
        FileId: sdFileInfo?.fileId,
        OppositionId: sdFileInfo?.oppositionId,
        UserId: $loggedInUser?.id,
        Role: sdRole,
        Comment: sdComment.substring(0, 50),
      });
      const response = await fetch(`${baseURL}/api/opposition/NewStatutoryDeclaration`, {
        method: "POST",
        body: submitData,
      });
      const result = await response.json();
      console.log("NewStatutoryDeclaration response:", response.status, JSON.stringify(result));
      if (response.ok && (result.success !== false)) {
        const d = result.data ?? result;
        sdRRR = d.PaymentId ?? d.paymentId ?? d.RRR ?? d.rrr ?? "";
        sdInvoice = {
          fileNumber: d.FileNumber ?? d.fileNumber ?? sdFileInfo?.fileNumber ?? "",
          fileTitle: d.FileTitle ?? d.fileTitle ?? sdFileInfo?.fileTitle ?? "",
          applicantName: d.ApplicantName ?? d.applicantName ?? sdFileInfo?.applicantName ?? "",
          class: d.Class?.toString() ?? d.class?.toString() ?? sdFileInfo?.class ?? "",
          representationUrl: (d.RepresentationUrl ?? d.representationUrl ?? sdFileInfo?.representationUrl ?? ""),
          cost: d.Cost ?? d.cost ?? "",
          serviceFee: d.ServiceFee ?? d.serviceFee ?? "",
          paymentId: sdRRR,
          opposerName: d.OpposerName ?? d.opposerName ?? sdFileInfo?.opposerName ?? "",
          oppositionId: sdFileInfo?.oppositionId ?? "",
        };
        // Save payload so /statutorydeclaration/paid knows to call UpdateStatutoryDeclarationPayment
        sessionStorage.setItem("statutoryDeclarationPayload", JSON.stringify({
          paymentId: sdRRR,
          fileNumber: sdInvoice.fileNumber,
          fileTitle: sdInvoice.fileTitle,
          applicantName: sdInvoice.applicantName,
          oppositionId: sdInvoice.oppositionId,
        }));
        const govtFee = Number(sdInvoice.cost) || SD_GOVT_FEE;
        const svcFee = Number(sdInvoice.serviceFee) || SD_SERVICE_FEE;
        const total = govtFee + svcFee;
        await goto(`/payment/?type=statutorydeclaration&rrr=${sdRRR}&amount=${total}&fileId=${sdFileInfo?.fileId}&name=${encodeURIComponent(sdInvoice.applicantName)}&fileNumber=${encodeURIComponent(sdInvoice.fileNumber)}`);
      } else {
        const msg = result.message ?? result.error ?? JSON.stringify(result);
        toast.error("Failed to submit statutory declaration", { description: msg });
      }
    } catch (err) {
      toast.error("Failed to submit statutory declaration", { description: `${err}` });
    } finally {
      sdIsSubmitting = false;
    }
  }

  async function handleSDPayment() {
    if (!sdInvoice?.paymentId) { toast.error("Payment reference missing."); return; }
    const rrr = sdInvoice.paymentId;
    const govtFee = Number(sdInvoice.cost) || SD_GOVT_FEE;
    const svcFee = Number(sdInvoice.serviceFee) || SD_SERVICE_FEE;
    const total = govtFee + svcFee;
    await goto(`/payment/?type=statutorydeclaration&rrr=${rrr}&amount=${total}&fileId=${sdFileInfo?.fileId}&name=${encodeURIComponent(sdInvoice?.applicantName ?? '')}&fileNumber=${encodeURIComponent(sdInvoice?.fileNumber ?? '')}`);
  }
</script>

<Toaster />
<div class="min-h-screen bg-gray-50 py-8 px-4">
  <div class="max-w-2xl mx-auto">
    {#if currentStep === "landing"}
      <!-- Landing Selection Page -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex justify-end mb-2">
          <button
            on:click={() => goto('/home/dashboard')}
            class="text-sm text-gray-500 hover:text-gray-800 font-medium"
          >
            Home
          </button>
        </div>
        <div class="mb-8 text-center">
          <img
            src={cldLogo}
            alt="Commercial Law Department logo"
            class="mx-auto w-32 h-32"
          />
          <h2 class="text-lg font-bold">
            FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT
          </h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">
          Opposition Services
        </h1>
        <p class="text-center text-gray-500 mb-8 text-sm">
          Select the type of opposition service you want to apply for
        </p>

        <div class="space-y-4">
          <!-- New Opposition -->
          <button
            on:click={() => (currentStep = "search")}
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900 group-hover:text-green-700">
                  New Opposition
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  File a new opposition against a trademark currently in publication
                </p>
              </div>
              <span class="text-gray-400 group-hover:text-green-600 text-xl">→</span>
            </div>
          </button>

          <!-- Counter Statement -->
          <!-- <button
            on:click={() => (currentStep = "cs-search")}
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900 group-hover:text-green-700">
                  Counter Statement
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Submit a counter statement in response to a filed opposition
                </p>
              </div>
              <span class="text-gray-400 group-hover:text-green-600 text-xl">→</span>
            </div>
          </button> -->

          <!-- Statutory -->
          <!-- <button
            on:click={() => (currentStep = "sd-role")}
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900 group-hover:text-green-700">
                  Statutory Declaration
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  File a statutory declaration related to an opposition proceeding
                </p>
              </div>
              <span class="text-gray-400 group-hover:text-green-600 text-xl">→</span>
            </div>
          </button> -->
        </div>
      </div>
    {:else if currentStep === "search"}
      <!-- Search Page -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button
            on:click={goBack}
            class="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back
          </button>
          <button
            on:click={() => goto('/home/dashboard')}
            class="text-gray-500 hover:text-gray-800 font-medium text-sm"
          >
            Home
          </button>
        </div>
        <div class="mb-8 text-center">
          <img
            src={cldLogo}
            alt="Nigerian Coat of Arms"
            class="mx-auto w-32 h-32"
          />
          <h2 class="text-lg font-bold">
            FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT
          </h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">
          Opposition File Search
        </h1>

        <div class="space-y-6">
          <div>
            <label
              for="search-input"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              File Number
            </label>
            <input
              id="search-input"
              type="text"
              bind:value={searchInput}
              placeholder={pubFile ?? "Enter file number"}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <button
            on:click={handleSearch(searchInput.trim())}
            disabled={isLoading || !searchInput.trim()}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if isLoading}
              <div class="flex items-center justify-center">
                <div
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                ></div>
                Searching...
              </div>
            {:else}
              Search
            {/if}
          </button>
        </div>
      </div>
    {:else if currentStep === "results"}
      <!-- Results Page -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button
            on:click={goBack}
            class="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Search
          </button>
          <button
            on:click={() => goto('/home/dashboard')}
            class="text-gray-500 hover:text-gray-800 font-medium text-sm"
          >
            Home
          </button>
        </div>
        <div class="mb-8 text-center">
          <img
            src={cldLogo}
            alt="Nigerian Coat of Arms"
            class="mx-auto w-32 h-32"
          />
          <h2 class="text-lg font-bold">
            FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT
          </h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">File Information</h1>

        {#if fileInfo}
          <div class="space-y-4 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1"
                  >File Number</label
                >
                <p class="text-lg font-semibold text-gray-900">
                  {fileInfo.fileNumber}
                </p>
              </div>

              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1"
                  >Class</label
                >
                <p class="text-lg font-semibold text-gray-900">
                  {fileInfo.class}
                </p>
              </div>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1"
                >Title</label
              >
              <p class="text-lg font-semibold text-gray-900">
                {fileInfo.fileTitle}
              </p>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1"
                >Representation</label
              >
              {#if fileInfo.representationUrl}
                <img
                  src={fileInfo.representationUrl}
                  alt="Representation"
                  class="w-64 h-64 object-contain rounded-lg border border-gray-300"
                />
              {:else}
                <p class="text-lg font-semibold text-gray-500">
                  No representation available
                </p>
              {/if}
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1"
                >Applicant Name</label
              >
              <p class="text-lg font-semibold text-gray-900">
                {fileInfo.applicantName}
              </p>
            </div>
          </div>

          <button
            on:click={handleProceed}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Proceed
          </button>
        {/if}
      </div>
    {:else if currentStep === "form"}
      <!-- Form Page -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button
            on:click={goBack}
            class="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Results
          </button>
          <button
            on:click={() => goto('/home/dashboard')}
            class="text-gray-500 hover:text-gray-800 font-medium text-sm"
          >
            Home
          </button>
        </div>
        <div class="mb-8 text-center">
          <img
            src={cldLogo}
            alt="Commercial Law Department logo"
            class="mx-auto w-32 h-32"
          />
          <h2 class="text-lg font-bold">
            FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT
          </h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">File Opposition</h1>

        {#if fileInfo}
          <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>File:</strong>
              {fileInfo.fileNumber} - {fileInfo.fileTitle}
            </p>
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name <span class="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                bind:value={formData.name}
                placeholder="Enter your full name"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                for="phone"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                bind:value={formData.phone}
                placeholder="Enter your phone number"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address <span class="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                bind:value={formData.email}
                placeholder="Enter your email address"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                for="nationality"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Nationality
              </label>
              <select
                bind:value={formData.nationality}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900"
                required
              >
                <option value="" disabled selected>Select nationality</option>
                {#each Object.entries(countriesMap) as [code, name]}
                  <option value={name}>{name}</option>
                {/each}
              </select>
            </div>
          </div>

          <div>
            <label
              for="address"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Address
            </label>
            <textarea
              id="address"
              bind:value={formData.address}
              rows="2"
              placeholder="Enter your full address"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            ></textarea>
          </div>

          <div>
            <label
              for="reason"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for Opposition <span class="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              bind:value={formData.reason}
              rows="4"
              placeholder="Please provide detailed reasons for your opposition..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            ></textarea>
          </div>

          <div>
            <label
              for="file-upload"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Supporting Documents
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              on:change={handleFileUpload}
              bind:this={fileInputElement}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isLoading}
            />
            <p class="mt-2 text-sm text-gray-500">
              Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum 10MB per file.
            </p>

            {#if formData.attachments && formData.attachments.length > 0}
              <div class="mt-3">
                <p class="text-sm font-medium text-gray-700">Selected files:</p>
                <ul class="mt-1 text-sm text-gray-600">
                  {#each Array.from(formData.attachments) as file}
                    <li>• {file.name} ({Math.round(file.size / 1024)} KB)</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>

          <button
            type="submit"
            disabled={isLoading ||
              !formData.name.trim() ||
              !formData.email.trim() ||
              !formData.reason.trim()}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if isLoading}
              <div class="flex items-center justify-center">
                <div
                  class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                ></div>
                Submitting...
              </div>
            {:else}
              Submit Opposition
            {/if}
          </button>
        </form>
      </div>
    {:else if currentStep === "cs-search"}
      <!-- CS Step 1: Search -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">Counter Statement — File Search</h1>
        <div class="space-y-6">
          <div>
            <label for="cs-search-input" class="block text-sm font-medium text-gray-700 mb-2">Trademark File Number</label>
            <input
              id="cs-search-input"
              type="text"
              bind:value={csSearchInput}
              placeholder="Enter your trademark file number"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={csIsLoading}
            />
          </div>
          <button
            on:click={handleCSSearch}
            disabled={csIsLoading || !csSearchInput.trim()}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if csIsLoading}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            {:else}
              Search
            {/if}
          </button>
        </div>
      </div>
    {:else if currentStep === "cs-results"}
      <!-- CS Step 2: Results -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back to Search</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">File Information</h1>
        {#if csFileInfo}
          <div class="space-y-4 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">File Number</label>
                <p class="text-lg font-semibold text-gray-900">{csFileInfo.fileNumber}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Class</label>
                <p class="text-lg font-semibold text-gray-900">{csFileInfo.class}</p>
              </div>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1">Title</label>
              <p class="text-lg font-semibold text-gray-900">{csFileInfo.fileTitle}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1">Representation</label>
              {#if csFileInfo.representationUrl}
                <img src={csFileInfo.representationUrl} alt="Representation" class="w-64 h-64 object-contain rounded-lg border border-gray-300" />
              {:else}
                <p class="text-lg font-semibold text-gray-500">No representation available</p>
              {/if}
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <label class="block text-sm font-medium text-gray-600 mb-1">Applicant Name</label>
              <p class="text-lg font-semibold text-gray-900">{csFileInfo.applicantName}</p>
            </div>
          </div>
          <button
            on:click={() => (currentStep = "cs-form")}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Proceed
          </button>
        {/if}
      </div>
    {:else if currentStep === "cs-form"}
      <!-- CS Step 3: Form 7 -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back to Results</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Counter Statement</h1>
        <p class="text-sm text-gray-500 mb-6">FORM 7</p>
        {#if csFileInfo}
          <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>File:</strong> {csFileInfo.fileNumber} — {csFileInfo.fileTitle}
            </p>
          </div>
        {/if}
        <form on:submit|preventDefault={handleCSSubmit} class="space-y-6">
          <div>
            <label for="cs-statement" class="block text-sm font-medium text-gray-700 mb-2">
              Counter Statement <span class="text-red-500">*</span>
            </label>
            <textarea
              id="cs-statement"
              bind:value={csStatementText}
              rows="6"
              placeholder="Enter your counter statement here..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={csIsSubmitting}
              required
            ></textarea>
          </div>
          <div>
            <label for="cs-file-upload" class="block text-sm font-medium text-gray-700 mb-2">
              Supporting Document
            </label>
            <input
              id="cs-file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              on:change={handleCSFileUpload}
              bind:this={csFileInputElement}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={csIsSubmitting}
            />
            <p class="mt-2 text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum 10MB per file.</p>
            {#if csAttachments.length > 0}
              <div class="mt-3">
                <p class="text-sm font-medium text-gray-700">Selected files:</p>
                <ul class="mt-1 text-sm text-gray-600">
                  {#each csAttachments as file}
                    <li>• {file.name} ({Math.round(file.size / 1024)} KB)</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
          <button
            type="submit"
            disabled={csIsSubmitting}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if csIsSubmitting}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            {:else}
              Submit
            {/if}
          </button>
        </form>
      </div>
    {:else if currentStep === "cs-invoice"}
      <!-- CS Step 4: Invoice -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">Invoice</h1>
        {#if csInvoice}
          <!-- File summary -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex gap-4 items-start">
              {#if csInvoice.representationUrl}
                <img src={csInvoice.representationUrl} alt="Mark" class="w-20 h-20 object-contain rounded border border-gray-200 flex-shrink-0" />
              {/if}
              <div class="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div>
                  <p class="text-gray-500">File Number</p>
                  <p class="font-semibold text-gray-900">{csInvoice.fileNumber}</p>
                </div>
                <div>
                  <p class="text-gray-500">Class</p>
                  <p class="font-semibold text-gray-900">{csInvoice.class}</p>
                </div>
                <div>
                  <p class="text-gray-500">Title</p>
                  <p class="font-semibold text-gray-900">{csInvoice.fileTitle}</p>
                </div>
                <div>
                  <p class="text-gray-500">Applicant</p>
                  <p class="font-semibold text-gray-900">{csInvoice.applicantName}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Fee table -->
          <div class="border border-gray-200 rounded-lg overflow-hidden mb-8">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-700">Amount (&#8358;)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr>
                  <td class="px-4 py-3 text-gray-700">Government Fee</td>
                  <td class="px-4 py-3 text-right text-gray-700">{Number(csInvoice.cost || CS_GOVT_FEE).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-gray-700">Service Fee</td>
                  <td class="px-4 py-3 text-right text-gray-700">{Number(csInvoice.serviceFee || CS_SERVICE_FEE).toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td class="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td class="px-4 py-3 text-right font-bold text-gray-900">{(Number(csInvoice.cost || CS_GOVT_FEE) + Number(csInvoice.serviceFee || CS_SERVICE_FEE)).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p class="text-xs text-gray-500 text-center mb-4">RRR: {csInvoice.paymentId}</p>
        {/if}
        <button
          on:click={handleCSPayment}
          class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Pay with Remita
        </button>
      </div>
    {:else if currentStep === "sd-role"}
      <!-- SD: Role Selection -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2 text-center">Statutory Declaration</h1>
        <p class="text-center text-gray-500 mb-8 text-sm">Select your role in the opposition proceeding</p>
        <div class="space-y-4">
          <button
            on:click={() => { sdRole = "opposer"; sdSearchInput = ""; currentStep = "sd-search"; }}
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900 group-hover:text-green-700">I am an Opposer</p>
                <p class="text-sm text-gray-500 mt-1">I filed an opposition and want to submit my statutory declaration</p>
              </div>
              <span class="text-gray-400 group-hover:text-green-600 text-xl">→</span>
            </div>
          </button>
          <button
            on:click={() => { sdRole = "applicant"; sdSearchInput = ""; currentStep = "sd-search"; }}
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900 group-hover:text-green-700">I am an Applicant</p>
                <p class="text-sm text-gray-500 mt-1">My trademark was opposed and I want to submit my statutory declaration</p>
              </div>
              <span class="text-gray-400 group-hover:text-green-600 text-xl">→</span>
            </div>
          </button>
        </div>
      </div>
    {:else if currentStep === "sd-search"}
      <!-- SD: Search -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">
          Statutory Declaration — {sdRole === "opposer" ? "Opposition Search" : "File Search"}
        </h1>
        <div class="space-y-6">
          <div>
            <label for="sd-search-input" class="block text-sm font-medium text-gray-700 mb-2">
              {sdRole === "opposer" ? "Opposition ID or File Number" : "File Number"}
            </label>
            <input
              id="sd-search-input"
              type="text"
              bind:value={sdSearchInput}
              placeholder={sdRole === "opposer" ? "Enter Opposition ID or File Number" : "Enter File Number"}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sdIsLoading}
            />
          </div>
          <button
            on:click={sdRole === "opposer" ? handleSDSearchOpposer : handleSDSearchApplicant}
            disabled={sdIsLoading || !sdSearchInput.trim()}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if sdIsLoading}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            {:else}
              Proceed
            {/if}
          </button>
        </div>
      </div>
    {:else if currentStep === "sd-results"}
      <!-- SD: Results -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-6">
          {sdFileInfo && sdOppositions.length === 0 ? "Opposition Details" : "Select Your Opposition"}
        </h1>
        {#if sdFileInfo && sdOppositions.length === 0}
          <!-- Single opposition details -->
          <div class="space-y-4 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Opposition ID</label>
                <p class="text-sm font-semibold text-gray-900">OPP-{sdFileInfo.oppositionId?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Opposer Name</label>
                <p class="text-lg font-semibold text-gray-900">{sdFileInfo.opposerName || "N/A"}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">File Number</label>
                <p class="text-lg font-semibold text-gray-900">{sdFileInfo.fileNumber}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Title</label>
                <p class="text-lg font-semibold text-gray-900">{sdFileInfo.fileTitle}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Applicant Name</label>
                <p class="text-lg font-semibold text-gray-900">{sdFileInfo.applicantName}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Class</label>
                <p class="text-lg font-semibold text-gray-900">{sdFileInfo.class}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Status of Opposition</label>
                <AppStatusTag value={typeof sdFileInfo.status === 'number' ? sdFileInfo.status : Number(sdFileInfo.status) || 0} />
              </div>
            </div>
            {#if sdFileInfo.representationUrl}
              <div class="p-4 bg-gray-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-600 mb-1">Representation</label>
                <img src={sdFileInfo.representationUrl} alt="Representation" class="w-64 h-64 object-contain rounded-lg border border-gray-300" />
              </div>
            {/if}
          </div>
          <button
            on:click={() => (currentStep = "sd-form")}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Proceed
          </button>
        {:else if sdOppositions.length > 0}
          <!-- List of oppositions to pick from -->
          <div class="space-y-4 mb-4">
            {#each sdOppositions as opp, i}
              <div class="border border-gray-200 rounded-lg p-5 hover:border-green-300 transition-colors">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <p class="text-xs text-gray-500">Opposition ID</p>
                    <p class="text-sm font-semibold text-gray-900">OPP-{(opp.id ?? opp.oppositionId ?? "").slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Opposer Name</p>
                    <p class="text-sm font-semibold text-gray-900">{opp.opposerName ?? opp.name ?? "N/A"}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">File Number</p>
                    <p class="text-sm font-semibold text-gray-900">{opp.fileNumber ?? ""}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Title</p>
                    <p class="text-sm font-semibold text-gray-900">{opp.fileName ?? opp.fileTitle ?? ""}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Applicant Name</p>
                    <p class="text-sm font-semibold text-gray-900">{opp.fileOwner ?? opp.applicantName ?? ""}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Class</p>
                    <p class="text-sm font-semibold text-gray-900">{opp.trademarkClass ?? opp.class ?? ""}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Status</p>
                    <AppStatusTag value={opp.status ?? opp.oppositionStatus ?? 0} />
                  </div>
                </div>
                {#if opp.representationUrl && opp.representationUrl !== "null"}
                  <div class="mb-3">
                    <p class="text-xs text-gray-500 mb-1">Representation</p>
                    <img src={opp.representationUrl} alt="Representation" class="w-20 h-20 object-contain rounded border border-gray-200" />
                  </div>
                {/if}
                {#if opp.statutoryDeclarations && opp.statutoryDeclarations.length > 0}
                  <div class="mb-3 space-y-2">
                    {#each opp.statutoryDeclarations as sd}
                      <div class="flex items-center gap-2 text-xs px-2 py-1 rounded {sd.role === 'applicant' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}">
                        <span class="font-medium">{sd.role === 'applicant' ? 'Applicant' : 'Opposer'} SD Filed</span>
                        {#if sd.submittedDate || sd.dateCreated}
                          <span class="text-gray-400">•</span>
                          <span>{new Date(sd.submittedDate ?? sd.dateCreated).toLocaleDateString()}</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                {#if opp.statutoryDeclarations && opp.statutoryDeclarations.some((sd) => sd.role === 'applicant')}
                  <div class="w-full text-center py-2 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-gray-500">
                    Statutory Declaration Filed
                  </div>
                {:else}
                  <button
                    on:click={() => handleSDSelectOpposition(opp)}
                    class="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    Proceed
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if currentStep === "sd-form"}
      <!-- SD: Form -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="flex items-center justify-between mb-2">
          <button on:click={goBack} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={() => goto('/home/dashboard')} class="text-gray-500 hover:text-gray-800 font-medium text-sm">Home</button>
        </div>
        <div class="mb-8 text-center">
          <img src={cldLogo} alt="CLD Logo" class="mx-auto w-32 h-32" />
          <h2 class="text-lg font-bold">FEDERAL MINISTRY OF INDUSTRY, TRADE & INVESTMENT</h2>
          <h3 class="text-md">Commercial Law Department</h3>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Statutory Declaration</h1>
        <p class="text-sm text-gray-500 mb-6">Upload your statutory declaration document</p>
        {#if sdFileInfo}
          <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <strong>File:</strong> {sdFileInfo.fileNumber} — {sdFileInfo.fileTitle}
            </p>
          </div>
        {/if}
        <form on:submit|preventDefault={handleSDSubmit} class="space-y-6">
          <div>
            <label for="sd-comment" class="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              id="sd-comment"
              bind:value={sdComment}
              rows="4"
              placeholder="Enter any additional comments (optional)..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sdIsSubmitting}
            ></textarea>
          </div>
          <div>
            <label for="sd-file-upload" class="block text-sm font-medium text-gray-700 mb-2">
              Statutory Declaration <span class="text-red-500">*</span>
            </label>
            <input
              id="sd-file-upload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              on:change={handleSDFileUpload}
              bind:this={sdFileInputElement}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={sdIsSubmitting}
              required
            />
            <p class="mt-2 text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX, JPG, PNG. Maximum 10MB per file.</p>
            {#if sdAttachments.length > 0}
              <div class="mt-3">
                <p class="text-sm font-medium text-gray-700">Selected files:</p>
                <ul class="mt-1 text-sm text-gray-600">
                  {#each sdAttachments as file}
                    <li>• {file.name} ({Math.round(file.size / 1024)} KB)</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
          <button
            type="submit"
            disabled={sdIsSubmitting || sdAttachments.length === 0}
            class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if sdIsSubmitting}
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            {:else}
              Submit
            {/if}
          </button>
        </form>
      </div>
    {:else if currentStep === "sd-invoice"}
      <!-- SD: Invoice -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <!-- Card Header -->
        <div class="bg-gray-800 p-6 text-white">
          <h2 class="text-xl font-semibold mb-1">Statutory Declaration</h2>
          <p class="text-blue-100 text-sm">Payment Reference: {sdInvoice?.paymentId ?? ""}</p>
        </div>

        <div class="p-8">
          {#if sdInvoice}
            <!-- Amount Due - Highlighted -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 mb-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 text-lg font-bold">₦</span>
                  </div>
                  <span class="text-gray-700 font-medium">Amount Due</span>
                </div>
                <span class="text-2xl font-bold text-green-600">
                  ₦{(Number(sdInvoice.cost || SD_GOVT_FEE) + Number(sdInvoice.serviceFee || SD_SERVICE_FEE)).toLocaleString()}
                </span>
              </div>
            </div>

            <!-- Payment Details -->
            <div class="grid gap-4 mb-6">
              <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <span class="text-gray-700 font-medium">File Number</span>
                <span class="text-gray-900 font-mono text-sm bg-white px-3 py-1 rounded border">{sdInvoice.fileNumber}</span>
              </div>
              {#if sdInvoice.fileTitle}
                <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span class="text-gray-700 font-medium">Title</span>
                  <span class="text-gray-900 bg-white px-3 py-1 rounded border">{sdInvoice.fileTitle}</span>
                </div>
              {/if}
              {#if sdInvoice.applicantName}
                <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span class="text-gray-700 font-medium">Applicant</span>
                  <span class="text-gray-900 bg-white px-3 py-1 rounded border">{sdInvoice.applicantName}</span>
                </div>
              {/if}
              {#if sdInvoice.class}
                <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <span class="text-gray-700 font-medium">Class</span>
                  <span class="text-gray-900 bg-white px-3 py-1 rounded border">{sdInvoice.class}</span>
                </div>
              {/if}
            </div>

            <!-- Fee Breakdown -->
            <div class="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div class="font-semibold text-gray-700 mb-2">Fee Breakdown</div>
              <div class="flex flex-col gap-1 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Government Fee</span>
                  <span>₦{Number(sdInvoice.cost || SD_GOVT_FEE).toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Service Fee</span>
                  <span>₦{Number(sdInvoice.serviceFee || SD_SERVICE_FEE).toLocaleString()}</span>
                </div>
                <div class="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>₦{(Number(sdInvoice.cost || SD_GOVT_FEE) + Number(sdInvoice.serviceFee || SD_SERVICE_FEE)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex items-start gap-3">
                <div>
                  <p class="text-blue-800 font-medium text-sm">Secure Payment</p>
                  <p class="text-blue-700 text-xs mt-1">
                    Your payment will be processed securely through Remita's encrypted payment gateway.
                  </p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              on:click={goBack}
              class="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              ← Back
            </button>
            <button
              on:click={handleSDPayment}
              class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Pay with Remita
            </button>
          </div>
        </div>
      </div>
    {/if}
    <img
      src={ministry}
      alt="Nigerian Coat of Arms"
      class="mx-auto object-contain w-40 h-auto py-10"
    />
  </div>
</div>
