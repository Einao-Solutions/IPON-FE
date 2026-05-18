<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Label } from "$lib/components/ui/label";
  import * as Popover from "$lib/components/ui/popover/index";
  import * as Command from "$lib/components/ui/command/index";
  import { writable } from "svelte/store";
  import { tradeMarkClassesMap } from "$lib/constants";
  import { cn } from "$lib/utils";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    formsData,
    savePageData,
    applicationScreen,
    pageSaveStatus,
    validatePage,
    validatedPages,
    applicationMode,
    applicationData,
    changesMade,
  } from "$lib/store";
  import { onMount } from "svelte";

  interface BasicFormData {
    title?: string;
    class?: number;
    description?: string;
    additionalDescription?: string;
    type?: number;
    disclaimer?: string;
    logo?: number;
    markclass?: number;
    markType?: number;
    markLogoDesc?: number;
  }

  let title = writable<string | undefined>(undefined);
  let disclaimer = writable<string | undefined>(undefined);
  let markclass = writable<number | undefined>(undefined);
  let markType = writable<number | undefined>(undefined);
  let classDescription = writable<string | undefined>(undefined);
  let additionalDescription = writable<string | undefined>(undefined);
  let markLogoDesc = writable<number | undefined>(undefined);
  let isclassOpen: boolean = false;
  let isLogoDescOpen: boolean = false;
  let ismarkTypeOpen: boolean = false;
  let showTitleError: boolean = false;
  let showClassError: boolean = false;
  let showTypeError: boolean = false;
  let showLogoError: boolean = false;
  let showDisclaimerError: boolean = false;
  savePageData.subscribe((toSave) => {
    if (toSave === "basicTrade" && $applicationScreen === 0) {
      if ($formsData === null) {
        formsData.set([
          {
            name: "basic",
            data: {
              title: $title,
              class: $markclass,
              description: $classDescription,
			  additionalDescription: $additionalDescription,
              type: $markType,
              disclaimer: $disclaimer,
              logo: $markLogoDesc,
            },
          },
        ]);
      } else {
        formsData.update((forms) => {
          let index = forms!.findIndex((x) => x.name === "basic");
          if (index === -1) {
            forms!.push({
              name: "basic",
              data: {
                title: $title,
                class: $markclass,
                description: $classDescription,
				additionalDescription: $additionalDescription,
                type: $markType,
                disclaimer: $disclaimer,
                logo: $markLogoDesc,
              },
            });
          } else {
            forms![index].data = {
              title: $title,
              class: $markclass,
              description: $classDescription,
			  additionalDescription: $additionalDescription,
              type: $markType,
              disclaimer: $disclaimer,
              logo: $markLogoDesc,
            };
          }
          return [...forms!];
        });
      }
      pageSaveStatus.set(true);
    }
  });

  validatePage.subscribe((x) => {
    if (x === "basicTrade") {
      const status = validate();
      if ($validatedPages === null) {
        validatedPages.set([{ name: "basicTrade", status: status }]);
        return;
      } else {
        validatedPages.update((pages) => {
          pages = pages!;
          const index = pages.findIndex((x) => x.name === "basicTrade");
          if (index === -1) {
            pages.push({ name: "basicTrade", status: status });
          } else {
            pages[index].status = status;
          }
          return [...pages];
        });
      }
    }
  });

  let originalData: BasicFormData = {};
  onMount(() => {
    let parsedData =
      ($formsData?.filter((x) => x.name == "basic")[0]?.data as BasicFormData | null) || null;
    if ($applicationMode === 2) {
      // creation mode
      title.set(parsedData?.title ?? undefined);
      disclaimer.set(parsedData?.disclaimer ?? undefined);
      markclass.set(parsedData?.class ?? undefined);
      classDescription.set(parsedData?.description ?? undefined);
	   additionalDescription.set(parsedData?.additionalDescription ?? undefined);
      markType.set(parsedData?.type ?? undefined);
      markLogoDesc.set(parsedData?.logo ?? undefined);
    }
    if ($applicationMode === 1) {
      originalData = parsedData || {
        title: $applicationData?.titleOfTradeMark ?? undefined,
        disclaimer: $applicationData?.trademarkDisclaimer ?? undefined,
        markclass: $applicationData?.trademarkClass ?? undefined,
        description: $applicationData?.trademarkClassDescription ?? undefined,
        markType: $applicationData?.trademarkType ?? undefined,
        markLogoDesc: $applicationData?.trademarkLogo ?? undefined,
      };
      $title =
        parsedData?.title ?? $applicationData?.titleOfTradeMark ?? undefined;
      $disclaimer =
        parsedData?.disclaimer ??
        $applicationData?.trademarkDisclaimer ??
        undefined;
      $markclass =
        parsedData?.markclass ?? $applicationData?.trademarkClass ?? undefined;
      $classDescription =
        parsedData?.description ??
        $applicationData?.trademarkClassDescription ??
        undefined;
	   $additionalDescription = parsedData?.additionalDescription ?? ($applicationData as any)?.trademarkAdditionalClassDescription ?? undefined;
      $markType =
        parsedData?.markType ?? $applicationData?.trademarkType ?? undefined;
      $markLogoDesc =
        parsedData?.markLogoDesc ?? $applicationData?.trademarkLogo ?? undefined;
    }
  });

  function validate(): boolean {
    showTitleError = $title === "" || $title === undefined;
    showClassError = $markclass === undefined;
    showTypeError = $markType === undefined;
    showLogoError = $markLogoDesc === undefined;
    showDisclaimerError = $disclaimer === undefined || $disclaimer === "";
    return (
      showTitleError === false &&
      showClassError === false &&
      showTypeError === false &&
      showLogoError === false &&
      showDisclaimerError === false
    );
  }

  // read and wait for update
  title.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.title) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });

  markclass.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.markclass) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });

  markType.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.markType) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });

  markLogoDesc.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.markLogoDesc) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });

  classDescription.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.description) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });
  additionalDescription.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.additionalDescription) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });
  disclaimer.subscribe((value) => {
    if ($applicationMode === 1) {
      // notify changes
      if (value !== originalData?.disclaimer) {
        changesMade.update((changes) => {
          changes = changes ?? [];
          let index = changes.findIndex((x) => x.name == "basic");
          if (index !== -1) {
            changes[index].hasChanges = true;
          } else {
            changes.push({ name: "basic", hasChanges: true });
          }
          return [...changes];
        });
      }
    }
  });
