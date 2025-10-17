<script lang="ts">
	import { mapStatusToString } from '../../../../routes/home/components/dashboardutils';

	export let showIcon:boolean=false;
	export let value:number=0;
	function getBackgroundColour():string
	{
		switch (value) {
			case 0:
				return 'bg-green-300';
			case 1:
				return 'bg-red-300';
			case 2:
			case 20:
				return 'bg-purple-300';
			case 3:
			case 16:
			case 17:
			case 18:
				return 'bg-yellow-300';
			case 4:
				return 'bg-yellow-300';
			case 5:
				return 'bg-red-300';
			case 6:
				return 'bg-red-300';
			case 7:
				return 'bg-red-300';
			case 8:
			case 24:
				return 'bg-red-300';
			case 9:
				return 'bg-gray-300';
			case 15:
			case 21:
			case 22:
			case 23:
				return 'bg-gray-300';
			case 19:
			case 10:
				return 'bg-green-300';
			case 11:
			case 12:
				return 'bg-red-300';
			case 13:
				return '';
			case 14:
				return 'bg-green-300';
			case 25:
				return 'bg-blue-300';
			default:
				return '';
		}
	}

	function getTextColour():string
	{
		switch (value) {
			case 10:
			case 0:
				return 'text-green-950';
			case 1:
				return 'text-red-950';
			case 2:
			case 20:
				return 'text-purple-950';
			case 3:
			case 16:
			case 17:
			case 18:
				return 'text-yellow-950';
			case 4:
				return 'text-yellow-950';
			case 5:
				return 'text-red-950';
			case 6:
				return 'text-red-950';
			case 7:
			case 24:
				return 'text-red-950';
			case 8:
				return 'text-red-950';
			case 9:
				return 'text-gray-950';
			case 15:
			case 21:
			case 22:
			case 23:
				return 'text-gray-950';
			case 19:
				return 'text-green-950';
			case 11:
			case 12:
				return 'text-red-950';
			case 13:
				return '';
			case 14:
				return 'text-green-950';
			default:
				return '';
		}
	}
</script>
<div class="p-1 m-1 rounded-md border w-fit {getTextColour()} {getBackgroundColour()}">
	{mapStatusToString(value)}
</div>