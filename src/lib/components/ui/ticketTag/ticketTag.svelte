<script lang="ts">
	import { TicketStates } from '$lib/helpers';
	import { mapTicketStateToString } from '../../../../routes/home/support/supportutils';
	export let state:TicketStates

	function getBgColor() {
		switch (Number(state)) {
			case TicketStates.awaitingStaff:
				return 'bg-blue-400';
			case TicketStates.closed:
				return 'bg-green-400';
			case TicketStates.awaitingUser:
				return 'bg-yellow-400';
			default:
				return 'bg-gray-400';
		}
	}
</script>

<div class="px-1.5 py-1 rounded-md w-fit text-xs font-medium text-black {getBgColor()}">
	{mapTicketStateToString(state)}
</div>