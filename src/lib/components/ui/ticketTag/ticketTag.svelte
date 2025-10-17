<script lang="ts">
	import { TicketStates } from '$lib/helpers';
	import { mapTicketStateToString } from '../../../../routes/home/support/supportutils';
	export let state:TicketStates

	function getBgColor() {
		switch (state) {
			case TicketStates.awaitingStaff:
				return 'bg-blue-400';
			case TicketStates.closed:
				return 'bg-green-400';
			case TicketStates.awaitingUser:
				return 'bg-yellow-400';
		}
	}
	function getTextColor() {
		switch (state) {
			case TicketStates.awaitingStaff:
				return 'text-blue-950';
			case TicketStates.closed:
				return 'text-green-950';
			case TicketStates.awaitingUser:
				return 'text-yellow-950';
		}
	}
</script>

<div class="p-2 w-fit m-2 text-sm rounded-md border {getTextColor()} {getBgColor()} ">{mapTicketStateToString(state)}</div>