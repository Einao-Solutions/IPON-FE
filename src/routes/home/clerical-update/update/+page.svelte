<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    ApplicationStatuses,
    baseURL,
    ClericalUpdateTypes,
    FileTypes,
    type DesignCreator,
  } from "$lib/helpers";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import Icon from "@iconify/svelte";
  import { loggedInUser, loggedInToken } from "$lib/store";
  import { Button } from "$lib/components/ui/button/index";
  import { text } from "d3";
  import { showTreatUpdateAppButton } from "../../../dataview/datahelpers";
  import { toast } from "svelte-sonner";
  import { countriesMap } from "$lib/constants";
  import { boolean } from "zod";
  import type { DesignTypes } from "$lib/designutils";
  import { mapDesignTypeToString } from "$lib/designutils";

  interface FileInfo {
    fileTitle: string;
    representation: File | null;
    representationUrl: string | null;
    fileClass: number;
    fileStatus: ApplicationStatuses | null;
    classDescription: string | null;
    fileId: string | null;
    paymentRRR: string | null;
    cost: number | null;
    serviceFee: number | null;
    applicantName: string;
    applicantPhone: string | null;
    applicantEmail: string | null;
    applicantAddress: string | null;
    applicantNationality: string | null;
    correspondenceName: string | null;
    correspondencePhone: string | null;
    correspondenceEmail: string | null;
    correspondenceAddress: string | null;
    updateType: ClericalUpdateTypes | null;
    fileType: FileTypes | null;
    trademarkLogo: string | null;
    disclaimer: string | null;
    noveltyStatement?: string | null;
    designType: number | null;
    designCreators: DesignCreator[] | null;
    designAttachments: string[] | null;
    trademarkType?: number | null;
  }
  interface NewData {
    fileTitle: string;
    Representation: File | null;
    representationUrl: string | null;
    PowerOfAttorney: File | null;
    OtherAttachment: File | null;
    fileClass: number;
    classDescription: string | null;
    fileId: string | null;
    paymentRRR: string | null;
    cost: number | null;
    serviceFee: number | null;
    applicantName: string;
    applicantPhone: string | null;
    applicantEmail: string | null;
    applicantAddress: string | null;
    applicantNationality: string | null;
    correspondenceName: string | null;
    correspondencePhone: string | null;
    correspondenceEmail: string | null;
    correspondenceAddress: string | null;
    updateType: ClericalUpdateTypes | null;
    trademarkLogo: string | null;
    trademarkType: number | null;
    wordMark: string | null;
    disclaimer: string | null;
    noveltyStatement?: string | null;
    designType: number | null;
    designCreators: DesignCreator[] | [];
    titleOfDesign?: string | null;
    DesignAttachments: File[];
  }

  let fileInfo: FileInfo = {
    fileTitle: "",
    representation: null,
    representationUrl: null,
    fileClass: 0,
    fileStatus: null,
    classDescription: null,
    fileId: null,
    paymentRRR: null,
    cost: null,
    serviceFee: null,
    applicantName: "",
    applicantPhone: null,
    applicantEmail: null,
    applicantAddress: null,
    applicantNationality: null,
    correspondenceName: null,
    correspondencePhone: null,
    correspondenceEmail: null,
    correspondenceAddress: null,
    updateType: null,
    trademarkType: null,
    trademarkLogo: null,
    fileType: null,
    disclaimer: null,
    noveltyStatement: null,
    designType: null,
    designCreators: [],
    designAttachments: [],
  };
  let error: string | null = null;
  let isProcessing = false;
  let isLoading = false;
  let updateType: ClericalUpdateTypes | null = null;
  let fileType: FileTypes | null = null;
  const pageData = get(page);

  onMount(async () => {
    const fileNumber = pageData.url.searchParams.get("fileId") ?? "";
    const fileTypeParam = pageData.url.searchParams.get("fileType");
    const parsed = Number(fileTypeParam);
    const validValues = Object.values(FileTypes).filter(
      (v) => typeof v === "number",
    ) as number[];
    fileType =
      !Number.isNaN(parsed) && validValues.includes(parsed)
        ? (parsed as FileTypes)
        : null;

    const updateTypeParam = pageData.url.searchParams.get("updateType") ?? "";
    const upt = Number(updateTypeParam);
    const validUp = Object.values(ClericalUpdateTypes).filter(
      (v) => typeof v === "number",
    ) as number[];

    updateType =
      !Number.isNaN(upt) && validUp.includes(upt)
        ? (upt as ClericalUpdateTypes)
        : null;

    await setData(fileNumber, fileType, updateType);

    // Initialize newData.designCreators with existing creators
    if (fileInfo.designCreators && fileInfo.designCreators.length > 0) {
      newData.designCreators = fileInfo.designCreators.map((creator) => ({
        id: creator.id || "",
        name: creator.name || "",
        email: creator.email || "",
        phone: creator.phone || "",
        address: creator.address || "",
        country: creator.country || "",
      }));
    }
  });
  interface ClassOption {
    id: number;
    name: string;
  }
  const classOptions: ClassOption[] = [
    {
      id: 1,
      name: "Class 1 - Chemicals used in industry, science, agriculture, etc.",
    },
    {
      id: 2,
      name: "Class 2 - Paints, varnishes, preservatives, colorants",
    },
    { id: 3, name: "Class 3 - Cleaning, cosmetics, soaps, perfumery" },
    { id: 4, name: "Class 4 - Industrial oils, greases, candles, fuels" },
    { id: 5, name: "Class 5 - Pharmaceuticals, veterinary, disinfectants" },
    { id: 6, name: "Class 6 - Common metals, building materials, safes" },
    { id: 7, name: "Class 7 - Machines, motors (not for land vehicles)" },
    { id: 8, name: "Class 8 - Hand tools, cutlery, razors" },
    { id: 9, name: "Class 9 - Scientific, electrical, computer apparatus" },
    { id: 10, name: "Class 10 - Medical, surgical, dental instruments" },
    { id: 11, name: "Class 11 - Lighting, heating, cooking appliances" },
    { id: 12, name: "Vehicles, locomotion apparatus" },
    { id: 13, name: "Class 13 - Firearms, ammunition, fireworks" },
    { id: 14, name: "Class 14 - Jewelry, watches, precious metals" },
    { id: 15, name: "Class 15 - Musical instruments and accessories" },
    { id: 16, name: "Class 16 - Paper, printed matter, stationery" },
    { id: 17, name: "Class 17 - Rubber, plastics, insulation materials" },
    { id: 18, name: "Class 18 - Leather goods, bags, umbrellas" },
    { id: 19, name: "Class 19 - Non-metallic building materials" },
    { id: 20, name: "Class 20 - Furniture, mirrors, non-metal articles" },
    { id: 21, name: "Class 21 - Household utensils, glassware, brushes" },
    { id: 22, name: "Class 22 - Ropes, tents, padding materials" },
    { id: 23, name: "Class 23 - Yarns and threads for textile use" },
    { id: 24, name: "Class 24 - Textiles, bed and table covers" },
    { id: 25, name: "Class 25 - Clothing, footwear, headgear" },
    { id: 26, name: "Class 26 - Lace, embroidery, buttons" },
    { id: 27, name: "Class 27 - Carpets, rugs, wall hangings" },
    { id: 28, name: "Class 28 - Games, toys, sports equipment" },
    { id: 29, name: "Class 29 - Meat, fish, dairy, prepared meals" },
    { id: 30, name: "Class 30 - Coffee, tea, bakery, spices" },
    { id: 31, name: "Class 31 - Agriculture, live animals, plants" },
    { id: 32, name: "Class 32 - Beers, non-alcoholic beverages" },
    { id: 33, name: "Class 33 - Alcoholic beverages (except beer)" },
    { id: 34, name: "Class 34 - Tobacco, smokers' articles" },
    { id: 35, name: "Class 35 - Advertising, business management" },
    { id: 36, name: "Class 36 - Insurance, financial, real estate" },
    { id: 37, name: "Class 37 - Construction, repair, installation" },
    { id: 38, name: "Class 38 - Telecommunications" },
    { id: 39, name: "Class 39 - Transport, packaging, travel" },
    { id: 40, name: "Class 40 - Treatment of materials, printing" },
    { id: 41, name: "Class 41 - Education, entertainment, training" },
    { id: 42, name: "Class 42 - Scientific, tech services, software dev" },
    { id: 43, name: "Class 43 - Food services, temporary accommodation" },
    { id: 44, name: "Class 44 - Medical, veterinary, agriculture" },
    { id: 45, name: "Class 45 - Legal, security, social services" },
  ];

  async function setData(
    fileNumber: string,
    fileType: FileTypes | null,
    updateType: ClericalUpdateTypes | null,
  ): Promise<void> {
    isLoading = true;
    try {
      const requestBody = {
        UserId: $loggedInUser?.id,
        FileNumber: fileNumber,
        FileType: fileType,
        UpdateType: updateType,
      };

      const res = await fetch(`${baseURL}/api/files/GetClericalUpdateCost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        error = "Unable to retrieve cost info.";
        return;
      }
      const data = await res.json();

      // Assign to fileInfo using the FileInfo interface
      fileInfo = {
        fileTitle: data.fileTitle ?? "",
        representation: null,
        fileClass: data.fileClass ?? null,
        classDescription: data.classDescription ?? null,
        fileId: data.fileId ?? null,
        fileStatus: Number(data.fileStatus) as ApplicationStatuses,
        fileType: data.fileType,
        paymentRRR: data.paymentRRR ?? null,
        cost: data.cost ?? null,
        serviceFee: data.serviceFee ?? null,
        applicantName: data.applicantName ?? "",
        applicantPhone: data.applicantPhone ?? null,
        applicantEmail: data.applicantEmail ?? null,
        applicantAddress: data.applicantAddress ?? "",
        applicantNationality: data.applicantNationality ?? "",
        correspondenceName: data.correspondenceName ?? null,
        correspondencePhone: data.correspondencePhone ?? null,
        correspondenceEmail: data.correspondenceEmail ?? null,
        correspondenceAddress: data.correspondenceAddress ?? null,
        representationUrl: data.representationUrl ?? null,
        updateType: updateType,
        trademarkLogo: data.trademarkLogo ?? null,
        trademarkType: data.trademarkType ?? null,
        disclaimer: data.disclaimer ?? null,
        noveltyStatement: data.noveltyStatement ?? null,
        designType: data.designType ?? null,
        designCreators: data.designCreators ?? [],
        designAttachments: data.existingDesignAttachments ?? [],
      };
    } catch (err) {
      error = "Error fetching change of name cost.";
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  let newData: NewData = {
    fileTitle: "",
    Representation: null,
    representationUrl: null,
    PowerOfAttorney: null,
    fileClass: 0,
    classDescription: null,
    fileId: null,
    paymentRRR: null,
    cost: null,
    serviceFee: null,
    applicantName: "",
    applicantPhone: null,
    applicantEmail: null,
    applicantAddress: null,
    applicantNationality: null,
    correspondenceName: null,
    correspondencePhone: null,
    correspondenceEmail: null,
    correspondenceAddress: null,
    updateType: null,
    trademarkLogo: null,
    trademarkType: null,
    wordMark: null,
    disclaimer: null,
    OtherAttachment: null,
    noveltyStatement: null,
    designType: null,
    titleOfDesign: null,
    designCreators: [],
    DesignAttachments: [],
  };

  function getFormTitle(type: ClericalUpdateTypes | null): string {
    switch (type) {
      case ClericalUpdateTypes.CorrespondenceInformation:
        return "Application for Clerical Update of Correspondence Information";

      case ClericalUpdateTypes.DesignInformation:
        return "Application for Clerical Update of Design Information";

      case ClericalUpdateTypes.CreatorInformation:
        return "Application for Clerical Update of Creator Information";

      case ClericalUpdateTypes.DesignAttachments:
        return "Application for Clerical Update of Design Attachments";

      case ClericalUpdateTypes.ApplicantName:
        return "Application for Clerical Update of Applicant Name";

      case ClericalUpdateTypes.ApplicantAddress:
        return "Application for Clerical Update of Applicant Address";

      case ClericalUpdateTypes.FileClass:
        return "Application for Clerical Update of File Class / Description";

      case ClericalUpdateTypes.FileTitle:
        return "Application for Clerical Update of File Title / Representation";

      case ClericalUpdateTypes.AddApplicant:
        return "Application for Clerical Update – Add Applicant";

      case ClericalUpdateTypes.RemoveApplicant:
        return "Application for Clerical Update – Remove Applicant";

      case ClericalUpdateTypes.AddAndRemoveApplicant:
        return "Application for Clerical Update – Add and Remove Applicant";

      case ClericalUpdateTypes.EditInventors:
        return "Application for Clerical Update of Inventors";

      case ClericalUpdateTypes.PriorityInfo:
        return "Application for Clerical Update of Priority Information";
      case ClericalUpdateTypes.TrademarkType:
        return "Application for Clerical Update of Trademark Type";
      default:
        return "Application for Clerical Update";
    }
  }

  function getFormNumber(type: ClericalUpdateTypes | null): string {
    switch (type) {
      case ClericalUpdateTypes.ApplicantName:
        return "[Form 22]";
      case ClericalUpdateTypes.ApplicantAddress:
        return "[Form 19]";
      default:
        return "";
    }
  }
  // Computed properties for section visibility
  $: isDesign = fileInfo.fileType === FileTypes.Design;
  $: isTrademark = fileInfo.fileType === FileTypes.Trademark;

  function getDesignTypeString(des: number | null): string {
    if (des === 0) {
      return "Textile";
    } else if (des === 1) {
      return "Non-Textile";
    } else {
      return "";
    }
  }
  $: showNameSection =
    fileInfo.updateType === ClericalUpdateTypes.ApplicantName;
  $: showAddressSection =
    fileInfo.updateType === ClericalUpdateTypes.ApplicantAddress;
  $: showCorrespondenceSection =
    fileInfo.updateType === ClericalUpdateTypes.CorrespondenceInformation;
  $: showClassSection = fileInfo.updateType === ClericalUpdateTypes.FileClass;
  $: showTitleSection = fileInfo.updateType === ClericalUpdateTypes.FileTitle;
  $: showCreatorInfoSection =
    fileInfo.updateType === ClericalUpdateTypes.CreatorInformation;
  $: showTrademarkTypeSection =
    fileInfo.updateType === ClericalUpdateTypes.TrademarkType;
  $: showDesignInformationSection =
    fileInfo.updateType === ClericalUpdateTypes.DesignInformation;
  $: formTitle = getFormTitle(fileInfo.updateType);
  $: showDesignAttachmentsSection =
    fileInfo.updateType === ClericalUpdateTypes.DesignAttachments;
  $: formNumber = getFormNumber(fileInfo.updateType);

  // Add helpers to detect linked-field edits
  function norm(val: string | null | undefined): string {
    return (val ?? "").trim();
  }
  $: addressEdited =
    norm(newData.applicantAddress) !== "" &&
    norm(newData.applicantAddress) !== norm(fileInfo.applicantAddress);

  $: countryEdited =
    norm(newData.applicantNationality) !== "" &&
    norm(newData.applicantNationality) !== norm(fileInfo.applicantNationality);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      error = "File size exceeds the maximum limit of 10MB.";
      newData.Representation = null;
      return;
    }

    // Check that file is actually an image
    if (!file.type.startsWith("image/")) {
      error = "Only image files (e.g., JPG, PNG) are allowed.";
      newData.Representation = null;
      return;
    }
    newData.Representation = file;
    error = "";
  }

  async function handleFileChange(
    event: Event,
    field: "PowerOfAttorney" | "OtherAttachment",
  ) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      error = "File size exceeds the maximum limit of 10MB.";
      newData[field] = null;
      return;
    }

    if (file.type !== "application/pdf") {
      error = "Only PDF files are allowed.";
      newData[field] = null;
      return;
    }

    newData[field] = file;
    error = "";
  }

  let showSuccessToast = false;

  async function handleSubmit() {
    if (!validateForm()) return;
    isProcessing = true;
    const fileNumber = pageData.url.searchParams.get("fileId") ?? "";

    try {
      if (updateType == null) {
        error = "Update type is not specified.";
        isProcessing = false;
        return;
      }

      console.log(fileInfo.fileType, updateType, fileNumber);

      // Create FormData instead of plain object
      const formData = new FormData();

      // Add basic fields
      formData.append("FileId", fileNumber);
      formData.append("UpdateType", updateType.toString());
      formData.append("FileType", fileInfo.fileType?.toString() ?? "");
      formData.append("PaymentRRR", fileInfo.paymentRRR ?? "");
      formData.append("OldApplicantName", fileInfo.applicantName ?? "");

      // Add specific fields based on update type
      if (updateType === ClericalUpdateTypes.CreatorInformation) {
        const filteredCreators = newData.designCreators.filter(
          (creator) =>
            creator.name ||
            creator.email ||
            creator.phone ||
            creator.address ||
            creator.country,
        );

        // Serialize creators as JSON string
        formData.append("DesignCreators", JSON.stringify(filteredCreators));

        if (newData.noveltyStatement) {
          formData.append("NoveltyStatement", newData.noveltyStatement);
        }
      } else if (updateType === ClericalUpdateTypes.FileTitle) {
        if (newData.Representation) {
          formData.append("Representation", newData.Representation); // Append actual File object
        }
        if (newData.trademarkLogo) {
          formData.append("TrademarkLogo", newData.trademarkLogo.toString());
        }
        if (newData.fileTitle) {
          formData.append("FileTitle", newData.fileTitle);
        }
      } else if (updateType === ClericalUpdateTypes.ApplicantName) {
        formData.append("ApplicantName", newData.applicantName ?? "");
      } else if (updateType === ClericalUpdateTypes.DesignAttachments) {
        // Append new design attachment files
        if (newData.DesignAttachments && newData.DesignAttachments.length > 0) {
          newData.DesignAttachments.forEach((file) => {
            formData.append("DesignAttachments", file);
          });
        }
        // Append removed attachment URLs
        if (removedDesignAttachments && removedDesignAttachments.length > 0) {
          removedDesignAttachments.forEach((url) => {
            formData.append("RemoveDesignAttachmentUrls", url);
          });
        }
      } else if (updateType === ClericalUpdateTypes.ApplicantAddress) {
        formData.append("ApplicantAddress", newData.applicantAddress ?? "");
        formData.append("ApplicantPhone", newData.applicantPhone ?? "");
        formData.append("ApplicantEmail", newData.applicantEmail ?? "");
      } else if (updateType === ClericalUpdateTypes.TrademarkType) {
        formData.append(
          "TrademarkType",
          newData.trademarkType != null ? newData.trademarkType.toString() : "",
        );
        formData.append(
          "ApplicantNationality",
          newData.applicantNationality ?? "",
        );
      } else if (updateType === ClericalUpdateTypes.FileClass) {
        formData.append("FileClass", String(newData.fileClass));
        formData.append("ClassDescription", newData.classDescription ?? "");
        formData.append("Disclaimer", newData.disclaimer ?? "");
      } else if (updateType === ClericalUpdateTypes.CorrespondenceInformation) {
        formData.append("CorrespondenceName", newData.correspondenceName ?? "");
        formData.append(
          "CorrespondencePhone",
          newData.correspondencePhone ?? "",
        );
        formData.append(
          "CorrespondenceEmail",
          newData.correspondenceEmail ?? "",
        );
        formData.append(
          "CorrespondenceAddress",
          newData.correspondenceAddress ?? "",
        );

        if (newData.PowerOfAttorney) {
          formData.append("PowerOfAttorney", newData.PowerOfAttorney); // Append actual File object
        }
        if (newData.OtherAttachment) {
          formData.append("OtherAttachment", newData.OtherAttachment); // Append actual File object
        }
      }

      // Store FormData entries as JSON for payment handling
      const formObj: Record<string, any> = {};
      formData.forEach((value, key) => {
        formObj[key] = value instanceof File ? value.name : value;
      });
      localStorage.setItem("formData", JSON.stringify(formObj));

      // Send FormData directly (no JSON.stringify, no Content-Type header)
      const result = await fetch(`${baseURL}/api/files/ClericalUpdate`, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        const errorText = await result.text();
        let errorMessage = result.statusText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          // Response wasn't JSON, use statusText
        }
        toast.error(`Error submitting clerical update: ${errorMessage}`);
        return;
      }

      const data = await result.text();
      localStorage.setItem("clericalId", data);

      await handlePayment();
    } catch (err) {
      error = "Form submission failed.";
      console.error(err);
    } finally {
      isProcessing = false;
    }
  }

  async function freeUpdate(data: FormData) {
    if (fileInfo.fileStatus === ApplicationStatuses.AwaitingSearch) {
      const result = await fetch(`${baseURL}/api/files/ClericalUpdate`, {
        method: "POST",
        body: data,
      });
      if (!result.ok) {
        const error = await result.json();
        toast.error(`Error submitting clerical update: ${error.message}`);
        // isStatusUpdating = false;
        return;
      }
    }
  }

  async function handlePayment() {
    if (fileInfo.cost && fileInfo.paymentRRR) {
      await goto(
        `/payment/?type=clerical&rrr=${fileInfo.paymentRRR}&amount=${fileInfo.cost}`,
      );
    }
    if (fileInfo.fileStatus === ApplicationStatuses.AwaitingSearch) {
      await goto(`/payment/?type=clerical&rrr=Free&amount=0`);
    }
  }

  function goBack() {
    window.history.back();
  }

  function addCreator() {
    newData.designCreators = [
      ...newData.designCreators,
      {
        id: "", // Backend will generate if empty
        name: "",
        email: "",
        phone: "",
        address: "",
        country: "",
      },
    ];
  }

  function removeCreator(index: number) {
    newData.designCreators = newData.designCreators.filter(
      (_, i) => i !== index,
    );
  }

  function validateForm(): boolean {
    // Enforce linked change between country and address
    // if ((addressEdited || countryEdited) && !(addressEdited && countryEdited)) {
    //   error =
    //     "If you change either New Applicant Country or New Applicant Address, you must change both.";
    //   return false;
    // }
    // Add creator validation
    if (showCreatorInfoSection) {
      if (newData.designCreators.length === 0) {
        error = "Please add at least one creator.";
        return false;
      }

      // Validate each creator has at least a name
      for (let i = 0; i < newData.designCreators.length; i++) {
        const creator = newData.designCreators[i];
        if (!creator.name || creator.name.trim() === "") {
          error = `Creator ${i + 1} must have a name.`;
          return false;
        }
      }
      if (showNameSection && !newData.applicantName) {
        error = "Please enter the new applicant name.";
        return false;
      }
      if (
        showAddressSection &&
        !(
          (newData.applicantAddress && newData.applicantAddress.trim()) ||
          (newData.applicantPhone && newData.applicantPhone.trim()) ||
          (newData.applicantEmail && newData.applicantEmail.trim())
        )
      ) {
        error =
          "Please provide at least one of: new applicant address, phone, or email.";
        return false;
      }
      error = null;
      return true;
    }
    error = null;
    return true;
  }

  $: isReadyForPayment = fileInfo.fileStatus != null;
  // Track removed existing attachments (by URL)
  let removedDesignAttachments: string[] = [];

  function removeExistingAttachment(index: number) {
    const url = fileInfo.designAttachments?.[index];
    if (!url) return;
    removedDesignAttachments = [...removedDesignAttachments, url];
    fileInfo.designAttachments =
      fileInfo.designAttachments?.filter((_, i) => i !== index) ?? [];
  }
  function undoRemoveExistingAttachment(url: string) {
    removedDesignAttachments = removedDesignAttachments.filter(
      (u) => u !== url,
    );
    fileInfo.designAttachments = [...(fileInfo.designAttachments ?? []), url];
  }
  function handleAddDesignAttachments(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const maxSizeInBytes = 10 * 1024 * 1024;

    const invalid = files.find(
      (f) => !f.type.startsWith("image/") || f.size > maxSizeInBytes,
    );
    if (invalid) {
      error = "Only image files up to 10MB are allowed.";
      return;
    }

    newData.DesignAttachments = [...newData.DesignAttachments, ...files];
    // Allow selecting the same file again later
    input.value = "";
  }

  function removeNewAttachment(index: number) {
    newData.DesignAttachments = newData.DesignAttachments.filter(
      (_, i) => i !== index,
    );
  }
</script>

<!-- Success Toast Modal -->
{#if showSuccessToast}
  <div
    class="fixed inset-0 flex items-end justify-center z-50 pointer-events-none"
  >
    <div
      class="mb-8 bg-green-600 text-white px-6 py-4 rounded shadow-lg flex items-center gap-2 pointer-events-auto animate-fade-in-up"
    >
      <Icon icon="lucide:check-circle" width="1.5rem" height="1.5rem" />
      <span>Clerical update submitted successfully!</span>
    </div>
  </div>
{/if}
<div class="min-h-screen py-4 px-4">
  <div class="w-full mx-auto">
    <!-- Header -->
    <div class="flex items-center">
      <Button
        variant="outline"
        on:click={goBack}
        class="flex items-center gap-2"
      >
        <Icon icon="lucide:arrow-left" width="1rem" height="1rem" />
        Back
      </Button>
      <div class="flex-1 flex flex-col items-center justify-center">
        <h1 class="text-xl font-bold">
          {formTitle}
          {formNumber}
        </h1>
        <p class="font-light">Fill in the new information</p>
      </div>
    </div>

    <!-- Form -->
    <div class="px-6 py-6">
      {#if error}
        <div class="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p class="text-sm text-red-700">{error}</p>
        </div>
      {/if}

      <!-- Section 1: Current Trademark Information -->
      <!-- svelte-ignore a11y-label-has-associated-control -->

      <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
        <div class="bg-gray-300 px-4 py-2 font-medium text-black">
          CURRENT INFORMATION
        </div>
        {#if isLoading}
          <div class="flex items-center justify-center p-12">
            <div class="flex flex-col items-center gap-2">
              <Icon
                icon="line-md:loading-loop"
                width="2rem"
                height="2rem"
                class="text-blue-600"
              />
              <span class="text-sm text-gray-500">Loading Information...</span>
            </div>
          </div>
        {:else}
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                File Number
              </label>
              <p class="text-base text-gray-900">{fileInfo.fileId}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Title
              </label>
              <p class="text-base text-gray-900">{fileInfo.fileTitle}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Trademark Type
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.trademarkType === 0
                  ? "Local"
                  : fileInfo.trademarkType === 1
                    ? "Foreign"
                    : "N/A"}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Applicant Name
              </label>
              <p class="text-base text-gray-900">{fileInfo.applicantName}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Applicant Email
              </label>
              <p class="text-base text-gray-900">{fileInfo.applicantEmail}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Applicant Phone
              </label>
              <p class="text-base text-gray-900">{fileInfo.applicantPhone}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Applicant Nationality
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.applicantNationality}
              </p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-500 mb-1">
                Applicant Address
              </label>
              <p class="text-base text-gray-900">{fileInfo.applicantAddress}</p>
            </div>

            {#if isDesign}
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-500 mb-1">
                  Statement of Novelty
                </label>
                <p class="text-base text-gray-900">
                  {fileInfo.noveltyStatement}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">
                  Design Type
                </label>
                <p class="text-base text-gray-900">
                  {getDesignTypeString(fileInfo.designType)}
                </p>
              </div>
            {/if}

            {#if isTrademark}
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">
                  Class
                </label>
                <p class="text-base text-gray-900">{fileInfo.fileClass}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">
                  Disclaimer
                </label>
                <p class="text-base text-gray-900">{fileInfo.disclaimer}</p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-500 mb-2">
                  Current Representation
                </label>
                <img
                  src={fileInfo.representationUrl}
                  alt="Current Representation"
                  class="max-h-48 max-w-full rounded border border-gray-300 bg-white object-contain shadow-sm"
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>
      <!-- Section 2: New Name Information (conditionally rendered) -->
      {#if showNameSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-blue-100 px-4 py-2 font-medium text-blue-900">
            NEW INFORMATION
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Applicant Name: <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  bind:value={newData.applicantName}
                  placeholder="Enter new applicant name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">
                  This will replace the current applicant name shown above.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}
      {#if showTrademarkTypeSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-blue-100 px-4 py-2 font-medium text-blue-900">
            NEW INFORMATION
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Trademark Type: <span class="text-red-500">*</span>
                </label>
                <select
                  bind:value={newData.trademarkType}
                  on:change={() => {
                    if (newData.trademarkType === 0) {
                      newData.applicantNationality = "Nigeria";
                    }
                  }}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={null} disabled selected
                    >Select trademark type</option
                  >
                  <option value={0}>Local</option>
                  <option value={1}>Foreign</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  This will replace the current trademark type shown above.
                </p>
              </div>
              <!-- Nationality -->
              <div class="w-1/2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Applicant Country:
                </label>
                <select
                  bind:value={newData.applicantNationality}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-900 focus:border-gray-900 {newData.trademarkType ===
                  0
                    ? 'bg-gray-100 cursor-not-allowed'
                    : ''}"
                  required
                  disabled={newData.trademarkType === 0}
                >
                  <option value="" disabled selected>Select nationality</option>
                  {#each Object.entries(countriesMap) as [code, name]}
                    <option value={name}>{name}</option>
                  {/each}
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  {#if newData.trademarkType === 0}
                    Local trademarks are automatically set to Nigeria.
                  {:else}
                    Optional: Select new country for the applicant.
                  {/if}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}
      <!-- Correspondence Information Section -->
      {#if showCorrespondenceSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-gray-300 px-4 py-2 font-medium text-black">
            CORRESPONDENCE INFORMATION
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                class="block text-sm font-medium text-gray-500 mb-1"
                for=""
              >
                Correspondence Name
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.correspondenceName}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-500 mb-1"
                for=""
              >
                Correspondence Email
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.correspondenceEmail}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-500 mb-1"
                for=""
              >
                Correspondence Phone
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.correspondencePhone}
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-500 mb-1"
                for=""
              >
                Correspondence Address
              </label>
              <p class="text-base text-gray-900">
                {fileInfo.correspondenceAddress}
              </p>
            </div>
          </div>
        </div>
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-green-300 px-4 py-2 font-medium text-black">
            NEW CORRESPONDENCE INFORMATION
          </div>

          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Correspondence Name:
              </label>
              <input
                type="text"
                bind:value={newData.correspondenceName}
                placeholder={fileInfo.correspondenceName}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Correspondence Email:
              </label>
              <input
                type="text"
                bind:value={newData.correspondenceEmail}
                placeholder={fileInfo.correspondenceEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Correspondence Phone:
              </label>
              <input
                type="text"
                bind:value={newData.correspondencePhone}
                placeholder={fileInfo.correspondencePhone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Correspondence Address:
              </label>
              <input
                type="text"
                bind:value={newData.correspondenceAddress}
                placeholder={fileInfo.correspondenceAddress}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>
        <!-- Power of Attorney Upload -->
        <div>
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Upload New Power of Attorney (PDF):
          </label>
          <input
            type="file"
            accept=".pdf"
            on:change={(e) => handleFileChange(e, "PowerOfAttorney")}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            required
          />

          <p class="text-xs text-gray-500 mt-1">
            Please upload a PDF of the Power of Attorney (max 10MB).
          </p>
          {#if newData.PowerOfAttorney}
            <div class="mt-2 flex items-center gap-2 text-green-600">
              <Icon icon="lucide:check-circle" width="1rem" height="1rem" />
              <span class="text-sm"
                >File uploaded: {newData.PowerOfAttorney.name}</span
              >
            </div>
          {/if}
        </div>
        <!-- Other Attachment Upload -->
        <div class="mt-4">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Upload Other Attachment (PDF):
          </label>
          <input
            type="file"
            accept=".pdf"
            on:change={(e) => handleFileChange(e, "OtherAttachment")}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
          />

          <p class="text-xs text-gray-500 mt-1">
            Optional: Upload any other relevant document (max 10MB).
          </p>

          {#if newData.OtherAttachment}
            <div class="mt-2 flex items-center gap-2 text-green-600">
              <Icon icon="lucide:check-circle" width="1rem" height="1rem" />
              <span class="text-sm"
                >File uploaded: {newData.OtherAttachment.name}</span
              >
            </div>
          {/if}
        </div>
      {/if}
      <!-- New Applicant Information (conditionally rendered) -->
      {#if showDesignAttachmentsSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-green-100 px-4 py-2 font-medium text-green-900">
            UPDATE DESIGN ATTACHMENTS
          </div>

          <!-- Existing attachments (removable) -->z
          <div class="p-4">
            <label class="block text-sm font-medium text-gray-500 mb-2">
              Current Attachments
            </label>
            {#if fileInfo.designAttachments && fileInfo.designAttachments.length > 0}
              <div class="flex flex-wrap gap-3">
                {#each fileInfo.designAttachments as attachment, index}
                  <div class="relative">
                    <img
                      src={String(attachment)}
                      alt="Design Attachment"
                      class="max-h-32 max-w-48 rounded border border-gray-300 bg-white object-contain shadow-sm"
                    />
                    <button
                      class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700"
                      on:click={() => removeExistingAttachment(index)}
                      title="Remove this attachment"
                    >
                      Remove
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-gray-500">No current attachments.</p>
            {/if}

            {#if removedDesignAttachments.length > 0}
              <div class="mt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">
                  Removed (will be deleted)
                </h4>
                <div class="flex flex-wrap gap-3">
                  {#each removedDesignAttachments as removedUrl}
                    <div class="relative">
                      <img
                        src={removedUrl}
                        alt="Removed Attachment"
                        class="opacity-60 max-h-24 max-w-36 rounded border border-gray-300 object-contain"
                      />
                      <button
                        class="absolute top-1 right-1 bg-gray-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
                        on:click={() =>
                          undoRemoveExistingAttachment(removedUrl)}
                        title="Undo remove"
                      >
                        Undo
                      </button>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Add new attachments -->
          <div class="p-4 border-t border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Add New Attachments (images, max 10MB each)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              on:change={handleAddDesignAttachments}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
            {#if newData.DesignAttachments.length > 0}
              <div class="mt-3 flex flex-wrap gap-3">
                {#each newData.DesignAttachments as file, index}
                  <div class="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      class="max-h-32 max-w-48 rounded border border-gray-300 bg-white object-contain shadow-sm"
                      on:load={(e) => {
                        if (e.target instanceof HTMLImageElement) {
                          URL.revokeObjectURL(e.target.src);
                        }
                      }}
                    />
                    <button
                      class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700"
                      on:click={() => removeNewAttachment(index)}
                      title="Remove new attachment"
                    >
                      Remove
                    </button>
                    <p class="text-xs text-gray-600 mt-1 max-w-48 truncate">
                      {file.name}
                    </p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Creator Information Section -->
      {#if showCreatorInfoSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div
            class="bg-gray-300 px-4 py-2 font-medium text-black flex justify-between items-center"
          >
            <span>CREATOR(S) INFORMATION</span>
            <button
              on:click={addCreator}
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-normal"
            >
              + Add Creator
            </button>
          </div>
          <div class="p-4">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Phone
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Address
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nationality
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each newData.designCreators as creator, index}
                    <tr>
                      <td class="px-4 py-3 text-sm">
                        <input
                          type="text"
                          bind:value={creator.name}
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Name"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <input
                          type="email"
                          bind:value={creator.email}
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <input
                          type="text"
                          bind:value={creator.phone}
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Phone"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <input
                          type="text"
                          bind:value={creator.address}
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Address"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <select
                          bind:value={creator.country}
                          class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Country</option>
                          {#each Object.entries(countriesMap) as [code, name]}
                            <option value={code}>{name}</option>
                          {/each}
                        </select>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <button
                          on:click={() => removeCreator(index)}
                          class="text-red-600 hover:text-red-800 font-medium"
                          title="Remove creator"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  {/each}
                  {#if newData.designCreators.length === 0}
                    <tr>
                      <td
                        colspan="6"
                        class="px-4 py-8 text-center text-gray-500"
                      >
                        No creators added yet. Click "Add Creator" to add one.
                      </td>
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>

            {#if fileInfo.designCreators && fileInfo.designCreators.length > 0}
              <div class="mt-6 pt-6 border-t border-gray-200">
                <h4 class="text-sm font-medium text-gray-700 mb-3">
                  Current Creators (for reference)
                </h4>
                <div class="bg-gray-50 rounded p-3">
                  {#each fileInfo.designCreators as creator, index}
                    <div class="text-sm text-gray-600 mb-2">
                      <strong>{index + 1}.</strong>
                      {creator.name || "N/A"} - {creator.email || "N/A"} - {creator.phone ||
                        "N/A"} - {creator.address || "N/A"} - {creator.country ||
                        "N/A"}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      <!-- Section 3: New Address Information (conditionally rendered) -->
      <!-- svelte-ignore a11y-label-has-associated-control -->

      {#if showAddressSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-green-100 px-4 py-2 font-medium text-green-900">
            NEW ADDRESS INFORMATION
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-4">
              <!-- Address -->
              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Applicant Address:
                </label>
                <textarea
                  bind:value={newData.applicantAddress}
                  placeholder="Enter new applicant address"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  Enter the new address for the applicant.
                </p>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Applicant Email:
                </label>
                <input
                  type="email"
                  bind:value={newData.applicantEmail}
                  placeholder={fileInfo.applicantEmail}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Optional: Enter new email address for the applicant.
                </p>
              </div>

              <!-- Container -->
              <div class="flex gap-6">
                <!-- Phone -->
                <div class="w-1/2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    New Applicant Phone:
                  </label>
                  <input
                    type="tel"
                    bind:value={newData.applicantPhone}
                    placeholder={fileInfo.applicantPhone}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Optional: Enter new phone number for the applicant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      <!-- Section 3: New Class/Description (conditionally rendered) -->
      <!-- svelte-ignore a11y-label-has-associated-control -->

      {#if showClassSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-green-100 px-4 py-2 font-medium text-green-900">
            NEW CLASS INFORMATION / DISCLAIMER
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-4">
              <!-- Class -->
              {#if fileInfo.fileStatus !== ApplicationStatuses.AwaitingCertification && fileInfo.fileStatus !== ApplicationStatuses.Publication}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Select New Class:
                  </label>
                  <select
                    bind:value={newData.fileClass}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="" disabled selected>Select class</option>
                    {#each classOptions as option}
                      <option value={option.id}>{option.name}</option>
                    {/each}
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    Enter the new class for the file.
                  </p>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    New Description:
                  </label>
                  <textarea
                    bind:value={newData.classDescription}
                    placeholder={fileInfo.classDescription}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    Optional: Enter new description.
                  </p>
                </div>
              {/if}
              <!-- Disclaimer -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New Disclaimer:
                </label>
                <textarea
                  bind:value={newData.disclaimer}
                  placeholder={fileInfo.disclaimer}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                ></textarea>
                <p
                  class="text-xs text-gray-500 px-4 pb-4 mt-1 italic text-center md:text-left"
                >
                  Note: Files in Publication and Awaiting Certification can only
                  update disclaimer.
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}
      <!-- Section 4: Title/Representation -->
      {#if showTitleSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-yellow-100 px-4 py-2 font-medium text-yellow-900">
            NEW INFORMATION
          </div>

          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- New File Title -->
            {#if fileInfo.fileStatus !== ApplicationStatuses.AwaitingCertification && fileInfo.fileStatus !== ApplicationStatuses.Publication}
              <div class="md:col-span-1">
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  New File Title:
                </label>
                <input
                  type="text"
                  bind:value={newData.fileTitle}
                  placeholder="Enter new file title/wordmark"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            {/if}
            <!-- Trademark Logo Type Dropdown -->
            <div>
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="block text-sm font-medium text-gray-700 mb-1">
                New Representation Type:
              </label>
              <select
                bind:value={newData.trademarkLogo}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="" disabled selected>--Select type--</option>
                <option value="WordMark">Wordmark</option>
                <option value="WordAndDevice">Word and Device</option>
                <option value="Device">Device</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">
                Select the type of trademark logo.
              </p>
            </div>

            {#if newData.trademarkLogo === "Device" || newData.trademarkLogo === "WordAndDevice"}
              <!-- Representation Upload -->
              <div>
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Upload New Representation : <span class="text-red-500">*</span
                  >
                </label>
                <input
                  type="file"
                  accept="image/*"
                  on:change={handleImageUpload}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />

                <p class="text-xs text-gray-500 mt-1">
                  Only image files allowed (jpgmax 10MB).
                </p>
                {#if newData.Representation}
                  <div class="mt-2 flex items-center gap-2 text-green-600">
                    <Icon
                      icon="lucide:check-circle"
                      width="1rem"
                      height="1rem"
                    />
                    <span class="text-sm"
                      >File uploaded: {newData.Representation.name}</span
                    >
                  </div>
                  {#if newData.Representation.type.startsWith("image/")}
                    <div class="mt-2">
                      <img
                        src={URL.createObjectURL(newData.Representation)}
                        alt="Preview"
                        class="max-h-40 max-w-full rounded border border-gray-300 object-contain"
                        on:load={(e) => {
                          // Revoke the object URL after image loads to avoid memory leaks
                          if (e.target instanceof HTMLImageElement) {
                            URL.revokeObjectURL(e.target.src);
                          }
                        }}
                      />
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
          <p
            class="text-xs text-gray-500 px-4 pb-4 mt-1 italic text-center md:text-left"
          >
            Note: Files in Publication and Awaiting Certification can only
            update representation.
          </p>
        </div>
      {/if}

      {#if showDesignInformationSection}
        <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
          <div class="bg-green-300 px-4 py-2 font-medium text-black">
            NEW DESIGN INFORMATION
          </div>

          <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Title of Design:
              </label>
              <input
                type="text"
                bind:value={newData.titleOfDesign}
                placeholder={fileInfo.fileTitle}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Design Type:
              </label>
              <select
                bind:value={newData.designType}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="" disabled selected>Select design type</option>
                <option value={0}>Textile</option>
                <option value={1}>Non-Textile</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label
                for=""
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                New Statement of Novelty:
              </label>
              <input
                type="text"
                bind:value={newData.noveltyStatement}
                placeholder={fileInfo.noveltyStatement}
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        </div>
      {/if}
      <!-- <div class="mb-6 border border-gray-300 rounded-md overflow-hidden">
				<div class="bg-orange-100 px-4 py-2 font-medium text-orange-900">SUPPORTING DOCUMENTS</div>
				<div class="p-4">
					<div class="grid grid-cols-1 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								Upload Supporting Document:
							</label>
							<input
								type="file"
								accept=".pdf"
								on:change={handleFileChange}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Please upload a PDF document supporting your request (max 10MB).
							</p>
							{#if newData.document}
								<div class="mt-2 flex items-center gap-2 text-green-600">
									<Icon icon="lucide:check-circle" width="1rem" height="1rem" />
									<span class="text-sm">File uploaded: {newData.document.name}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div> -->

      <!-- Submit Button -->
      <div class="flex justify-end">
        {#if isReadyForPayment}
          <!-- Pay Button -->
          <button
            on:click={handleSubmit}
            class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            disabled={isProcessing}
          >
            {#if isProcessing}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291..."
                />
              </svg>
              Processing...
            {:else}
              Pay
            {/if}
          </button>
        {:else}
          <!-- Disabled Button -->
          <button
            class="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed"
            disabled
          >
            Pay
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
