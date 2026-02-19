<script lang="ts">
  import { Button } from "$lib/components/ui/button/index";
  import { Label } from "$lib/components/ui/label/index";
  import { onMount, tick } from "svelte";
  import { loggedInToken, loggedInUser } from "$lib/store.js";
  import * as Dialog from "$lib/components/ui/dialog";
  import {
    arrayBufferToBase64,
    baseURL,
    correspondenceDescription,
    toByteArray,
    UserRoles,
    type UsersType,
    UserTypes,
    mapRoleToString,
    AccountType,
  } from "$lib/helpers.js";
  import { parseLoggedInUser } from "../../dataview/datahelpers";
  import { goto } from "$app/navigation";
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Popover from "$lib/components/ui/popover";
  import * as Command from "$lib/components/ui/command";
  import { toast } from "svelte-sonner";
  import Icon from "@iconify/svelte";
  import { Toaster } from "$lib/components/ui/sonner";
  import { nigeriaStates } from "$lib/constants";
  import { cn } from "$lib/utils";
  import { writable } from "svelte/store";
  import { isValidPhoneNumber } from "libphonenumber-js";
  import * as valid from "validator";
  import { mapAccountTypeToString } from "$lib/helpers";
  import type { User } from "lucide-svelte";

  let selectedSignature: File | undefined = undefined;
  let selectedSignatureUrl: undefined | string = undefined;
  let isSignatureSaving: boolean = false;
  let user: UsersType;
  let profileLoading: boolean = true;
  let showNewPassword: boolean = false;
  let showConfirmPassword: boolean = false;
  let userDetails: UsersType | null = null;
  onMount(async () => {
    profileLoading = true;
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth")
    ) {
      return;
    }
    if ($loggedInUser !== null) {
      user = $loggedInUser;
    } else {
      const user = parseLoggedInUser(document.cookie);
      const name = user?.firstName + " " + user?.lastName;
      if (!user) {
        toast.error("Please login", {
          position: "top-right",
        });
        await goto("/auth");
      } else {
        loggedInUser.set(user);
      }
    }
    // loadDefaultCorr();
    await loadUserDetails();
    profileLoading = false;
  });

  function logout() {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    loggedInToken.set(null);
    loggedInUser.set(null);
    goto("/auth");
  }

  function userIsExaminer(): boolean {
    return (
      user?.userRoles.includes(UserRoles.PatentExaminer) ||
      user?.userRoles.includes(UserRoles.DesignExaminer) ||
      user?.userRoles.includes(UserRoles.TrademarkExaminer)
    );
  }
  let showCorrDialog = false;
  let updateProfileDialog = false;
  function defaultCorrespondence() {
    showCorrDialog = true;
  }
  async function loadUserDetails() {
    if (!user) return;
    try {
      const res = await fetch(`${baseURL}/api/Auth/GetUser?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${$loggedInToken}`,
        },
      });
      if (res.ok) {
        userDetails = await res.json();
      }
    } catch (e) {
      console.error("Error fetching user details:", e);
    }
  }
  async function fileSelected(event: Event | null) {
    const input = event?.target as HTMLInputElement;
    if (input.files) {
      if (input.files.length > 1) {
        selectedSignatureUrl = undefined;
        selectedSignature = undefined;
        toast.error("maximum of 1 images", {
          position: "top-right",
        });
        return;
      }
      for (let i = 0; i < input.files.length; i++) {
        if (input.files[i].size > 5000000) {
          selectedSignatureUrl = undefined;
          selectedSignature = undefined;
          toast.error("maximum file size of 5MB exceeded", {
            position: "top-right",
          });
          return;
        }
      }
      const fileType = input.files[0].type;
      if (!["image/jpeg", "image/png"].includes(fileType)) {
        selectedSignatureUrl = undefined;
        selectedSignature = undefined;
        toast.error("unsupported file type, .png, .jpeg only are supported", {
          position: "top-right",
        });
        return;
      }
      selectedSignatureUrl = URL.createObjectURL(input.files[0] as File);
      selectedSignature = input.files[0] as File;
    }
  }
  async function saveSignature() {
    isSignatureSaving = true;
    const result = await fetch(`${baseURL}/api/users/updateSignature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: selectedSignature?.name,
        userId: user?.id,
        contentType: selectedSignature?.type,
        data: arrayBufferToBase64(await toByteArray(selectedSignature)),
      }),
    });
    if (result.ok) {
      const newUrl = await result.text();
      loggedInUser.update((dat) => {
        if (dat) dat.signatureUrl = newUrl;
        return dat;
      });
      const user = parseLoggedInUser(document.cookie);
      user["signatureUrl"] = newUrl;
      const userCookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/`;
      document.cookie = userCookie.trimStart();
      isSignatureSaving = false;
      toast.success("successfully uploaded new signature", {
        position: "top-right",
      });
    }
  }
  let name = "",
    address = "",
    phoneNumber = "",
    email = "",
    state = "";
  let showNameError = false,
    showPhoneError = false,
    showEmailError = false;
  let showAddressError = false,
    showStateError = false;
  let openCitySelection = writable<boolean>(false);
  function closeCountryAndFocusTrigger(triggerId: string) {
    openCitySelection.update(() => false);
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  function loadDefaultCorr() {
    name = $loggedInUser?.firstName + " " + $loggedInUser?.lastName;
    address = $loggedInUser?.address ?? "";
    email = $loggedInUser?.email ?? "";
    phoneNumber = $loggedInUser?.defaultCorrespondence?.phone ?? "";
    state = $loggedInUser?.defaultCorrespondence?.state ?? "";
  }

  let isCorrLoading = false;
  async function saveNewCorrespondence() {
    isCorrLoading = true;
    if (validateCorrespondence()) {
      const response = await fetch(`${baseURL}/api/users/UpdateCorr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            id: $loggedInUser?.id,
            name: $loggedInUser?.name,
            email: $loggedInUser?.email,
            password: $loggedInUser?.password,
          },
          corr: {
            name: name,
            address: address,
            email: email,
            phone: phoneNumber,
            state: state,
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        loggedInUser.update((currentData) => {
          currentData.defaultCorrespondence = data;
          return currentData;
        });
        toast.success("successfully updated default correspondence", {
          position: "top-right",
        });
      }
    }
    isCorrLoading = false;
  }
  function validateCorrespondence(): boolean {
    showNameError = name === null || name === "";
    showPhoneError =
      phoneNumber === null || phoneNumber === "" || validateNumber() == false;
    showStateError = state === null || state === "";
    showEmailError = email === null || email === "" || validateEmail() == false;
    showAddressError = address === null || address === "";
    return !(
      showNameError ||
      showPhoneError ||
      showStateError ||
      showEmailError ||
      showAddressError
    );
  }
  function validateNumber(): boolean {
    return isValidPhoneNumber(phoneNumber ?? "", "NG");
  }
  function validateEmail(): boolean {
    return valid.isEmail(email ?? "");
  }
  // Change Password dialog state and handlers
  let showPasswordDialog = false;
  let newPassword = "";
  let confirmPassword = "";
  let isPwdSaving = false;
  let showPwdError = false;
  let showConfirmError = false;
  let pwdMismatch = false;

  function openChangePassword() {
    showPasswordDialog = true;
    newPassword = "";
    confirmPassword = "";
    showPwdError = false;
    showConfirmError = false;
    pwdMismatch = false;
  }

  function validateNewPassword(): boolean {
    showPwdError = !newPassword || newPassword.length < 8;
    showConfirmError = !confirmPassword;
    pwdMismatch = newPassword !== confirmPassword;
    return !(showPwdError || showConfirmError || pwdMismatch);
  }
  async function saveNewPassword() {
    if (!validateNewPassword()) return;
    try {
      isPwdSaving = true;
      const res = await fetch(`${baseURL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken}`,
        },
        body: JSON.stringify({
          email: $loggedInUser?.email,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "Unable to change password");
        toast.error(msg || "Unable to change password", {
          position: "top-right",
        });
        return;
      }
      toast.success("Password updated successfully", { position: "top-right" });
      showPasswordDialog = false;
    } catch (e) {
      toast.error("Network error while changing password", {
        position: "top-right",
      });
    } finally {
      isPwdSaving = false;
    }
  }

  // Profile update variables
  let profileName = "";
  let firstName = "";
  let lastName = "";
  let profileEmail = "";
  let profilePhone = "";
  let profileAddress = "";
  let profileState = "";
  let profileNationality = "";
  let accountType: AccountType;
  let isProfileSaving = false;

  // Profile validation errors
  let showProfileNameError = false;
  let showFirstNameError = false;
  let showLastNameError = false;
  let showProfilePhoneError = false;
  let showProfileStateError = false;
  let showAccountTypeError = false;

  // Popover states
  let openProfileStateSelection = writable<boolean>(false);
  let openAccountTypeSelection = writable<boolean>(false);

  function closeProfileStateAndFocusTrigger(triggerId: string) {
    openProfileStateSelection.update(() => false);
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  function closeAccountTypeAndFocusTrigger(triggerId: string) {
    openAccountTypeSelection.update(() => false);
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  function openUpdateProfile() {
    updateProfileDialog = true;
    loadProfileData();
  }

  function loadProfileData() {
    if (userDetails) {
      profileName = userDetails.name || "";
      firstName = userDetails.firstName || "";
      lastName = userDetails.lastName || "";
      profileEmail = userDetails.email || user?.email || "";
      profilePhone = userDetails.phoneNumber || "";
      profileAddress = userDetails.address || "";
      profileState = userDetails.state || "";
      profileNationality = userDetails.nationality || "";
      accountType = userDetails.accountType;
    }
    // Reset errors
    showProfileNameError = false;
    showFirstNameError = false;
    showLastNameError = false;
    showProfilePhoneError = false;
    showProfileStateError = false;
    showAccountTypeError = false;
  }

  function validateProfileUpdate(): boolean {
    showProfileNameError =
      accountType === AccountType.Corporate &&
      (!profileName || profileName.trim() === "");
    showFirstNameError = !firstName || firstName.trim() === "";
    showLastNameError = !lastName || lastName.trim() === "";
    showProfilePhoneError = profilePhone
      ? !isValidPhoneNumber(profilePhone, "NG")
      : false;
    // showProfileStateError = !profileState || profileState.trim() === "";
    showAccountTypeError = !accountType;

    return !(
      showProfileNameError ||
      showFirstNameError ||
      showLastNameError ||
      showProfilePhoneError ||
      showAccountTypeError
    );
  }

  async function saveProfileUpdate() {
    if (!validateProfileUpdate()) return;

    try {
      isProfileSaving = true;
      const response = await fetch(`${baseURL}/api/Auth/UpdateProfile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${$loggedInToken}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          name: profileName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: profilePhone,
          address: profileAddress.trim(),
          accountType: accountType,
        }),
      });

      if (response.ok) {
        // Update stores and cookies
        loggedInUser.update((currentUser) => ({
          ...currentUser,
          id: currentUser?.id || user?.id || "",
          name: profileName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: profilePhone,
          address: profileAddress.trim(),
          state: profileState,
          nationality: profileNationality.trim(),
          accountType: accountType,
        }));

        // Update cookie
        const userCookieData = parseLoggedInUser(document.cookie);
        if (userCookieData) {
          userCookieData.name = profileName.trim();
          userCookieData.firstName = firstName.trim();
          userCookieData.lastName = lastName.trim();
          userCookieData.phoneNumber = profilePhone;
          userCookieData.address = profileAddress.trim();
          userCookieData.state = profileState;
          userCookieData.nationality = profileNationality.trim();
          userCookieData.accountType = accountType;
          const userCookie = `user=${encodeURIComponent(JSON.stringify(userCookieData))}; path=/`;
          document.cookie = userCookie;
        }

        // Refresh user details
        await loadUserDetails();

        toast.success("Profile updated successfully", {
          position: "top-right",
        });
        updateProfileDialog = false;
      } else {
        const errorMsg = await response
          .text()
          .catch(() => "Failed to update profile");
        toast.error(errorMsg, {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Network error while updating profile", {
        position: "top-right",
      });
    } finally {
      isProfileSaving = false;
    }
  }
