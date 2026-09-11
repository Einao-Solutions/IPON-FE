<script lang="ts">
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button/index";
  import { get } from "svelte/store";
  import {
    adjustmentsMade,
    adjustmentType,
    applicationData,
    changesData,
    changesMade,
    formsData,
    loggedInUser,
    newDataApp,
    viewUpdatesMade,
  } from "$lib/store";
  import {
    ApplicationStatuses,
    type PatentData,
    type RevisionsType,
    UserRoles,
  } from "$lib/helpers";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isLoading: boolean = true;
  let loadError = "";
  function loadData() {
    isLoading = true;
    const type = get(adjustmentType);
    if (type === 1 || type === null) {
      const rvs = localStorage.getItem("revisions");
      if (rvs === null) {
        // load user made adjustments
        const changes = get(adjustmentsMade);
        if (changes) {
          const revision: RevisionsType[] = [];
          const requiresPayment: { type: string; payment: boolean }[] = [];
          const latestData = get(newDataApp);
          const oldData = get(applicationData);
          if (!oldData || !latestData) {
            throw new Error(
              "Application data is unavailable. Please reopen the application.",
            );
          }
          changes.forEach((change) => {
            if (
              !Object.prototype.hasOwnProperty.call(oldData, change) ||
              !Object.prototype.hasOwnProperty.call(latestData, change)
            ) {
              throw new Error(
                "A revision contains an invalid application field.",
              );
            }
            const field = change as keyof PatentData;
            let _requiresPayment: boolean = false;
            if (
              oldData.fileStatus === null ||
              ![
                ApplicationStatuses.AwaitingPayment,
                ApplicationStatuses.AwaitingSearch,
                ApplicationStatuses.FormalityFail,
                ApplicationStatuses.Re_conduct,
              ].includes(oldData.fileStatus)
            ) {
              if (
                oldData.fieldStatus?.[change] == undefined ||
                oldData.fieldStatus?.[change] == 0
              ) {
                _requiresPayment = true;
              }
            } else {
              _requiresPayment = false;
            }
            revision.push({
              id: crypto.randomUUID(),
              oldTitle: oldData[field],
              newTitle: latestData[field],
              status: _requiresPayment
                ? ApplicationStatuses.AwaitingSave
                : ApplicationStatuses.AwaitingConfirmation,
              dateTime: Date.now(),
              field: change,
              statusHistory: [],
            });
            requiresPayment.push({
              type: change,
              payment: _requiresPayment,
            });
          });
          const changesMade = {
            fileData: oldData,
            data: revision,
            requiresPayment: requiresPayment,
            canPassFormality: false,
            canPassApproval: false,
            isStaffOrAdmin: false,
            isUserOrAdmin: true,
          };
          localStorage.setItem("revisions", JSON.stringify(changesMade));
          // changesData.set(changesMade);
          isLoading = false;
          return;
        } else {
          changesData.set({
            fileData: null,
            data: null,
            requiresPayment: null,
            canPassFormality: false,
            canPassApproval: false,
          });
          throw new Error(
            "No revisions are available. Please reopen the application.",
          );
        }
      } else {
        isLoading = false;
        return;
      }
    } else if (type === 3) {
      // view particular update
      const oldData = get(applicationData);
      let _requiresPayment: boolean = false;
      const updateMade = get(viewUpdatesMade);
      const user = get(loggedInUser);
      if (!oldData || !updateMade || !updateMade.fieldToChange) {
        throw new Error(
          "Revision data is unavailable. Please reopen the application.",
        );
      }
      const isStaffOrAdmin = [UserRoles.Tech, UserRoles.SuperAdmin].some(
        (role) => user?.userRoles.includes(role) ?? false,
      );
      if (
        oldData.fileStatus !== null &&
        [0, 11, 12].includes(oldData.fileStatus)
      ) {
        if (
          oldData.fieldStatus?.[updateMade.fieldToChange] == undefined ||
          oldData.fieldStatus?.[updateMade.fieldToChange] == 0
        ) {
          _requiresPayment = true;
        }
      } else {
        _requiresPayment = false;
      }
      const revision: RevisionsType = {
        id: updateMade?.id,
        status: updateMade?.currentStatus,
        statusHistory: updateMade?.statusHistory,
        field: updateMade?.fieldToChange,
        newTitle:
          typeof updateMade.newValue === "string"
            ? JSON.parse(updateMade.newValue)
            : updateMade.newValue,
        oldTitle:
          typeof updateMade.oldValue === "string"
            ? JSON.parse(updateMade.oldValue)
            : updateMade.oldValue,
        dateTime: Number.isFinite(Date.parse(updateMade.applicationDate))
          ? Date.parse(updateMade.applicationDate)
          : null,
      };
      isLoading = false;
      const rev_data = {
        fileData: oldData,
        data: [revision],
        requiresPayment: [
          { type: updateMade.fieldToChange, payment: _requiresPayment },
        ],
        canPassFormality: false,
        canPassApproval: false,
        isStaffOrAdmin: isStaffOrAdmin,
        isUserOrAdmin: [UserRoles.Tech, UserRoles.User].some(
          (role) => user?.userRoles.includes(role) ?? false,
        ),
      };
      // changesData.set(rev_data);
      localStorage.setItem("revisions", JSON.stringify(rev_data));
    } else {
      throw new Error(
        "No revisions are available. Please reopen the application.",
      );
    }
  }

  onMount(() => {
    try {
      loadData();
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : "Unable to load revisions.";
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="flex items-center px-2 py-2 justify-between">
  <Button
    size="icon"
    variant="outline"
    on:click={() => {
      changesData.set({});
      changesMade.set(null);
      formsData.set([]);
      window.history.back();
    }}
  >
    <Icon icon="openmoji:return" width="1.2rem" height="1.2rem" />
  </Button>
  <p>Revisions Made</p>
  <Button
    on:click={() => {
      changesData.set({});
      changesMade.set(null);
      formsData.set([]);
      goto("/home/dashboard");
    }}>Home</Button
  >
</div>
<div>
  {#if isLoading}
    <p>loading......</p>
  {:else if loadError}
    <p role="alert">{loadError}</p>
  {:else}
    <slot />
  {/if}
</div>
