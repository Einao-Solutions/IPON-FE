<script lang="ts">
	import type { CorrespondenceType } from '$lib/helpers';
	import * as Table from '$lib/components/ui/table';
	export let oldData:CorrespondenceType
	export let newData:CorrespondenceType
</script>

<div class="md:flex gap-2 w-full overflow-x-auto overflow-y-auto">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Field</Table.Head>
				<Table.Head>old data</Table.Head>
				<Table.Head>new data</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
				<Table.Row>
					<Table.Cell>Name</Table.Cell>
					<Table.Cell>{oldData.name}</Table.Cell>
					<Table.Cell>{newData.name}</Table.Cell>
				</Table.Row>
			<Table.Row>
				<Table.Cell>Phone Number</Table.Cell>
				<Table.Cell>{oldData.phone}</Table.Cell>
				<Table.Cell>{newData.phone}</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell>Email</Table.Cell>
				<Table.Cell>{oldData.email}</Table.Cell>
				<Table.Cell>{newData.email}</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell>Address</Table.Cell>
				<Table.Cell>{oldData.address}</Table.Cell>
				<Table.Cell>{newData.address}</Table.Cell>
			</Table.Row>
			<Table.Row>
				<Table.Cell>State</Table.Cell>
				<Table.Cell>{oldData.state}</Table.Cell>
				<Table.Cell>{newData.state}</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>