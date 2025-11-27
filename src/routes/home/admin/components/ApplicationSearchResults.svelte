<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import {
    mapDateToStringNoDate,
    mapTypeToString,
  } from "../../components/dashboardUtils";
  import AppStatusTag from "$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte";
  import Icon from "@iconify/svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Card from "$lib/components/ui/card";
  import * as Table from "$lib/components/ui/table";
  import { baseURL } from "$lib/helpers";
  export let open = false;
  export let applications = [];
  export let fileNumber = "";
  export let loading = false;

  const dispatch = createEventDispatcher();

  function handleClose() {
    open = false;
    dispatch("close");
  }

  function handleSelectApplication(application) {
    dispatch("select", { application });
  }

  function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  async function updatePaymentId(application) {
    try {
      const newPaymentId = prompt(
        "Enter new Payment ID:",
        application.paymentId || ""
      );
      if (!newPaymentId) return;
      // Get fileNumber from session storage if not already set
      let storedFileNumber = sessionStorage.getItem("fileNumber");
      if (!fileNumber && storedFileNumber) {
        fileNumber = storedFileNumber;
      }
      const response = await fetch(`${baseURL}/api/files/UpdatePaymentId`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: fileNumber,
          applicationId: application.id,
          newPaymentId,
		  type: application.applicationType
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        alert("Failed to update payment ID: " + error);
        return;
      }

      alert("Payment ID updated successfully!");

      // Optional: update it locally so UI shows new paymentId without refetch
      application.paymentId = newPaymentId;
    } catch (error) {
      console.error("Error updating payment ID:", error);
      alert("Error updating payment ID.");
    }
  }
  let fileTitle = "Unknown File";
  if (typeof window !== "undefined") {
    fileTitle = sessionStorage.getItem("fileTitle") || "Unknown File";
  }
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
  <Dialog.Content
    class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
  >
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Icon
          icon="mdi:file-document-multiple"
          width="1.5em"
          height="1.5em"
          class="text-green-800"
        />
        Applications for File {fileNumber} - {fileTitle}
      </Dialog.Title>
      <Dialog.Description>
        {applications.length} application{applications.length !== 1 ? "s" : ""} found
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 overflow-y-auto py-4">
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <Icon
            icon="mdi:loading"
            width="2em"
            height="2em"
            class="animate-spin text-green-800"
          />
          <span class="ml-2">Loading applications...</span>
        </div>
      {:else if applications.length === 0}
        <div
          class="flex flex-col items-center justify-center py-12 text-gray-500"
        >
          <Icon icon="mdi:file-search" width="3em" height="3em" class="mb-4" />
          <p class="text-lg font-medium">No applications found</p>
          <p class="text-sm">
            No applications are associated with file {fileNumber}
          </p>
        </div>
      {:else}
        <div class="space-y-4">
          <!-- Table view for larger screens -->
          <div class="hidden md:block">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Application Date</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Payment ID</Table.Head>
                  <Table.Head class="w-[100px]">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each applications as application (application._uniqueKey ?? `${application.id}-${application.applicationType}`)}
                  <Table.Row>
                    <Table.Cell class="font-medium">
                      {mapDateToStringNoDate(application.applicationDate)}
                    </Table.Cell>
                    <Table.Cell>
                      {mapTypeToString(application.applicationType)}
                    </Table.Cell>
                    <Table.Cell>
                      <AppStatusTag status={application.currentStatus} />
                    </Table.Cell>
                    <Table.Cell>
                      {application.paymentId || "No Payment ID"}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="sm"
                        variant="outline"
                        on:click={() => updatePaymentId(application)}
                      >
                        <Icon icon="mdi:pencil" width="1em" height="1em" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>

          <!-- Card view for smaller screens -->
          <!-- <div class="md:hidden space-y-3">
						{#each applications as application (application.id)}
							<div transition:slide={{ duration: 300 }}>
								<Card.Root>
									<Card.Header class="pb-3">
										<div class="flex justify-between items-start">
											<div class="space-y-1">
												<Card.Title class="text-base">
													{application.applicantName || 'N/A'}
												</Card.Title>
												<Card.Description class="text-sm">
													ID: {application.id || 'N/A'}
												</Card.Description>
											</div>
											<Badge class={getStatusColor(application.status)}>
												{application.status || 'Unknown'}
											</Badge>
										</div>
									</Card.Header>
									<Card.Content class="space-y-2 pt-0">
										<div class="grid grid-cols-2 gap-2 text-sm">
											<div>
												<span class="font-medium">Type:</span>
												<span class="ml-1">{application.type || 'N/A'}</span>
											</div>
											<div>
												<span class="font-medium">Payment ID:</span>
												<span class="ml-1">{application.paymentId || 'Not Set'}</span>
											</div>
											<div class="col-span-2">
												<span class="font-medium">Date Submitted:</span>
												<span class="ml-1">{formatDate(application.dateSubmitted)}</span>
											</div>
										</div>
									</Card.Content>
									<Card.Footer class="pt-0">
										<Button
											size="sm"
											variant="outline"
											on:click={() => handleSelectApplication(application)}
											class="w-full"
										>
											<Icon icon="mdi:pencil" width="1em" height="1em" class="mr-2" />
											Update Payment ID
										</Button>
									</Card.Footer>
								</Card.Root>
							</div>
						{/each}
					</div> -->
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" on:click={handleClose}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
