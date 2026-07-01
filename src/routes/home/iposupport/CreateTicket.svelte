<script lang="ts">
import * as Dialog from '$lib/components/ui/dialog';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Textarea } from '$lib/components/ui/textarea';
import Icon from '@iconify/svelte';
import { toast } from 'svelte-sonner';
import { Toaster } from '$lib/components/ui/sonner';
import { loggedInUser } from '$lib/store';
import {
baseURL,
UserRoles,
TicketCategory,
TicketType,
ApplicationType,
TrademarkRecordalType,
PatentDesignRecordalType
} from '$lib/helpers';

export let onExit: () => void = () => {};
export let open: boolean = false;
export let technicalOnly: boolean = false;
export let requireFileNumber: boolean = false;

const STAFF_ONLY_TECH_ROLES = [
UserRoles.TrademarkStaff,
UserRoles.PatentStaff,
UserRoles.DesignStaff,
UserRoles.TrademarkSupport,
UserRoles.PatentDesignSupport,
UserRoles.TrademarkSearch,
UserRoles.TrademarkExaminer,
UserRoles.TrademarkOpposition,
UserRoles.TrademarkAcceptance,
UserRoles.TrademarkCertification,
UserRoles.TrademarkPublication,
UserRoles.TrademarkRegistrar,
UserRoles.PatentSearch,
UserRoles.PatentExaminer,
UserRoles.PatentCertification,
UserRoles.AppealExaminer,
UserRoles.DesignSearch,
UserRoles.DesignExaminer,
UserRoles.DesignCertification
];
$: isStaffOnlyTech = !!$loggedInUser?.userRoles?.some((r) => STAFF_ONLY_TECH_ROLES.includes(r));

const TRADEMARK_OFFICER_ROLES = [
UserRoles.TrademarkStaff,
UserRoles.TrademarkSupport,
UserRoles.TrademarkSearch,
UserRoles.TrademarkExaminer,
UserRoles.TrademarkOpposition,
UserRoles.TrademarkAcceptance,
UserRoles.TrademarkCertification,
UserRoles.TrademarkPublication,
UserRoles.TrademarkRegistrar
];

const PATENT_DESIGN_OFFICER_ROLES = [
UserRoles.PatentStaff,
UserRoles.DesignStaff,
UserRoles.PatentDesignSupport,
UserRoles.PatentSearch,
UserRoles.PatentExaminer,
UserRoles.PatentCertification,
UserRoles.AppealExaminer,
UserRoles.DesignSearch,
UserRoles.DesignExaminer,
UserRoles.DesignCertification
];

$: officerRegistryCategory = $loggedInUser?.userRoles?.some((r) => TRADEMARK_OFFICER_ROLES.includes(r))
? TicketCategory.TrademarkRegistry
: $loggedInUser?.userRoles?.some((r) => PATENT_DESIGN_OFFICER_ROLES.includes(r))
? TicketCategory.PatentDesignRegistry
: null;

$: recordalRegistryCategory = technicalOnly && officerRegistryCategory !== null ? officerRegistryCategory : selectedCategory;
$: isRegistryTechnicalFlow = technicalOnly && officerRegistryCategory !== null;

let step: number = 1;
let selectedTicketType: TicketType | null = null;
let isTechType: boolean = false;
let selectedCategory: TicketCategory | null = null;
let selectedApplicationType: ApplicationType | null = null;
let selectedRecordalType: number | null = null;
let titleOfTicket: string = '';
let fileNumber: string = '';
let accountEmail: string = '';
let reason: string = '';
let selectedFile: File | null = null;
let selectedFileName: string = '';
let isSavingTicket: boolean = false;
let isValidatingFile: boolean = false;
let fileValidationMessage: string = '';
let validatedFileNumber: string = '';
let validatedFileInfo: any = null;
let statusMessage: string | null = null;

