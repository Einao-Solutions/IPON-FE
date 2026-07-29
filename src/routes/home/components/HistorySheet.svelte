<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet/index";
  import { type DataHistory, getStatusColour } from "$lib/helpers";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import { mapDateToString } from "./dashboardutils";
  import { mapStatusToString } from "$lib/designutils";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  export const title: string = "";
  export const description: string = "";
  export let dataList: DataHistory[];
  export let isVisible: boolean = false;
  export let onclose: () => void;
</script>

<div>
  <Sheet.Root
    bind:open={isVisible}
    onOpenChange={(state) => {
      if (state === false) {
        onclose();
      }
    }}
  >
    <Sheet.Content side="right" class="overflow-y-auto w-[600px]">
      <!-- Header -->
      <div class="pb-6 border-b mb-6">
        <h2 class="text-2xl font-semibold text-gray-900">Status History</h2>
      </div>

      <!-- Timeline -->
      <div class="relative pl-8 space-y-8">
        {#each dataList as data, index}
          <div class="relative">
            <!-- Timeline line -->
            {#if index !== dataList.length - 1}
              <div
                class="absolute left-[-1.4rem] top-8 w-px h-full bg-gradient-to-b from-gray-300 to-gray-200"
              ></div>
            {/if}

            <!-- Timeline dot -->
            <div
              class="absolute left-[-1.75rem] top-3 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white shadow-sm"
            ></div>

            <!-- Content card -->
            <div
              class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <!-- Header with date and user -->
              <div class="flex justify-between items-start mb-3 gap-2">
                <p
                  class="text-xs font-medium text-gray-500 uppercase tracking-wide shrink-0"
                >
                  {mapDateToString(data.date)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  title={data.user}
                  class="gap-2 h-8 -mt-1 -mr-2 text-gray-600 hover:text-gray-900 min-w-0 max-w-[60%]"
                >
                  <Icon
                    icon="radix-icons:avatar"
                    width="1rem"
                    height="1rem"
                    class="shrink-0"
                  />
                  <span class="text-sm truncate">{data.user}</span>
                </Button>
              </div>

              <!-- Status change -->
              {#if data.beforeStatus !== null || data.afterStatus !== null}
                <div
                  class="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-md"
                >
                  <AppStatusTag value={data.beforeStatus ?? undefined} />
                  <Icon
                    icon="icomoon-free:arrow-right"
                    width="1.2rem"
                    height="1.2rem"
                    class="text-gray-400"
                  />
                  <AppStatusTag value={data.afterStatus ?? undefined} />
                </div>
              {/if}

              <!-- Message -->
              {#if data.message}
                <p class="text-sm text-gray-700 leading-relaxed">
                  {data.message}
                </p>
              {/if}

              {#if data.attachmentUrl}
                <div class="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    class="gap-2 h-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    on:click={() => window.open(data.attachmentUrl, "_blank")}
                  >
                    <Icon
                      icon="mdi:file-document-outline"
                      width="1rem"
                      height="1rem"
                    />
                    <span class="text-sm">View Document</span>
                  </Button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </Sheet.Content>
  </Sheet.Root>
</div>
