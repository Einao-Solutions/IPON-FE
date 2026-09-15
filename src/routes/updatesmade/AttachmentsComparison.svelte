<script lang="ts">
  import { attachmentDiffs } from "../application/apphelper";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import type { PatentData } from "$lib/helpers";
  import { mapAttchToString } from "../dataview/datahelpers";
  export let oldData: PatentData["attachments"] | string;
  export let newData: PatentData["attachments"] | string;
  let parsedOldData: NonNullable<PatentData["attachments"]> = [];
  let parsedNewData: NonNullable<PatentData["attachments"]> = [];
  let uploadDiffs: string[] = [];
  $: {
    if (typeof oldData === "string") {
      parsedOldData = JSON.parse(oldData) ?? [];
    } else {
      parsedOldData = oldData ?? [];
    }
    if (typeof newData === "string") {
      parsedNewData = JSON.parse(newData) ?? [];
    } else {
      parsedNewData = newData ?? [];
    }
    uploadDiffs = attachmentDiffs(parsedOldData, parsedNewData);
  }
  function viewAttachment(name: string) {
    const documentUrl = parsedNewData.find(
      (attachment) => attachment.name === name,
    )?.url[0];
    if (documentUrl) {
      window.open(documentUrl, "_blank", "noopener,noreferrer");
    }
  }
</script>

<div class="md:flex gap-2">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-1">s/n</Table.Head>
        <Table.Head>Name</Table.Head>
        <Table.Head>old data</Table.Head>
        <Table.Head>new data</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each uploadDiffs as dif, i (i)}
        <Table.Row>
          <Table.Cell class="w-1">{i + 1}</Table.Cell>
          <Table.Cell>{mapAttchToString(dif)}</Table.Cell>
          <Table.Cell>
            {#if parsedOldData.find((attachment) => attachment.name === dif)?.url[0]}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={parsedOldData.find(
                  (attachment) => attachment.name === dif,
                )?.url[0]}>View Old file</a
              >
            {:else}
              <p>-</p>
            {/if}
          </Table.Cell>
          <Table.Cell>
            <Button
              disabled={!parsedNewData.find(
                (attachment) => attachment.name === dif,
              )?.url[0]}
              on:click={() => {
                viewAttachment(dif);
              }}
              variant="outline">View New file</Button
            >
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