const techTypes = [
{ value: TicketType.AccountAccess, label: 'Account Access', icon: 'mdi:account-key-outline' },
{ value: TicketType.PaymentIssue, label: 'Payment Issue', icon: 'mdi:credit-card-outline' },
{ value: TicketType.Others, label: 'Others', icon: 'mdi:help-circle-outline' }
];

const registryTechnicalTypes = [
{ value: TicketType.RegistryProcessInquiry, label: 'Filings', icon: 'mdi:file-document-multiple-outline' },
{ value: TicketType.Others, label: 'Others', icon: 'mdi:help-circle-outline' }
];

const registryTypes = [
{ value: TicketType.RegistryProcessInquiry, label: 'Process / Service Inquiry', icon: 'mdi:magnify' },
{ value: TicketType.ApplicationStatus, label: 'Application Status Follow-Up', icon: 'mdi:timeline-check-outline' },
{ value: TicketType.Others, label: 'Others', icon: 'mdi:help-circle-outline' }
];

const applicationTypes = [
{ value: ApplicationType.NewRegistration, label: 'New Registration', icon: 'mdi:file-plus-outline' },
{ value: ApplicationType.ClericalUpdate, label: 'Clerical Update', icon: 'mdi:file-edit-outline' },
{ value: ApplicationType.Opposition, label: 'Opposition', icon: 'mdi:gavel' },
{ value: ApplicationType.Certificate, label: 'Certificate', icon: 'mdi:certificate-outline' },
{ value: ApplicationType.Recordals, label: 'Recordals', icon: 'mdi:folder-sync-outline' },
{ value: ApplicationType.Withdrawal, label: 'Withdrawal', icon: 'mdi:file-remove-outline' },
{ value: ApplicationType.Appeal, label: 'Appeal', icon: 'mdi:scale-balance' }
];

$: recordalTypes = recordalRegistryCategory === TicketCategory.TrademarkRegistry
? [
{ value: TrademarkRecordalType.ChangeOfName, label: 'Change of Name' },
{ value: TrademarkRecordalType.ChangeOfAddress, label: 'Change of Address' },
{ value: TrademarkRecordalType.Assignment, label: 'Assignment' },
{ value: TrademarkRecordalType.Merger, label: 'Merger' },
{ value: TrademarkRecordalType.RegisteredUser, label: 'Registered User' },
{ value: TrademarkRecordalType.Reclassification, label: 'Reclassification' },
{ value: TrademarkRecordalType.Amendment, label: 'Amendment' },
{ value: TrademarkRecordalType.Renewal, label: 'Renewal' }
]
: [
{ value: PatentDesignRecordalType.ChangeOfPatentTitle, label: 'Change of Patent Title' },
{ value: PatentDesignRecordalType.Assignment, label: 'Assignment' },
{ value: PatentDesignRecordalType.Merger, label: 'Merger' },
{ value: PatentDesignRecordalType.License, label: 'License' },
{ value: PatentDesignRecordalType.Mortgage, label: 'Mortgage' },
{ value: PatentDesignRecordalType.Amendment, label: 'Amendment' },
{ value: PatentDesignRecordalType.Renewal, label: 'Renewal' }
];

$: isAccountAccessTicket = isTechType && selectedTicketType === TicketType.AccountAccess;
$: shouldShowFileNumber = !isAccountAccessTicket && (!isTechType || requireFileNumber || selectedTicketType === TicketType.PaymentIssue || (!technicalOnly && isTechType && selectedTicketType === TicketType.Others) || !!fileNumber.trim());
$: mustValidateFileNumber = !isAccountAccessTicket && (!isTechType || requireFileNumber || selectedTicketType === TicketType.PaymentIssue);
$: requiresAccountEmail = isAccountAccessTicket && !technicalOnly;
$: fileNumberLabel = selectedApplicationType === ApplicationType.Opposition ? 'Opposition ID' : mustValidateFileNumber ? 'File Number' : 'File Number (optional)';
$: fileNumberValid = !mustValidateFileNumber || (validatedFileNumber === fileNumber.trim() && !!validatedFileInfo);
$: accountEmailValid = !requiresAccountEmail || accountEmail.trim().length > 0;
$: basicDetailsValid = titleOfTicket.trim().length > 0 && reason.trim().length > 0;
$: detailsValid = basicDetailsValid && fileNumberValid && accountEmailValid;
$: isRegistryTechnicalOther = isRegistryTechnicalFlow && isTechType && selectedTicketType === TicketType.Others;

