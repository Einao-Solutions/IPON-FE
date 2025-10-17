<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { faker } from '@faker-js/faker';
	import {  UserRoles, UserTypes } from '$lib/helpers';
	import { Input } from '$lib/components/ui/input';
	import * as Select from "$lib/components/ui/select"
	import * as Popover from "$lib/components/ui/popover"
	import * as Command from "$lib/components/ui/command"
	import { ChevronsUpDown } from 'lucide-svelte';
	let currentView: number = 0;
	let isCreating: boolean = false;
	let creationMessage:string="";
	let creationStatus:number=0;
	export let open:boolean=false;
	let email:string|null=null;
	let username:string|null=null;
	let roles:UserRoles[]=[];
	let type:UserTypes|null=null;
	function create() {
		isCreating = true;
		setTimeout(() => {
			creationStatus=faker.number.int(1)
			creationMessage= creationStatus==0?"Failed to create":"Successfully created"
			if(creationStatus===1)
			{
				email=null;
				username=null;
				roles=[];
				type=null;
			}
			isCreating = false;
			currentView=2;
		}, 3000)
	}

	function removeRoles(selected:UserRoles)
	{
		roles!.splice(roles!.indexOf(selected),1);
		roles=[...roles!];
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>Enter new user details</Sheet.Title>
		</Sheet.Header>
		<div class="space-y-4">
			{#if currentView === 0}
				<Input bind:value={email} placeholder="enter email" />
				<Input bind:value={username} placeholder="enter full name" />
				<Select.Root onSelectedChange="{(selection)=>{type= selection.value} }">
					<Select.Trigger>
					<Select.Value placeholder="Select a user type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each Object.values(UserTypes)  as usertype}
								<Select.Item value="{usertype}">{usertype}</Select.Item>
								{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<Popover.Root >
					<Popover.Trigger asChild let:builder>
						<Button
							builders={[builder]}
							variant="outline"
							role="combobox"
							class="w-full h-fit justify-between"
						>
							<div class="grid sm:grid-cols-2 grid-cols-3 gap-1">
								{#if roles && roles.length>0}
									{#each roles as affected}
										<div class="flex gap-1 items-center p-0.5 border w-fit rounded-md" style="font-size: 12px">
											<p>{affected}</p>
											<div class="w-6 flex h-6 items-center justify-center border rounded-md" on:click={()=>removeRoles(affected)}>
												<Icon class="w-5 h-5 p-0" icon="material-symbols-light:cancel-outline" />
											</div>
										</div>
									{/each}
								{:else }
									<p>Select roles</p>
								{/if}
							</div>
							<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 {roles.length>0?'hidden':''} " />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-fit p-0">
						<Command.Root>
							<Command.Input placeholder="Select all that apply..." />
							<Command.Empty>No role found.</Command.Empty>
							<Command.Group>
								{#each Object.values(UserRoles) as rol}
									<Command.Item
										value={rol}
										onSelect={() => {
									if(roles && roles.includes(rol)===false)
								{roles.push(rol);}
									else {
										roles=[rol];
									}
								roles=[...roles];
            }}>
										<p>{rol}</p>
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
				<Button on:click={() => (currentView = 1)}>Create</Button>
			{:else if currentView === 1}
				<p>Are you sure you want to creat the new user?</p>
				<div class="flex justify-end">
					<Button disabled="{isCreating}" on:click={() => (currentView = 0)} variant="outline">Cancel</Button>
					<Button disabled="{isCreating}" on:click={() => create()} variant="outline">
						<Icon class="{isCreating?'':'hidden'}"  icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
						Create</Button>
				</div>
				{:else if currentView===2}
				<div>
					{creationMessage}
					<Button class="{creationStatus===0?'':'hidden'}" on:click={()=>{
						currentView=0;
					}}>back</Button>
					<Button on:click={()=>{open=false;currentView=0}}>Ok</Button>
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
