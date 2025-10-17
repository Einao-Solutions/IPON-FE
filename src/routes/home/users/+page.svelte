<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import PageData = App.PageData;
	import { onMount } from 'svelte';
	import AddUser from './AddUser.svelte';
	import Icon from '@iconify/svelte';
	import UsersTable from './UsersTable.svelte';
	import { baseURL, type UsersType } from '$lib/helpers';

	export let data:PageData|null;
	let showAddUser:boolean=false;
	let addUser:AddUser
	let isAdmin:boolean=false;
	let isLoading=false;
	let userCreationData={}
	let usersTable:UsersTable|null=null;
	let usersList= {  }
	onMount(async()=>{
			isLoading=true;
			usersTable = (await import ("./UsersTable.svelte")).default;
			await loadData()
			// usersList= {
			// 	usersList:data.usersList
			// }
		// setTimeout(()=>{
		// 	isLoading=false;
		// 	},
		// 2000
		// )
		isAdmin = data?.isAdmin;
	})
async function addNewUser()
{
	if (!addUser)
	{
		addUser =(await import("./AddUser.svelte")).default;
	}
	userCreationData={open:true}
	showAddUser=true;
}
let skip=0; let take=10; let name="";
let usersdata={}
async function loadData(){
		const response=await fetch(`${baseURL}/api/users/LoadUsers`, {
			method: 'POST',
			headers:{
				'Content-Type':'application/json'
			},
			body:JSON.stringify({
				skip: skip,
				take: take,
			})
		})
	usersList =await response.json()
	var dt=(usersList.result as UsersType[]).map((e)=> {
		return {'sn':usersList.result.indexOf(e),
		'name':e.name,
		'email':e.email,
		'id':e.id}
	});
	usersdata.usersList=dt;
	usersdata.count=usersList.count;
		isLoading=false;
}

</script>

{#if showAddUser}
	<svelte:component this="{addUser}" {...userCreationData} />
	{/if}
<div>
	<Button  on:click={()=>addNewUser()}>+ Add user</Button>
		{#if isLoading}
			<div class="flex items-center justify-center w-full h-full bg-gray-400">
				<Icon icon="eos-icons:loading" width="1.2rem" height="1.2rem" />
			</div>
			{:else}
			<svelte:component this="{usersTable}" {...usersdata} />
			{/if}
</div>