$: progressSteps = isTechType
? isRegistryTechnicalOther
? ['Ticket Type', 'Details', 'Review']
: requireFileNumber
? selectedApplicationType === ApplicationType.Recordals
? ['Ticket Type', 'App Type', 'Recordal', 'Details', 'Review']
: ['Ticket Type', 'App Type', 'Details', 'Review']
: ['Ticket Type', 'Details', 'Review']
: selectedApplicationType === ApplicationType.Recordals
? ['Ticket Type', 'Registry', 'App Type', 'Recordal', 'Details', 'Review']
: ['Ticket Type', 'Registry', 'App Type', 'Details', 'Review'];

$: currentProgressIndex = (() => {
if (isTechType) {
if (isRegistryTechnicalOther) {
if (step === 1) return 0;
if (step === 5) return 1;
return 2;
}
if (step === 1) return 0;
if (step === 3) return 1;
if (step === 4) return 2;
if (step === 5) return requireFileNumber ? selectedApplicationType === ApplicationType.Recordals ? 3 : 2 : 1;
return requireFileNumber ? selectedApplicationType === ApplicationType.Recordals ? 4 : 3 : 2;
}
if (step === 1) return 0;
if (step === 2) return 1;
if (step === 3) return 2;
if (step === 4) return 3;
if (step === 5) return selectedApplicationType === ApplicationType.Recordals ? 4 : 3;
return selectedApplicationType === ApplicationType.Recordals ? 5 : 4;
})();

function pickTechType(type: TicketType) {
selectedTicketType = type;
isTechType = true;
selectedCategory = TicketCategory.TechnicalSupport;
selectedApplicationType = null;
selectedRecordalType = null;
step = technicalOnly ? 3 : requireFileNumber ? 3 : 5;
}

function pickRegistryTechnicalType(type: TicketType) {
selectedTicketType = type;
isTechType = true;
selectedCategory = TicketCategory.TechnicalSupport;
selectedApplicationType = null;
selectedRecordalType = null;
step = type === TicketType.Others ? 5 : 3;
}

function pickRegistryType(type: TicketType) {
selectedTicketType = type;
isTechType = false;
selectedCategory = null;
selectedApplicationType = null;
selectedRecordalType = null;
step = 2;
}

function pickRegistry(cat: TicketCategory) {
selectedCategory = cat;
step = 3;
}

function pickApplicationType(at: ApplicationType) {
selectedApplicationType = at;
selectedRecordalType = null;
step = at === ApplicationType.Recordals ? 4 : 5;
}

function pickRecordalType(rt: number) {
selectedRecordalType = rt;
step = 5;
}

function goBack() {
if (step === 6) { step = 5; return; }
if (step === 5) {
if (isRegistryTechnicalOther) { step = 1; return; }
if (isTechType && selectedApplicationType === ApplicationType.Recordals) { step = 4; return; }
if (isTechType) { step = requireFileNumber ? 3 : 1; return; }
step = selectedApplicationType === ApplicationType.Recordals ? 4 : 3;
return;
}
if (step === 4) { step = 3; return; }
if (step === 3) { step = isTechType ? 1 : 2; return; }
if (step === 2) { step = 1; return; }
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
		let binary = '';
		const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
return window.btoa(binary);
}

