<script lang="ts">
import { cn } from '$lib/utils.js';
import { ChevronsUpDown } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button/index.js';
import Check from 'lucide-svelte/icons/check';
import * as Popover from "$lib/components/ui/popover/index";
import * as Command from "$lib/components/ui/command/index";
import Icon from '@iconify/svelte';
import { createEventDispatcher } from 'svelte';
export let options:{key:any, value:any}[]=[];
const dispatch = createEventDispatcher();
$: selectedOptions=[];
function onRemoved(option){
	selectedOptions = selectedOptions.filter(x=>x!==option);
	dispatch('selectedChanged', selectedOptions);
}
$:{
	dispatch('selectedChanged', selectedOptions);
}
</script>
<Popover.Root >
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={true}
			class="w-full h-fit justify-between"
		>
			<div class="grid sm:grid-cols-2 grid-cols-3 gap-1">
				{#if selectedOptions && selectedOptions.length>0}
					{#each selectedOptions as option}
						<div class="flex gap-1 items-center p-0.5 border w-fit rounded-md" style="font-size: 12px">
							<p>{options.find(x=>x.key===option).value}</p>
							<div class="w-6 flex h-6 items-center justify-center border rounded-md" on:click={()=>onRemoved(option)}>
								<Icon class="w-5 h-5 p-0" icon="material-symbols-light:cancel-outline" />
							</div>
						</div>
					{/each}
				{:else }
					<p>Select multiple</p>
				{/if}
			</div>
			<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 {options?.length>0?'hidden':''} " />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-fit p-0 overflow-y-auto h-1/2">
		<Command.Root>
			<Command.Input placeholder="Search..." />
			<Command.Empty>Not found.</Command.Empty>
			<Command.Group class="overflow-y-auto">
				{#each options as option}
					<Command.Item
						value={option.value}
						onSelect={() => {
									if(!selectedOptions.includes(option.key))
								{selectedOptions.push(option.key);
								selectedOptions=[...selectedOptions];
								}
            }}>
						<Check
							class={cn(
                "mr-2 h-4 w-4",
                !selectedOptions?.includes(option.key) && "text-transparent"
              )}
						/>
						<div>
							<p>{option.value}</p>
							<br />
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>