<script lang="ts">
	import { type SupportForm, TicketStates } from '$lib/helpers';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import CalendarIcon from "lucide-svelte/icons/calendar";
	import * as Sheet from '$lib/components/ui/sheet'
	import * as Command from '$lib/components/ui/command'
	import type { DateRange } from "bits-ui";
	import {
		DateFormatter,
		type DateValue,
		getLocalTimeZone, today
	} from '@internationalized/date';
	import { cn } from "$lib/utils.js";
	import { RangeCalendar } from "$lib/components/ui/range-calendar";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import Icon from '@iconify/svelte';
	import { ChevronsUpDown } from 'lucide-svelte';
	const df = new DateFormatter("en-GB", {
		dateStyle: "medium"
	});
	let dateRange: DateRange | undefined = {
		start: today(getLocalTimeZone()),
		end: today(getLocalTimeZone())
	};
	let statusList:TicketStates[]=[];
	let startValue: DateValue | undefined = undefined;
	let title:string|null=null

	function removeSelected(selected:TicketStates)
	{
		statusList.splice(statusList.indexOf(selected), 1);
		statusList=[...statusList];
	}

	function onSubmitted()
	{}
	export let open:boolean=false;
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex flex-col gap-8">
	<div>
		<Label for="title">Title</Label>
		<Input id="title" placeholder="Enter title" bind:value={title} />
	</div>

	<div class="grid gap-2">
		<Popover.Root openFocus>
			<Popover.Trigger asChild let:builder>
				<Button
					variant="outline"
					class={cn(
          "w-[300px] justify-start text-left font-normal",
          !dateRange && "text-muted-foreground"
        )}
					builders={[builder]}
				>
					<CalendarIcon class="mr-2 h-4 w-4" />
					{#if dateRange && dateRange.start}
						{#if dateRange.end}
							{df.format(dateRange.start.toDate(getLocalTimeZone()))} - {df.format(
							dateRange.end.toDate(getLocalTimeZone())
						)}
						{:else}
							{df.format(dateRange.start.toDate(getLocalTimeZone()))}
						{/if}
					{:else if startValue}
						{df.format(startValue.toDate(getLocalTimeZone()))}
					{:else}
						Pick a date
					{/if}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0" align="start">
				<RangeCalendar
					bind:value="{dateRange}"
					bind:startValue
					initialFocus
					numberOfMonths={2}
					placeholder={dateRange?.start}
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	<div>
		<Popover.Root >
			<Popover.Trigger asChild let:builder>
				<Button
					builders={[builder]}
					variant="outline"
					role="combobox"
					class="w-full h-fit justify-between"
				>
					<div class="grid sm:grid-cols-2 grid-cols-3 gap-1">
						{#if statusList && statusList.length>0}
							{#each statusList as affected}
								<div class="flex gap-1 items-center p-0.5 border w-fit rounded-md" style="font-size: 12px">
									<p>{affected}</p>
									<div class="w-6 flex h-6 items-center justify-center border rounded-md" on:click={()=>removeSelected(affected)}>
										<Icon class="w-5 h-5 p-0" icon="material-symbols-light:cancel-outline" />
									</div>
								</div>
							{/each}
						{:else }
							<p>Select files</p>
						{/if}
					</div>
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 {statusList?.length>0?'hidden':''} " />
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-fit p-0">
				<Command.Root>
					<Command.Input placeholder="Select multiple..." />
					<Command.Empty>No file found.</Command.Empty>
					<Command.Group>
						{#each Object.values(TicketStates) as ticketstate}
							<Command.Item
								value={ticketstate}
								onSelect={() => {
									if(statusList && statusList.includes(ticketstate)===false)
								{statusList.push(ticketstate);}
									else {
										statusList=[ticketstate];
									}
								statusList=[...statusList];
            }}>
									<p>{ticketstate}</p>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
	</div>
	<Button on:click={() => onSubmitted()}>Search</Button>
	</Sheet.Content>
</Sheet.Root>