function toByteArray(file: File): Promise<Uint8Array> {
return new Promise<ArrayBuffer>((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve(reader.result as ArrayBuffer);
reader.onerror = reject;
reader.readAsArrayBuffer(file);
}).then((ab) => new Uint8Array(ab));
}

function fileChanged(event: Event) {
const input = event.target as HTMLInputElement;
if (!input.files || input.files.length === 0) return;
if (input.files[0].size > 5000000) {
toast.error('Maximum file size of 5MB exceeded', { position: 'top-right' });
return;
}
selectedFile = input.files[0];
selectedFileName = input.files[0].name;
}

async function validateFileNumber(): Promise<boolean> {
const value = fileNumber.trim();
if (!value) {
fileValidationMessage = 'File number is required.';
validatedFileNumber = '';
validatedFileInfo = null;
return false;
}
isValidatingFile = true;
fileValidationMessage = '';
try {
const response = await fetch(`${baseURL}/api/files/GetFileByFileNumber?fileNumber=${encodeURIComponent(value)}`);
if (!response.ok) throw new Error('lookup failed');
const result = await response.json();
const file = Array.isArray(result) ? result[0] : result;
if (file) {
validatedFileNumber = value;
validatedFileInfo = file;
fileValidationMessage = 'File number verified.';
return true;
} else {
validatedFileNumber = '';
validatedFileInfo = null;
fileValidationMessage = 'No file was found for this number.';
return false;
}
} catch {
validatedFileNumber = '';
validatedFileInfo = null;
fileValidationMessage = 'Unable to validate this file number.';
return false;
} finally {
isValidatingFile = false;
}
}

async function goToReview() {
if (!detailsValid && !mustValidateFileNumber) return;
if (mustValidateFileNumber && !fileNumberValid) {
const valid = await validateFileNumber();
if (!valid) {
toast.error('Please enter a valid file number before continuing.', { position: 'top-right' });
return;
}
}
if (!accountEmailValid) {
toast.error('Please enter the account email before continuing.', { position: 'top-right' });
return;
}
step = 6;
}

$: if (fileNumber.trim() !== validatedFileNumber) {
validatedFileInfo = null;
}

function clearFile() {
selectedFile = null;
selectedFileName = '';
}

const userName = ($loggedInUser?.firstName ?? '') + ' ' + ($loggedInUser?.lastName ?? '');

async function saveNewTicket() {
if (mustValidateFileNumber && !fileNumberValid) {
toast.error('Please validate the file number before submitting.', { position: 'top-right' });
return;
}
if (!accountEmailValid) {
toast.error('Please enter the account email before submitting.', { position: 'top-right' });
return;
}
isSavingTicket = true;
let attachmenturl: any = null;
if (selectedFile) {
const result = await fetch(`${baseURL}/api/files/uploadAttachment`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify([{
fileName: selectedFile.name,
Name: '',
contentType: selectedFile.type,
data: arrayBufferToBase64(await toByteArray(selectedFile))
}])
});
attachmenturl = await result.json();
}
const body: Record<string, any> = {
title: titleOfTicket,
creatorId: $loggedInUser?.creatorId,
creatorName: userName,
status: 1,
category: selectedCategory,
ticketType: selectedTicketType,
raisedByRegistryStaff: isRegistryTechnicalFlow,
correspondences: [
attachmenturl == null
? { message: reason, senderId: $loggedInUser?.creatorId, senderName: userName }
: { attachment: attachmenturl[0], message: reason, senderId: $loggedInUser?.creatorId, senderName: userName }
]
};
if (isRegistryTechnicalFlow && officerRegistryCategory !== null) body.registryCategory = officerRegistryCategory;
if (selectedApplicationType !== null) body.applicationType = selectedApplicationType;
if (selectedRecordalType !== null) body.recordalType = selectedRecordalType;
if (fileNumber.trim()) body.fileNumber = fileNumber.trim();
if (accountEmail.trim()) body.accountEmail = accountEmail.trim();
if (validatedFileInfo) {
body.fileId = validatedFileInfo.id ?? validatedFileInfo.Id ?? validatedFileInfo.fileId ?? validatedFileInfo.FileId;
}

