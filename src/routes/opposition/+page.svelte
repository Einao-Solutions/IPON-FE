<script lang="ts">
  import { onMount } from "svelte";
  import coatOfArms from "$lib/assets/logo.png";
  import cldLogo from "$lib/assets/cld.png";
  import ministry from "$lib/assets/ministry.png";
  import { baseURL } from "$lib/helpers";
  import { countriesMap } from "$lib/constants";
  import { goto } from "$app/navigation";
  import { Toaster, toast } from "svelte-sonner";
  import { page } from "$app/stores";
  import { loggedInUser } from "$lib/store";
  interface FileInfo {
    fileNumber: string;
    fileTitle: string;
    class: string;
    representationUrl: string;
    applicantName: string;
    paymentId: string;
    cost: string;
    fileId: string;
    oppositionId: string;
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

  let currentStep: "landing" | "search" | "results" | "form" | "cs-search" | "cs-results" | "cs-form" | "cs-invoice" = "landing";
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
          <button
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
          </button>

          <!-- Statutory -->
          <button
            disabled
            class="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-5 opacity-50 cursor-not-allowed"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base font-semibold text-gray-900">
                  Statutory Declaration
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  File a statutory declaration related to an opposition proceeding
                </p>
              </div>
              <span class="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">Coming soon</span>
            </div>
          </button>
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
    {/if}
    <img
      src={ministry}
      alt="Nigerian Coat of Arms"
      class="mx-auto object-contain w-40 h-auto py-10"
    />
  </div>
</div>
