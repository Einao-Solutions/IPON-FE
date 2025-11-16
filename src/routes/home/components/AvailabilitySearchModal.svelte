<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { baseURL } from '$lib/helpers';
	import { loggedInUser } from '$lib/store';
	import Icon from '@iconify/svelte';
	
	export let isOpen = false;
	export let ipContext: 'trademark' | 'patent' | 'design' | null = null; // NEW: IP context from service view
	
	interface ClassOption {
		id: number;
		name: string;
	}

	interface SearchParams {
		query: string;
		classId: number | undefined;
		fileType: string;
		type: string;
	}

	// Class of goods options
	const classOptions: ClassOption[] = [
		{ id: 1, name: 'Class 1 - Chemicals used in industry, science, agriculture, etc.' },
		{ id: 2, name: 'Class 2 - Paints, varnishes, preservatives, colorants' },
		{ id: 3, name: 'Class 3 - Cleaning, cosmetics, soaps, perfumery' },
		{ id: 4, name: 'Class 4 - Industrial oils, greases, candles, fuels' },
		{ id: 5, name: 'Class 5 - Pharmaceuticals, veterinary, disinfectants' },
		{ id: 6, name: 'Class 6 - Common metals, building materials, safes' },
		{ id: 7, name: 'Class 7 - Machines, motors (not for land vehicles)' },
		{ id: 8, name: 'Class 8 - Hand tools, cutlery, razors' },
		{ id: 9, name: 'Class 9 - Scientific, electrical, computer apparatus' },
		{ id: 10, name: 'Class 10 - Medical, surgical, dental instruments' },
		{ id: 11, name: 'Class 11 - Lighting, heating, cooking appliances' },
		{ id: 12, name: 'Vehicles, locomotion apparatus' },
		{ id: 13, name: 'Class 13 - Firearms, ammunition, fireworks' },
		{ id: 14, name: 'Class 14 - Jewelry, watches, precious metals' },
		{ id: 15, name: 'Class 15 - Musical instruments and accessories' },
		{ id: 16, name: 'Class 16 - Paper, printed matter, stationery' },
		{ id: 17, name: 'Class 17 - Rubber, plastics, insulation materials' },
		{ id: 18, name: 'Class 18 - Leather goods, bags, umbrellas' },
		{ id: 19, name: 'Class 19 - Non-metallic building materials' },
		{ id: 20, name: 'Class 20 - Furniture, mirrors, non-metal articles' },
		{ id: 21, name: 'Class 21 - Household utensils, glassware, brushes' },
		{ id: 22, name: 'Class 22 - Ropes, tents, padding materials' },
		{ id: 23, name: 'Class 23 - Yarns and threads for textile use' },
		{ id: 24, name: 'Class 24 - Textiles, bed and table covers' },
		{ id: 25, name: 'Class 25 - Clothing, footwear, headgear' },
		{ id: 26, name: 'Class 26 - Lace, embroidery, buttons' },
		{ id: 27, name: 'Class 27 - Carpets, rugs, wall hangings' },
		{ id: 28, name: 'Class 28 - Games, toys, sports equipment' },
		{ id: 29, name: 'Class 29 - Meat, fish, dairy, prepared meals' },
		{ id: 30, name: 'Class 30 - Coffee, tea, bakery, spices' },
		{ id: 31, name: 'Class 31 - Agriculture, live animals, plants' },
		{ id: 32, name: 'Class 32 - Beers, non-alcoholic beverages' },
		{ id: 33, name: 'Class 33 - Alcoholic beverages (except beer)' },
		{ id: 34, name: "Class 34 - Tobacco, smokers' articles" },
		{ id: 35, name: 'Class 35 - Advertising, business management' },
		{ id: 36, name: 'Class 36 - Insurance, financial, real estate' },
		{ id: 37, name: 'Class 37 - Construction, repair, installation' },
		{ id: 38, name: 'Class 38 - Telecommunications' },
		{ id: 39, name: 'Class 39 - Transport, packaging, travel' },
		{ id: 40, name: 'Class 40 - Treatment of materials, printing' },
		{ id: 41, name: 'Class 41 - Education, entertainment, training' },
		{ id: 42, name: 'Class 42 - Scientific, tech services, software dev' },
		{ id: 43, name: 'Class 43 - Food services, temporary accommodation' },
		{ id: 44, name: 'Class 44 - Medical, veterinary, agriculture' },
		{ id: 45, name: 'Class 45 - Legal, security, social services' }
	];

	// File type options
	const fileTypeOptions = ['Trademark', 'Patent', 'Design'];

	// Form data
	let searchQuery = '';
	let selectedClass: number | undefined;
	// OLD IMPLEMENTATION (commented for future deletion)
	// let selectedfileType = '';
	
	// NEW IMPLEMENTATION - Context-aware file type
	let selectedfileType = '';
	let isFileTypeAutoSet = false;
	
	// Auto-set file type based on IP context
	$: if (ipContext && !isFileTypeAutoSet) {
		const contextMap: Record<string, string> = {
			'trademark': 'Trademark',
			'patent': 'Patent', 
			'design': 'Design'
		};
		if (ipContext in contextMap) {
			selectedfileType = contextMap[ipContext];
			isFileTypeAutoSet = true;
		}
	}
	
	// Determine if file type dropdown should be shown
	$: showFileTypeDropdown = !ipContext; // Hide dropdown when context is provided
	
	// Helper function to get file type icon
	function getFileTypeIcon(fileType: string): string {
		const iconMap: Record<string, string> = {
			'Trademark': 'mdi:scale-balance',
			'Patent': 'mdi:lightbulb-outline', 
			'Design': 'mdi:palette-outline'
		};
		return iconMap[fileType] || 'mdi:file';
	}
	let isLoading = false;
	let error: string | null = null;
	let paymentId: string | null = null;
	let cost: string | null = null;
	let response: any = null;
	let applicantName: string | null = null;
	let applicantEmail: string | null = null;
	const dispatch = createEventDispatcher();

	// Close modal function
	function closeModal(): void {
		dispatch('close');
		isOpen = false;
	}

	// Handle click outside
	function handleOutsideClick(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (target.classList.contains('modal-overlay')) {
			closeModal();
		}
	}

	// Handle search submission
	async function handleSearch(): Promise<void> {
		if (!searchQuery) {
			error = 'Please enter a search term';
			return;
		}
		
		// OLD VALIDATION (commented for future deletion)
		// if (!selectedfileType) {
		// 	error = 'Please select a file type';
		// 	return;
		// }
		
		// NEW VALIDATION - Context-aware validation
		if (!selectedfileType) {
			if (ipContext) {
				error = 'File type could not be determined from context';
			} else {
				error = 'Please select a file type';
			}
			return;
		}
		try {
			isLoading = true;
			error = null;

			const searchParams: SearchParams = {
				query: searchQuery,
				classId: selectedClass,
				fileType: selectedfileType,
				type: 'availabilitysearch'
			};
			// console.log('searchParams', searchParams);
			// Store search parameters
			sessionStorage.setItem('searchParams', JSON.stringify(searchParams));

			try {
				applicantName = $loggedInUser?.firstName + ' ' + $loggedInUser?.lastName || 'Unknown';
				// console.log('applicantName', applicantName);
				applicantEmail = $loggedInUser?.email || 'unknown@email.com';
				// console.log('applicantEmail', applicantEmail);
				
				const res = await fetch(
					`${baseURL}/api/files/AvailabilitySearchCost?name=${applicantName}&email=${applicantEmail}`,
					{}
				);

				if (!res.ok) {
					throw new Error(`Error: ${res.statusText}`);
				}

				response = await res.json();
				cost = response.cost;
				paymentId = response.rrr;
				console.log('Amount:', cost);
				console.log('RRR:', paymentId);
				// Redirect to payment page
				 await goto(`/payment/?type=availabilitysearch&rrr=${paymentId}&amount=${cost}`);

				// await goto(`/availabilitysearch`);
			} catch (err) {
				error = 'Payment failed';
			}
		} catch (err) {
			const catchError = err as Error;
			error = catchError.message || 'An error occurred during search';
		} finally {
			isLoading = false;
		}
	}

	// Handle keyboard events for accessibility
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		on:click={handleOutsideClick}
		on:keydown={handleKeydown}
		role="presentation"
	>
		<div
			class="modal-content bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Modal Header -->
			<div class="border-b px-6 py-4">
				<h3 id="modal-title" class="text-lg font-semibold text-gray-900">Availability Search</h3>
				<p class="text-sm text-gray-600 mt-1">Search Online Database</p>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
						{error}
					</div>
				{/if}

				<div class="space-y-6">
					<!-- Search and Class selection layout -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- Search Input -->
						<div class="md:col-span-1">
							<label for="search-query" class="block text-sm font-medium text-gray-700 mb-2">
								Search Term
							</label>
							<input
								id="search-query"
								type="text"
								bind:value={searchQuery}
								placeholder="Enter file name"
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						<!-- Class Dropdown -->
						<div class="md:col-span-1">
							<label for="class-select" class="block text-sm font-medium text-gray-700 mb-2">
								Class of Goods
							</label>
							<select
								id="class-select"
								bind:value={selectedClass}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
								disabled={selectedfileType === 'Patent' || selectedfileType === 'Design'}
							>
								<option value="">All</option>
								{#each classOptions as option}
									<option value={option.id}>{option.name}</option>
								{/each}
							</select>
						</div>

						<!-- File Type Dropdown - Context-aware display -->
						{#if showFileTypeDropdown}
							<!-- OLD IMPLEMENTATION (visible when no context) -->
							<div class="md:col-span-1">
								<label for="file-type" class="block text-sm font-medium text-gray-700 mb-2">
									File Type
								</label>
								<select
									id="file-type"
									bind:value={selectedfileType}
									class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
								>
									<option value="">All</option>
									{#each fileTypeOptions as type}
										<option value={type}>{type}</option>
									{/each}
								</select>
							</div>
						{:else}
							<!-- NEW IMPLEMENTATION - Show selected file type as readonly when context is provided -->
							<div class="md:col-span-1">
								<label for="file-type-display" class="block text-sm font-medium text-gray-700 mb-2">
									File Type
								</label>
								<div class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-700 flex items-center shadow-sm">
									<Icon icon={getFileTypeIcon(selectedfileType)} class="w-4 h-4 mr-2" />
									{selectedfileType}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="px-6 py-4 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3">
				<button
					type="button"
					on:click={closeModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={handleSearch}
					disabled={isLoading}
					class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
				>
					{#if isLoading}
						<span class="inline-block mr-2">
							<svg
								class="animate-spin h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						</span>
						Searching...
					{:else}
						Search
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