const response = await fetch(`${baseURL}/api/tickets/Create`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body)
});
isSavingTicket = false;
statusMessage = response.ok ? 'success' : 'error';
step = 7;
if (response.ok) toast.success('Ticket submitted!', { position: 'top-right' });
}

function resetAndClose() {
step = 1;
selectedTicketType = null;
isTechType = false;
selectedCategory = null;
selectedApplicationType = null;
selectedRecordalType = null;
titleOfTicket = '';
fileNumber = '';
accountEmail = '';
reason = '';
selectedFile = null;
selectedFileName = '';
isSavingTicket = false;
isValidatingFile = false;
fileValidationMessage = '';
validatedFileNumber = '';
validatedFileInfo = null;
statusMessage = null;
open = false;
onExit();
}

function categoryLabel(cat: TicketCategory | null): string {
if (cat === TicketCategory.TrademarkRegistry) return 'Trademark Registry';
if (cat === TicketCategory.PatentDesignRegistry) return 'Patent & Design Registry';
if (cat === TicketCategory.TechnicalSupport) return 'Technical Support';
return '—';
}

function ticketTypeLabel(tt: TicketType | null): string {
if (isRegistryTechnicalFlow && tt === TicketType.RegistryProcessInquiry) return 'Filings';
return [...techTypes, ...registryTypes].find((t) => t.value === tt)?.label ?? '—';
}

function appTypeLabel(at: ApplicationType | null): string {
return applicationTypes.find((a) => a.value === at)?.label ?? '—';
}

const cardBase = 'group relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all duration-150 text-center';
const cardIdle = 'border-slate-200 bg-white hover:border-green-400 hover:shadow-md hover:bg-green-50/40';
const cardActive = 'border-green-600 bg-green-50 shadow-md';
</script>

<Toaster />

<Dialog.Root bind:open closeOnOutsideClick={false} closeOnEscape={false}>
<Dialog.Content class="!max-w-2xl w-full p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl [&>button:last-child]:hidden">