</script>

<Toaster />

<Dialog.Root bind:open={showCorrDialog}>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title class="text-2xl font-semibold">
        Default Correspondence
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        {correspondenceDescription}
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="name" class="text-sm font-medium">Correspondence Name</Label
        >
        <Input
          bind:value={name}
          id="name"
          class="transition-all"
          placeholder="Enter full name"
        />
        {#if showNameError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Name is required
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="number" class="text-sm font-medium">Phone Number</Label>
        <Input
          bind:value={phoneNumber}
          id="number"
          class="transition-all"
          placeholder="+234 xxx xxx xxxx"
        />
        {#if showPhoneError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Invalid Nigerian phone number
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="email" class="text-sm font-medium">Email Address</Label>
        <Input
          bind:value={email}
          id="email"
          type="email"
          class="transition-all"
          placeholder="name@example.com"
        />
        {#if showEmailError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Invalid email address
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="address" class="text-sm font-medium">Address</Label>
        <Textarea
          bind:value={address}
          id="address"
          class="transition-all min-h-[80px]"
          placeholder="Enter full address"
        />
        {#if showAddressError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Address is required
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label class="text-sm font-medium">State</Label>
        <Popover.Root open={$openCitySelection} let:ids>
          <Popover.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              variant="outline"
              role="combobox"
              aria-expanded={$openCitySelection}
              class="w-full justify-between font-normal"
            >
              <span class={cn(!state && "text-muted-foreground")}>
                {state !== "" && state !== null ? state : "Select a state"}
              </span>
              <Icon
                icon="ph:caret-up-down"
                width="1.2rem"
                height="1.2rem"
                class="opacity-50 shrink-0"
              />
            </Button>
          </Popover.Trigger>
          <Popover.Content class="w-full p-0">
            <Command.Root>
              <Command.Input placeholder="Search states..." class="h-9" />
              <Command.Empty>No states found.</Command.Empty>
              <Command.Group class="max-h-[200px] overflow-y-auto">
                {#each nigeriaStates as stateselect}
                  <Command.Item
                    value={stateselect}
                    onSelect={(currentValue) => {
                      state = currentValue;
                      closeCountryAndFocusTrigger(ids.trigger);
                    }}
                  >
                    <Icon
                      icon="ph:check"
                      class={cn(
                        "mr-2 h-4 w-4",
                        state !== stateselect && "text-transparent",
                      )}
                    />
                    {stateselect}
                  </Command.Item>
                {/each}
              </Command.Group>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
        {#if showStateError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            State is required
          </p>
        {/if}
      </div>
    </div>
    <Dialog.Footer>
      <Button
        on:click={() => saveNewCorrespondence()}
        disabled={isCorrLoading}
        class="w-full sm:w-auto"
      >
        {#if isCorrLoading}
          <Icon
            icon="line-md:loading-loop"
            width="1.2rem"
            height="1.2rem"
            class="mr-2"
          />
        {/if}
        Save Changes
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
<Dialog.Root bind:open={updateProfileDialog}>
  <Dialog.Content class="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
    <Dialog.Header class="pb-4 border-b">
      <Dialog.Title class="text-xl font-semibold tracking-tight">
        Update Profile
      </Dialog.Title>
      <Dialog.Description class="text-sm text-muted-foreground">
        Manage your personal information and account settings.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-y-auto py-6 px-1">
      <div class="grid gap-6">
        <!-- Personal Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            <Icon icon="ph:user-circle" width="1.2rem" height="1.2rem" />
            Personal Information
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName" class="text-sm font-medium"
                >First Name <span class="text-red-500">*</span></Label
              >
              <Input
                bind:value={firstName}
                id="firstName"
                class="h-11"
                placeholder="John"
              />
              {#if showFirstNameError}
                <p class="text-xs text-red-600 flex items-center gap-1">
                  <Icon
                    icon="ph:warning-circle"
                    width="0.875rem"
                    height="0.875rem"
                  />
                  First name is required
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="lastName" class="text-sm font-medium"
                >Last Name <span class="text-red-500">*</span></Label
              >
              <Input
                bind:value={lastName}
                id="lastName"
                class="h-11"
                placeholder="Doe"
              />
              {#if showLastNameError}
                <p class="text-xs text-red-600 flex items-center gap-1">
                  <Icon
                    icon="ph:warning-circle"
                    width="0.875rem"
                    height="0.875rem"
                  />
                  Last name is required
                </p>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="profileName" class="text-sm font-medium">
              Name <span class="text-red-500">*</span>
            </Label>
            <Input
              bind:value={profileName}
              id="profileName"
              class="h-11"
              placeholder="John Doe"
            />
            {#if showProfileNameError}
              <p class="text-xs text-red-600 flex items-center gap-1">
                <Icon
                  icon="ph:warning-circle"
                  width="0.875rem"
                  height="0.875rem"
                />
                Company Name is required
              </p>
            {/if}
          </div>
        </div>

        <!-- Account Type Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            <Icon
              icon="ph:identification-card"
              width="1.2rem"
              height="1.2rem"
            />
            Account Type
          </div>

          <div class="space-y-2">
            <Label class="text-sm font-medium"
              >Account Type <span class="text-red-500">*</span></Label
            >
            <Popover.Root bind:open={$openAccountTypeSelection} let:ids>
              <Popover.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  variant="outline"
                  role="combobox"
                  aria-expanded={$openAccountTypeSelection}
                  class="w-full h-11 justify-between font-normal"
                >
                  <span class={cn(!accountType && "text-muted-foreground")}>
                    {#if accountType === AccountType.Individual}
                      <span class="flex items-center gap-2">
                        <Icon icon="ph:user" width="1rem" height="1rem" />
                        Individual
                      </span>
                    {:else if accountType === AccountType.Corporate}
                      <span class="flex items-center gap-2">
                        <Icon icon="ph:buildings" width="1rem" height="1rem" />
                        Corporate / Organization
                      </span>
                    {:else}
                      Select account type
                    {/if}
                  </span>
                  <Icon
                    icon="ph:caret-up-down"
                    width="1rem"
                    height="1rem"
                    class="opacity-50 shrink-0"
                  />
                </Button>
              </Popover.Trigger>
              <Popover.Content class="w-[--radix-popover-trigger-width] p-0">
                <Command.Root>
                  <Command.Group>
                    <Command.Item
                      value="individual"
                      onSelect={() => {
                        accountType = AccountType.Individual;
                        closeAccountTypeAndFocusTrigger(ids.trigger);
                      }}
                      class="flex items-center gap-3 py-3"
                    >
                      <Icon
                        icon="ph:check"
                        class={cn(
                          "h-4 w-4",
                          accountType !== AccountType.Individual &&
                            "text-transparent",
                        )}
                      />
                      <Icon
                        icon="ph:user"
                        width="1.25rem"
                        height="1.25rem"
                        class="text-blue-600"
                      />
                      <div class="flex flex-col">
                        <span class="font-medium">Individual</span>
                        <span class="text-xs text-muted-foreground"
                          >Personal account for individuals</span
                        >
                      </div>
                    </Command.Item>
                    <Command.Item
                      value="corporate"
                      onSelect={() => {
                        accountType = AccountType.Corporate;
                        closeAccountTypeAndFocusTrigger(ids.trigger);
                      }}
                      class="flex items-center gap-3 py-3"
                    >
                      <Icon
                        icon="ph:check"
                        class={cn(
                          "h-4 w-4",
                          accountType !== AccountType.Corporate &&
                            "text-transparent",
                        )}
                      />
                      <Icon
                        icon="ph:buildings"
                        width="1.25rem"
                        height="1.25rem"
                        class="text-emerald-600"
                      />
                      <div class="flex flex-col">
                        <span class="font-medium">Corporate / Organization</span
                        >
                        <span class="text-xs text-muted-foreground"
                          >Business or organizational account</span
                        >
                      </div>
                    </Command.Item>
                  </Command.Group>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>
            {#if showAccountTypeError}
              <p class="text-xs text-red-600 flex items-center gap-1">
                <Icon
                  icon="ph:warning-circle"
                  width="0.875rem"
                  height="0.875rem"
                />
                Account type is required
              </p>
            {/if}
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            <Icon icon="ph:phone" width="1.2rem" height="1.2rem" />
            Contact Information
          </div>

          <div class="space-y-2">
            <Label for="profileEmail" class="text-sm font-medium"
              >Email Address</Label
            >
            <div class="relative">
              <Input
                bind:value={profileEmail}
                id="profileEmail"
                type="email"
                class="h-11 bg-slate-50 dark:bg-slate-800/50 pr-10"
                placeholder="name@example.com"
                disabled
              />
              <Icon
                icon="ph:lock-simple"
                width="1rem"
                height="1rem"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <!-- <p class="text-xs text-muted-foreground">
              Contact support to change your email address.
            </p> -->
          </div>

          <div class="space-y-2">
            <Label for="profilePhone" class="text-sm font-medium"
              >Phone Number</Label
            >
            <Input
              bind:value={profilePhone}
              id="profilePhone"
              class="h-11"
              placeholder="+234 xxx xxx xxxx"
            />
            {#if showProfilePhoneError}
              <p class="text-xs text-red-600 flex items-center gap-1">
                <Icon
                  icon="ph:warning-circle"
                  width="0.875rem"
                  height="0.875rem"
                />
                Please enter a valid Nigerian phone number
              </p>
            {/if}
          </div>
        </div>

        <!-- Address Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider"
          >
            <Icon icon="ph:map-pin" width="1.2rem" height="1.2rem" />
            Address
          </div>

          <div class="space-y-2">
            <Label for="profileAddress" class="text-sm font-medium"
              >Address</Label
            >
            <Textarea
              bind:value={profileAddress}
              id="profileAddress"
              class="min-h-[80px] resize-none"
              placeholder="Enter your full address"
            />
          </div>
          <div class="space-y-2">
            <Label for="profileNationality" class="text-sm font-medium"
              >Nationality</Label
            >
            <Textarea
              bind:value={profileNationality}
              id="profileNationality"
              class="min-h-[80px] resize-none"
              placeholder="Enter your nationality"
            />
          </div>
          <!-- <div class="space-y-2">
            <Label class="text-sm font-medium"
              >State <span class="text-red-500">*</span></Label
            >
            <Popover.Root bind:open={$openProfileStateSelection} let:ids>
              <Popover.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  variant="outline"
                  role="combobox"
                  aria-expanded={$openProfileStateSelection}
                  class="w-full h-11 justify-between font-normal"
                >
                  <span class={cn(!profileState && "text-muted-foreground")}>
                    {profileState || "Select your state"}
                  </span>
                  <Icon
                    icon="ph:caret-up-down"
                    width="1rem"
                    height="1rem"
                    class="opacity-50 shrink-0"
                  />
                </Button>
              </Popover.Trigger>
              <Popover.Content class="w-[--radix-popover-trigger-width] p-0">
                <Command.Root>
                  <Command.Input placeholder="Search states..." class="h-10" />
                  <Command.Empty>No state found.</Command.Empty>
                  <Command.Group class="max-h-[200px] overflow-y-auto">
                    {#each nigeriaStates as stateOption}
                      <Command.Item
                        value={stateOption}
                        onSelect={(currentValue) => {
                          profileState = currentValue;
                          closeProfileStateAndFocusTrigger(ids.trigger);
                        }}
                      >
                        <Icon
                          icon="ph:check"
                          class={cn(
                            "mr-2 h-4 w-4",
                            profileState !== stateOption && "text-transparent",
                          )}
                        />
                        {stateOption}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>
            {#if showProfileStateError}
              <p class="text-xs text-red-600 flex items-center gap-1">
                <Icon
                  icon="ph:warning-circle"
                  width="0.875rem"
                  height="0.875rem"
                />
                State is required
              </p>
            {/if}
          </div> -->
        </div>
      </div>
    </div>

    <Dialog.Footer
      class="pt-4 border-t flex flex-col-reverse sm:flex-row gap-2"
    >
      <Button
        variant="ghost"
        on:click={() => (updateProfileDialog = false)}
        class="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button
        on:click={() => saveProfileUpdate()}
        disabled={isProfileSaving}
        class="w-full sm:w-auto gap-2"
      >
        {#if isProfileSaving}
          <Icon icon="line-md:loading-loop" width="1.2rem" height="1.2rem" />
          Saving...
        {:else}
          <Icon icon="ph:check" width="1.2rem" height="1.2rem" />
          Save Changes
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Change Password Dialog -->
<Dialog.Root bind:open={showPasswordDialog}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title class="text-2xl font-semibold">
        Change Password
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        Enter a new password and confirm it. Minimum 8 characters.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="newPassword" class="text-sm font-medium">New Password</Label
        >

        <div class="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            bind:value={newPassword}
            placeholder="Enter new password"
            class="pr-10"
          />

          <button
            type="button"
            class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
            on:click={() => (showNewPassword = !showNewPassword)}
          >
            <Icon
              icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"}
              width="1.2rem"
              height="1.2rem"
            />
          </button>
        </div>

        {#if showPwdError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Password must be at least 8 characters
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="confirmPassword" class="text-sm font-medium"
          >Confirm Password</Label
        >

        <div class="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            bind:value={confirmPassword}
            placeholder="Re-enter new password"
            class="pr-10"
          />

          <button
            type="button"
            class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
            on:click={() => (showConfirmPassword = !showConfirmPassword)}
          >
            <Icon
              icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
              width="1.2rem"
              height="1.2rem"
            />
          </button>
        </div>

        {#if showConfirmError}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Please confirm your new password
          </p>
        {/if}

        {#if pwdMismatch}
          <p class="text-sm text-red-600 flex items-center gap-1">
            <Icon icon="ph:warning-circle" width="1rem" height="1rem" />
            Passwords do not match
          </p>
        {/if}
      </div>
    </div>
    <Dialog.Footer>
      <Button
        variant="outline"
        on:click={() => (showPasswordDialog = false)}
        class="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button
        on:click={saveNewPassword}
        disabled={isPwdSaving}
        class="w-full sm:w-auto"
      >
        {#if isPwdSaving}
          <Icon
            icon="line-md:loading-loop"
            width="1.2rem"
            height="1.2rem"
            class="mr-2"
          />
        {/if}
        Save Password
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
{#if !profileLoading}
  <div
    class="min-h-screen bg-slate-50 dark:bg-slate-950
  [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)]
  dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]
  [background-size:24px_24px]"
  >
    <div class="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl md:text-4xl font-semibold tracking-tight">
          Profile Settings
        </h1>
        <p class="text-sm text-muted-foreground mt-2 max-w-xl">
          Manage your account information
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl
      rounded-2xl shadow-lg shadow-black/5
      border border-white/40 dark:border-slate-800 overflow-hidden"
      >
        <!-- Profile Section -->
        <div class="p-6 md:p-8 space-y-10">
          <!-- Personal Info -->
          <section>
            <h2
              class="text-lg font-semibold tracking-tight mb-6 flex items-center gap-2"
            >
              <Icon icon="ph:user-circle" width="1.4rem" height="1.4rem" />
              Personal Information
            </h2>

            <div class="grid gap-4 md:grid-cols-2">
              <div
                class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 md:col-span-2"
              >
                <Label class="text-xs text-muted-foreground">Name</Label>
                <p class="mt-1 text-sm font-semibold">
                  {userDetails?.name || "—"}
                </p>
              </div>

              {#if userDetails?.accountType !== AccountType.Corporate}
                <div
                  class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40"
                >
                  <Label class="text-xs text-muted-foreground">First Name</Label
                  >
                  <p class="mt-1 text-sm font-semibold">
                    {userDetails?.firstName || "—"}
                  </p>
                </div>

                <div
                  class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40"
                >
                  <Label class="text-xs text-muted-foreground">Last Name</Label>
                  <p class="mt-1 text-sm font-semibold">
                    {userDetails?.lastName || "—"}
                  </p>
                </div>
              {/if}

              <div class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40">
                <Label class="text-xs text-muted-foreground">Email</Label>
                <p class="mt-1 text-sm font-semibold break-all">
                  {userDetails?.email || user?.email || "—"}
                </p>
              </div>

              <div class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40">
                <Label class="text-xs text-muted-foreground">Phone Number</Label
                >
                <p class="mt-1 text-sm font-semibold">
                  {userDetails?.phoneNumber || "—"}
                </p>
              </div>

              {#if userDetails?.accountType !== undefined}
                <div
                  class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40"
                >
                  <Label class="text-xs text-muted-foreground"
                    >Account Type</Label
                  >
                  <p class="mt-1 text-sm font-semibold">
                    {mapAccountTypeToString(userDetails.accountType)}
                  </p>
                </div>
              {/if}
              <div class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40">
                <Label class="text-xs text-muted-foreground">Nationality</Label>
                <p class="mt-1 text-sm font-semibold">
                  {userDetails?.nationality || "—"}
                </p>
              </div>
              <div
                class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 md:col-span-2"
              >
                <Label class="text-xs text-muted-foreground">Address</Label>
                <p class="mt-1 text-sm font-semibold">
                  {userDetails?.address || "—"}
                </p>
              </div>
            </div>
          </section>

          <!-- Role(s) -->
          {#if !userDetails?.userRoles.includes(UserRoles.User)}
            <section>
              <h2
                class="text-lg font-semibold tracking-tight mb-6 flex items-center gap-2"
              >
                <Icon icon="ph:user-gear" width="1.4rem" height="1.4rem" />
                Role(s)
              </h2>

              <div class="grid gap-4 md:grid-cols-2">
                {#if userDetails?.userRoles && userDetails.userRoles.length > 0}
                  <div
                    class="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 md:col-span-2"
                  >
                    <!-- <Label class="text-xs text-muted-foreground">Roles</Label> -->

                    <div class="flex flex-wrap gap-2 mt-2">
                      {#each userDetails.userRoles as role}
                        <span
                          class="px-3 py-1 text-xs font-medium rounded-md
                bg-blue-500/10 text-blue-600 dark:text-blue-400
                ring-1 ring-inset ring-blue-500/20"
                        >
                          {mapRoleToString(role)}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </section>
          {/if}
        </div>

        <!-- Actions -->
        <div
          class="p-6 md:p-8 bg-slate-100/40 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-slate-800"
        >
          <h2
            class="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2"
          >
            <Icon icon="ph:gear" width="1.4rem" height="1.4rem" />
            Account Actions
          </h2>

          <div class="flex flex-wrap gap-3">
            {#if userDetails?.accountType !== AccountType.Officer}
              <Button
                on:click={() => openUpdateProfile()}
                variant="outline"
                class="gap-2 rounded-lg"
              >
                <Icon icon="ph:user" width="1.1rem" height="1.1rem" />
                Update Profile
              </Button>
            {/if}

            <!-- <Button
              on:click={() => defaultCorrespondence()}
              variant="outline"
              class="gap-2 rounded-lg"
            >
              <Icon icon="ph:envelope" width="1.1rem" height="1.1rem" />
              Default Correspondence
            </Button> -->

            <Button
              on:click={openChangePassword}
              variant="outline"
              class="gap-2 rounded-lg"
            >
              <Icon icon="ph:lock-key" width="1.1rem" height="1.1rem" />
              Change Password
            </Button>

            <Button
              on:click={logout}
              variant="destructive"
              class="gap-2 rounded-lg"
            >
              <Icon icon="ph:sign-out" width="1.1rem" height="1.1rem" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div
    class="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950"
  >
    <div class="text-center space-y-4">
      <Icon
        icon="line-md:loading-loop"
        width="3rem"
        height="3rem"
        class="text-blue-600 dark:text-blue-400"
      />
      <p class="text-muted-foreground">Loading profile...</p>
    </div>
  </div>
{/if}
