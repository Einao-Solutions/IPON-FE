<script>
	import Icon from '@iconify/svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	const menus=[{
		icon:"radix-icons:dashboard",
		location:"Dashboard",
	},
		// {
		// 	icon:"cil:search",
		// 	location:"Search",
		// },
		// {
		// 	icon:"fluent:person-support-20-filled",
		// 	location:"Support",
		// },
		// {
		// 	icon:"mi:notification",
		// 	location:"Notifications",
		// },
		{
			icon:"ooui:user-avatar-outline",
			location:"Profile",
		},];
</script>
	{#each menus as menu}
		<a href="/home/{menu.location.toLowerCase()}">
			<span class="items-center text-lg">
				<Icon icon="{menu.icon}" id="{menu.location}" />
				<Label for="{menu.location}" ><p>{menu.location}</p> </Label>
			</span>
		</a>
	{/each}