</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md space-y-6">
  <h2 class="text-2xl font-semibold text-gray-800">Trademark Information</h2>

  <!-- Title of Trademark -->
  <div>
    <label for="title" class="block font-medium mb-2">Title of Trademark</label>
    <Input
      id="title"
      bind:value={$title}
      class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      placeholder="Enter trademark title"
    />
    {#if showTitleError}
      <p class="text-red-500 text-sm mt-1">Title is required.</p>
    {/if}
  </div>

  <!-- Trademark Class -->
  <div>
    <label for="class" class="block font-medium mb-2">Trademark Class</label>
    <Popover.Root open={isclassOpen} let:ids>
      <Popover.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          variant="outline"
          role="combobox"
          aria-expanded={false}
          class="w-full max-w-xs justify-between border-gray-300 rounded-lg px-3 py-2"
        >
          <p>{$markclass ? `Class ${$markclass}` : "Select a class"}</p>
          <Icon
            icon="ph:caret-up-down-thin"
            width="1.2rem"
            height="1.2rem"
            class="opacity-50 shrink-0 ml-2"
          />
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-[250px] h-[350px] p-0 z-50">
        <Command.Root>
          <Command.Input placeholder="Search classes..." />
          <Command.Empty>No classes found.</Command.Empty>
          <Command.Group class="overflow-y-auto">
            {#each Array.from({ length: 45 }, (_, i) => i + 1) as cat, i}
              <Command.Item
                value={cat.toString()}
                onSelect={(currentValue) => {
                  $markclass = parseInt(currentValue);
                  $classDescription = tradeMarkClassesMap.get($markclass) ?? "";
                  isclassOpen = false;
                  document.getElementById(ids.trigger)?.focus();
                }}
              >
                <Icon
                  icon="basil:check-solid"
                  class={cn(
                    "mr-2 h-4 w-4",
                    $markclass !== i + 1 && "text-transparent",
                  )}
                />
                <p
                  class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1"
                >
                  {i + 1}
                </p>
                Class {cat}
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    {#if showClassError}
      <p class="text-red-500 text-sm mt-1">Trademark class is required.</p>
    {/if}
  </div>

  <!-- Class Description -->
  <div>
    <label for="classDesc" class="block font-medium mb-2">Class Description</label>
    <Textarea
      id="classDesc"
      bind:value={$classDescription}
      placeholder="Description of selected class will appear here"
      class="w-full border border-gray-300 rounded-lg px-3 py-2"
      disabled
    />
  </div>

  <!-- Additional Description -->
  <div>
    <label for="additionalDesc" class="block font-medium mb-2">Specification of Goods</label>
    <Textarea
      id="additionalDesc"
      bind:value={$additionalDescription}
      placeholder="Enter specification of goods/services (optional)"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
    />
    <!-- <p class="text-gray-500 text-xs mt-1">{$additionalDescription?.length || 0}/500</p> -->
  </div>

  <!-- Trademark Type -->
  <div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="block font-medium mb-2">Trademark Type</label>
    <Popover.Root open={ismarkTypeOpen} let:ids>
      <Popover.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          variant="outline"
          role="combobox"
          aria-expanded={false}
          class="w-full max-w-xs justify-between border-gray-300 rounded-lg px-3 py-2"
        >
          <p>{$markType !== undefined ? ["Local", "Foreign"][$markType] : "Select trademark type"}</p>
          <Icon
            icon="ph:caret-up-down-thin"
            width="1.2rem"
            height="1.2rem"
            class="opacity-50 shrink-0 ml-2"
          />
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-[250px] h-[100px] p-0 z-50">
        <Command.Root>
          <Command.Group class="overflow-y-auto">
            {#each ["Local", "Foreign"] as cat, i}
              <Command.Item
                value={cat}
                onSelect={() => {
                  $markType = i;
                  ismarkTypeOpen = false;
                  document.getElementById(ids.trigger)?.focus();
                }}
              >
                <Icon
                  icon="basil:check-solid"
                  class={cn(
                    "mr-2 h-4 w-4",
                    $markType !== i && "text-transparent",
                  )}
                />
                <p
                  class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1"
                >
                  {i + 1}
                </p>
                {cat}
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    {#if showTypeError}
      <p class="text-red-500 text-sm mt-1">Trademark type is required.</p>
    {/if}
  </div>

  <!-- Logo Description -->
  <div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="block font-medium mb-2">Logo Description</label>
    <Popover.Root open={isLogoDescOpen} let:ids>
      <Popover.Trigger asChild let:builder>
        <Button
          builders={[builder]}
          variant="outline"
          role="combobox"
          aria-expanded={false}
          class="w-full max-w-xs justify-between border-gray-300 rounded-lg px-3 py-2"
        >
          <p>
            {$markLogoDesc !== undefined ? ["Device", "Word Mark", "Word and Device"][$markLogoDesc] :
              "Select logo type"}
          </p>
          <Icon
            icon="ph:caret-up-down-thin"
            width="1.2rem"
            height="1.2rem"
            class="opacity-50 shrink-0 ml-2"
          />
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-[250px] h-[150px] p-0 z-50">
        <Command.Root>
          <Command.Group class="overflow-y-auto">
            {#each ["Device", "Word Mark", "Word and Device"] as cat, i}
              <Command.Item
                value={cat}
                onSelect={() => {
                  $markLogoDesc = i;
                  isLogoDescOpen = false;
                  document.getElementById(ids.trigger)?.focus();
                }}
              >
                <Icon
                  icon="basil:check-solid"
                  class={cn(
                    "mr-2 h-4 w-4",
                    $markLogoDesc !== i && "text-transparent",
                  )}
                />
                <p
                  class="mr-1.5 w-8 items-center flex text-center pl-2.5 border rounded-md p-1"
                >
                  {i + 1}
                </p>
                {cat}
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.Root>
      </Popover.Content>
    </Popover.Root>
    {#if showLogoError}
      <p class="text-red-500 text-sm mt-1">Logo description is required.</p>
    {/if}
  </div>

  <!-- Claims and Disclaimer -->
  <div>
    <label for="disclaimer" class="block font-medium mb-2">Claims and Disclaimer</label>
    <Textarea
      id="disclaimer"
      bind:value={$disclaimer}
      placeholder="Enter claims and disclaimer"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
    />
    {#if showDisclaimerError}
      <p class="text-red-500 text-sm mt-1">Disclaimer is required.</p>
    {/if}
  </div>
</div>