<!-- Header -->
<div class="flex items-center justify-between px-6 py-4 border-b bg-white">
<div>
<h2 class="text-lg font-semibold text-slate-800">{technicalOnly ? 'Technical Support' : 'New Support Ticket'}</h2>
{#if step < 7}
<p class="text-xs text-muted-foreground mt-0.5">Step {currentProgressIndex + 1} of {progressSteps.length}</p>
{/if}
</div>
<button type="button" class="rounded-md w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 transition-colors" on:click={resetAndClose} aria-label="Close">
<Icon icon="mdi:close" width="1.2rem" height="1.2rem" />
</button>
</div>

<!-- Progress bar -->
{#if step < 7}
<div class="px-6 pt-4 pb-2 bg-white border-b">
<div class="flex gap-1">
{#each progressSteps as label, i}
<div class="flex flex-col items-center gap-1 flex-1 min-w-0">
<div class="w-full h-1.5 rounded-full transition-all duration-300 {i < currentProgressIndex ? 'bg-green-600' : i === currentProgressIndex ? 'bg-green-400' : 'bg-slate-200'}"></div>
<span class="text-[10px] font-medium truncate w-full text-center {i <= currentProgressIndex ? 'text-green-700' : 'text-slate-400'}">{label}</span>
</div>
{/each}
</div>
</div>
{/if}

<!-- Step content -->
<div class="overflow-y-auto max-h-[60vh] px-6 py-6 bg-slate-50">

{#if step === 1}
<div class="space-y-5">
{#if !isStaffOnlyTech && !technicalOnly}
<div>
<p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Technical Support</p>
<div class="grid grid-cols-3 gap-3">
{#each techTypes as type}
<button type="button" class="{cardBase} {cardIdle}" on:click={() => pickTechType(type.value)}>
<span class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon={type.icon} width="1.4rem" height="1.4rem" class="text-green-700" />
</span>
<span class="text-sm font-medium text-slate-700 leading-tight">{type.label}</span>
</button>
{/each}
</div>
</div>
<div class="relative flex items-center gap-3">
<div class="flex-1 border-t border-slate-200"></div>
<span class="text-xs text-slate-400 font-medium">or</span>
<div class="flex-1 border-t border-slate-200"></div>
</div>
<div>
<p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Registry Support</p>
<div class="grid grid-cols-3 gap-3">
{#each registryTypes as type}
<button type="button" class="{cardBase} {cardIdle}" on:click={() => pickRegistryType(type.value)}>
<span class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon={type.icon} width="1.4rem" height="1.4rem" class="text-green-700" />
</span>
<span class="text-sm font-medium text-slate-700 leading-tight">{type.label}</span>
</button>
{/each}
</div>
</div>
{:else}
<p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Technical Support</p>
<div class="grid {isRegistryTechnicalFlow ? 'grid-cols-2' : 'grid-cols-3'} gap-3">
{#if isRegistryTechnicalFlow}
{#each registryTechnicalTypes as type}
<button type="button" class="{cardBase} {cardIdle}" on:click={() => pickRegistryTechnicalType(type.value)}>
<span class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon={type.icon} width="1.4rem" height="1.4rem" class="text-green-700" />
</span>
<span class="text-sm font-medium text-slate-700 leading-tight">{type.label}</span>
</button>
{/each}
{:else}
{#each techTypes as type}
<button type="button" class="{cardBase} {cardIdle}" on:click={() => pickTechType(type.value)}>
<span class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon={type.icon} width="1.4rem" height="1.4rem" class="text-green-700" />
</span>
<span class="text-sm font-medium text-slate-700 leading-tight">{type.label}</span>
</button>
{/each}
{/if}
</div>
{/if}
</div>

{:else if step === 2}
<div class="space-y-3">
<p class="text-sm text-slate-600 mb-4">Which registry does your inquiry relate to?</p>
<div class="grid grid-cols-2 gap-4">
<button type="button" class="{cardBase} {selectedCategory === TicketCategory.TrademarkRegistry ? cardActive : cardIdle}" on:click={() => pickRegistry(TicketCategory.TrademarkRegistry)}>
<span class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon="mdi:trademark" width="1.8rem" height="1.8rem" class="text-green-600" />
</span>
<span class="text-base font-semibold text-slate-800">Trademark Registry</span>
<span class="text-xs text-slate-500">Trademark applications, oppositions & more</span>
</button>
<button type="button" class="{cardBase} {selectedCategory === TicketCategory.PatentDesignRegistry ? cardActive : cardIdle}" on:click={() => pickRegistry(TicketCategory.PatentDesignRegistry)}>
<span class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon="mdi:lightbulb-outline" width="1.8rem" height="1.8rem" class="text-green-600" />
</span>
<span class="text-base font-semibold text-slate-800">Patent & Design Registry</span>
<span class="text-xs text-slate-500">Patent & design applications & more</span>
</button>
</div>
</div>

{:else if step === 3}
<div>
<p class="text-sm text-slate-600 mb-4">What type of application is this about?</p>
<div class="grid grid-cols-3 gap-3">
{#each applicationTypes as at}
<button type="button" class="{cardBase} {selectedApplicationType === at.value ? cardActive : cardIdle}" on:click={() => pickApplicationType(at.value)}>
<span class="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon={at.icon} width="1.3rem" height="1.3rem" class="text-green-700" />
</span>
<span class="text-sm font-medium text-slate-700 leading-tight">{at.label}</span>
</button>
{/each}
</div>
</div>

{:else if step === 4}
<div>
<p class="text-sm text-slate-600 mb-4">What type of recordal?</p>
<div class="grid grid-cols-2 gap-2">
{#each recordalTypes as rt}
<button type="button" class="flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all text-left {selectedRecordalType === rt.value ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white hover:border-green-400 hover:bg-green-50/30'}" on:click={() => pickRecordalType(rt.value)}>
<div class="w-2 h-2 rounded-full flex-shrink-0 {selectedRecordalType === rt.value ? 'bg-green-600' : 'bg-slate-300'}"></div>
<span class="text-sm font-medium text-slate-700">{rt.label}</span>
</button>
{/each}
</div>
</div>

{:else if step === 5}
<div class="space-y-4">
{#if shouldShowFileNumber}
<div class="space-y-1.5">
<label class="text-sm font-medium text-slate-700" for="ipo-filenum">{fileNumberLabel}{#if mustValidateFileNumber} <span class="text-red-500">*</span>{/if}</label>
<div class="flex gap-2">
<Input id="ipo-filenum" placeholder="e.g. TM-2024-00001" bind:value={fileNumber} />
{#if mustValidateFileNumber}
<Button type="button" variant="outline" disabled={isValidatingFile || !fileNumber.trim()} on:click={validateFileNumber}>
{#if isValidatingFile}<Icon icon="eos-icons:loading" width="1rem" height="1rem" class="mr-1" />{/if}
Validate
</Button>
{/if}
</div>
{#if fileValidationMessage}
<p class="text-xs {fileNumberValid ? 'text-green-700' : 'text-red-600'}">{fileValidationMessage}</p>
{/if}
</div>
{/if}
{#if requiresAccountEmail || (!technicalOnly && isTechType && selectedTicketType === TicketType.Others)}
<div class="space-y-1.5">
<label class="text-sm font-medium text-slate-700" for="ipo-account-email">Account Email{#if requiresAccountEmail} <span class="text-red-500">*</span>{:else} <span class="text-xs text-slate-400 font-normal">(optional)</span>{/if}</label>
<Input id="ipo-account-email" type="email" placeholder="Enter account email" bind:value={accountEmail} />
</div>
{/if}
<div class="space-y-1.5">
<label class="text-sm font-medium text-slate-700" for="ipo-title">Title <span class="text-red-500">*</span></label>
<Input id="ipo-title" placeholder="Briefly describe the issue" bind:value={titleOfTicket} />
</div>
<div class="space-y-1.5">
<label class="text-sm font-medium text-slate-700" for="ipo-desc">Description <span class="text-red-500">*</span></label>
<Textarea id="ipo-desc" class="min-h-32 resize-none" placeholder="Describe the issue in detail…" bind:value={reason} />
</div>
<div class="space-y-1.5">
<p class="text-sm font-medium text-slate-700">Attachment <span class="text-xs text-slate-400 font-normal">(optional, max 5MB)</span></p>
{#if selectedFileName}
<div class="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2">
<Icon icon="mdi:paperclip" width="1rem" height="1rem" class="text-green-700 flex-shrink-0" />
<span class="text-sm text-green-800 truncate flex-1">{selectedFileName}</span>
<button type="button" class="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0" on:click={clearFile} aria-label="Remove file">
<Icon icon="mdi:close-circle" width="1rem" height="1rem" />
</button>
</div>
{:else}
<label class="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all">
<Icon icon="mdi:upload-outline" width="1.2rem" height="1.2rem" class="text-slate-400" />
<span class="text-sm text-slate-500">Click to attach a file (pdf, jpg, png)</span>
<input type="file" class="sr-only" accept=".pdf,.jpg,.png,.jpeg" on:change={fileChanged} />
</label>
{/if}
</div>
</div>

{:else if step === 6}
<div class="space-y-4">
<p class="text-sm text-slate-600">Please review your ticket before submitting.</p>
<div class="rounded-xl border bg-white divide-y text-sm">
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Category</span>
<span class="font-medium">{categoryLabel(selectedCategory)}</span>
</div>
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Ticket Type</span>
<span class="font-medium">{ticketTypeLabel(selectedTicketType)}</span>
</div>
{#if selectedApplicationType !== null}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Application Type</span>
<span class="font-medium">{appTypeLabel(selectedApplicationType)}</span>
</div>
{/if}
{#if selectedRecordalType !== null}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Recordal Type</span>
<span class="font-medium">{recordalTypes.find((r) => r.value === selectedRecordalType)?.label ?? '—'}</span>
</div>
{/if}
{#if fileNumber.trim()}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">{fileNumberLabel}</span>
<span class="font-medium flex items-center gap-1">
{#if fileNumberValid}<Icon icon="mdi:check-circle" width="0.9rem" height="0.9rem" class="text-green-600" />{/if}
{fileNumber}
</span>
</div>
{/if}
{#if accountEmail.trim()}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Account Email</span>
<span class="font-medium">{accountEmail}</span>
</div>
{/if}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Title</span>
<span class="font-medium text-right max-w-[60%]">{titleOfTicket}</span>
</div>
<div class="px-4 py-3">
<p class="text-muted-foreground mb-1">Description</p>
<p class="text-slate-700 whitespace-pre-wrap line-clamp-4">{reason}</p>
</div>
{#if selectedFileName}
<div class="flex justify-between px-4 py-3">
<span class="text-muted-foreground">Attachment</span>
<span class="font-medium flex items-center gap-1">
<Icon icon="mdi:paperclip" width="0.9rem" height="0.9rem" />
{selectedFileName}
</span>
</div>
{/if}
</div>
</div>

{:else if step === 7}
<div class="flex flex-col items-center justify-center gap-4 py-8 text-center">
{#if statusMessage === 'success'}
<div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
<Icon icon="mdi:check-circle" width="2.5rem" height="2.5rem" class="text-green-600" />
</div>
<p class="text-lg font-semibold text-slate-800">Ticket Submitted!</p>
<p class="text-sm text-muted-foreground max-w-xs">Your ticket has been created. You will be notified when there is a response.</p>
{:else}
<div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
<Icon icon="mdi:alert-circle" width="2.5rem" height="2.5rem" class="text-red-500" />
</div>
<p class="text-lg font-semibold text-slate-800">Something went wrong</p>
<p class="text-sm text-muted-foreground">Please try again.</p>
{/if}
</div>
{/if}
</div>

<!-- Footer -->
<div class="flex items-center justify-between px-6 py-4 border-t bg-white">
{#if step === 7}
<div class="flex-1"></div>
<Button on:click={resetAndClose}>Close</Button>
{:else if step === 1}
<p class="text-xs text-muted-foreground">Select a ticket type above to continue</p>
<Button variant="ghost" on:click={resetAndClose}>Cancel</Button>
{:else if step === 5}
<Button variant="outline" on:click={goBack}>
<Icon icon="mdi:arrow-left" width="1rem" height="1rem" class="mr-1" /> Back
</Button>
<Button disabled={!detailsValid || isValidatingFile} on:click={goToReview}>
Review <Icon icon="mdi:arrow-right" width="1rem" height="1rem" class="ml-1" />
</Button>
{:else if step === 6}
<Button variant="outline" on:click={goBack}>
<Icon icon="mdi:arrow-left" width="1rem" height="1rem" class="mr-1" /> Back
</Button>
<Button disabled={isSavingTicket} on:click={saveNewTicket}>
{#if isSavingTicket}<Icon icon="eos-icons:loading" width="1rem" height="1rem" class="mr-2" />{/if}
Submit Ticket
</Button>
{:else}
<Button variant="outline" on:click={goBack}>
<Icon icon="mdi:arrow-left" width="1rem" height="1rem" class="mr-1" /> Back
</Button>
<p class="text-xs text-muted-foreground">Select an option to continue</p>
{/if}
</div>

</Dialog.Content>
</Dialog.Root>
