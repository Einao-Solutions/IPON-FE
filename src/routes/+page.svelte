
<script lang="ts">
	import { goto } from "$app/navigation";
import { onMount } from 'svelte';
	onMount(async ()=>{
		var loggedInUser=document.cookie.split(';').find(x=>x.startsWith(" user=")|| x.startsWith("user="));
		if(!loggedInUser){
			await goto("/auth")
		}
		else {
			await goto("/home/dashboard")
		}
	})
</script>