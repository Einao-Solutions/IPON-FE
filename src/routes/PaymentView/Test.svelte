<script lang="ts">
import { baseURL, type PatentData } from '$lib/helpers';
import { FetchData } from '../application/apphelper';
import { Button } from '$lib/components/ui/button';
import { appattachmentsData, applicationData, newApplicationType } from '$lib/store';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';

onMount(async()=>{
	console.log("Testing.....")
	await test2()
})
async function test2()
{
	let data:PatentData;
	data = FetchData($newApplicationType??0);
	var cookieUser=document.cookie.split(';').find(x=>x.startsWith("user=") || x.startsWith(" user="))
	var user = cookieUser.trimStart();
	user = user.slice(5);
	const pp=JSON.parse(decodeURIComponent(user));
	data.creatorAccount=pp.id;
	var files= {file:  JSON.stringify({...data})};
	// for (let i=0;i <$appattachmentsData.length;i++)
	// {
	// 	let files = $appattachmentsData[i].data;
	// 	for (let fileIndex=0; fileIndex<files.length ;fileIndex++)
	// 	{
	// 		if (data.type===FilingType.Design && $appattachmentsData[i].name==="designs")
	// 		{
	// 			files['design'+`${fileIndex+1}`] = await toByteArray(files[fileIndex]);
	// 		}
	// 		else
	// 		{
	// 			files[$appattachmentsData[i].name] =   files[fileIndex];}
	// 	}
	// }
	const result=await fetch(`${baseURL}/api/files/createNew`, {method:'POST',
	headers: {
	'Content-Type': 'application/json'
},
	body:JSON.stringify(files)}
	)
	// const res = await result.json();
	// if (res) {
	// 	appattachmentsData.set([{ name: '', data: [] }]);
	// 	applicationData.set(res);
	// 	await goto('/payment?type=newapplication');
	// }
	console.log(await result.json());
}

</script>