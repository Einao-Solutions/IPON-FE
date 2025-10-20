<script lang="ts">
	import Icon from '@iconify/svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { onMount } from 'svelte';
	import { currentMenuView, loggedInUser } from '$lib/store';
	import { baseURL, decodeUser, type NotificationsType, UserRoles } from '$lib/helpers';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	let notifications = writable<NotificationsType | null>(null);
	let notificationsLoading = false;
	let activeMenu: string | null = null;
	let activeSubmenu: string | null = null;
	let claimRequestsCount = 0;
	let oppsCount = 0;
	let showSystemNotifications = false;
	let systemNotification = {
		type: 'info',
		title: 'New Features',
		message: [
			'Claim File',
			'Patent Renewal',
			'Update Patent/Design Attachments',
			'File Appeal',
			'Certificate Authentication using QR code'
		],
		priority: 'feature',
		isActive: true
	};

	let menus = [
		{ icon: 'radix-icons:dashboard', location: 'Dashboard' },
		{
			icon: 'tabler:forms',
			location: 'Post Registration',
			submenus: [
				{ name: 'Trademark', location: 'PostRegistration/' },
				{ name: 'Patent', location: 'PostRegistration/' }
			]
		},
		{ icon: 'cil:search', location: 'Publications' },
		{ icon: 'fluent:person-support-20-filled', location: 'Support' },
		// { icon: 'cil:search', location: 'Opposition' },
		{ icon: 'arcticons:yahoo-japan-finance', location: 'Finance' },
		{ icon: 'mi:notification', location: 'Performance' },
		{ icon: 'octicon:people-24', location: 'Users' },
		{ icon: 'ooui:user-avatar-outline', location: 'Profile' },
		{ icon: 'mdi:shield-crown-outline', location: 'Admin' },
		{ icon: 'mdi:file-plus', name:'Claim Requests',location: 'ClaimRequests' }
	];

	onMount(async () => {
		await decodeUser();
		loadNotifications();
		loadClaimRequestsCount();
		loadOppositionsCount();
		if ($loggedInUser) {
			// Filter menus based on roles
			if (!$loggedInUser.roles.includes(UserRoles.Support)) {
				menus = menus.filter((x) => x.location !== 'Performance' && x.location !== 'Users');
			}

			if (!$loggedInUser.roles.includes(UserRoles.Finance)) {
				menus = menus.filter((x) => x.location !== 'Finance');
			}

			if (
				!$loggedInUser.roles.some((role) =>
					[
						UserRoles.TrademarkCertification,
						UserRoles.TrademarkSearch,
						UserRoles.Agent,
						UserRoles.TrademarkOpposition,
						UserRoles.TrademarkExaminer,
						UserRoles.Support
					].includes(role)
				)
			) {
				menus = menus.filter((x) => x.location !== 'Opposition');
			}

			if (!$loggedInUser.roles.some((role) => [UserRoles.SuperAdmin, UserRoles.Support].includes(role))) {
				menus = menus.filter((x) => x.location !== 'Admin');
				menus = menus.filter((x) => x.location !== 'ClaimRequests');
			}
		}

		// Set initial active menu based on current route
		const path = window.location.pathname.toLowerCase();
		const currentLocation = path.split('/').pop();
		if (currentLocation) {
			const menuMatch = menus.find((m) => m.location.toLowerCase() === currentLocation);
			if (menuMatch) activeMenu = menuMatch.location;
		}
	});

	function toggleSubmenu(menuLocation: string) {
		activeMenu = activeMenu === menuLocation ? null : menuLocation;
	}

	function handleMenuClick(menu, submenu = null) {
		currentMenuView.set(submenu?.name || menu.location);
		if (submenu) {
			activeSubmenu = submenu.name;
			goto(`/home/${submenu.location.toLowerCase()}`);
		} else if (!menu.submenus) {
			activeMenu = menu.location;
			activeSubmenu = null;
			goto(`/home/${menu.location.trim().toLowerCase()}`);
		}
	}

	async function loadNotifications() {
		if ($loggedInUser === null) return;
		notificationsLoading = true;

		let showSupportTickets = $loggedInUser.roles?.includes(UserRoles.Support);
		let showAllOpposition = $loggedInUser.roles?.some((role) =>
			[UserRoles.TrademarkOpposition, UserRoles.Support].includes(role)
		);

		let url = `${baseURL}/api/files/UserNotifications?userId=${$loggedInUser.id}`;
		if (showSupportTickets) url += `&staffTickets=true`;
		if (showAllOpposition) url += `&showAllOpposition=true`;

		const response = await fetch(url);
		if (response.ok) notifications.set(await response.json());
		notificationsLoading = false;
	}

	function toggleSystemNotifications() {
		showSystemNotifications = !showSystemNotifications;
	}

	function getNotificationIcon(type: string) {
		switch (type) {
			case 'update':
				return 'mdi:update';
			case 'warning':
				return 'mdi:alert-circle';
			case 'info':
				return 'mdi:information';
			case 'success':
				return 'mdi:check-circle';
			default:
				return 'mdi:bell';
		}
	}
	async function loadClaimRequestsCount() {
		try {
			const response = await fetch(`${baseURL}/api/migration/GetAllClaimRequests`);
			if (response.ok) {
				const claims = await response.json();
				claimRequestsCount = claims.length;
			}
		} catch (error) {
			console.error('Error fetching claim requests count:', error);
		}
	}
	async function loadOppositionsCount() {
		try {
			const response = await fetch(`${baseURL}/api/opposition/count`);
			if (response.ok) {
				const opps = await response.json();
				oppsCount = opps;
			}
		} catch (error) {
			console.error('Error fetching claim requests count:', error);
		}
	}
	function getNotificationColors(priority: string) {
		switch (priority) {
			case 'high':
				return 'bg-red-500 text-white border-red-600';
			case 'medium':
				return 'bg-orange-500 text-white border-orange-600';
			case 'low':
				return 'bg-blue-500 text-white border-blue-600';
			case 'feature':
				return 'bg-green-500 text-white border-green-600';
			default:
				return 'bg-gray-500 text-white border-gray-600';
		}
	}
</script>

<div class="w-56 h-screen bg-white shadow-lg flex flex-col">
	<!-- Logo -->
	<div class="flex justify-center py-4 border-b border-gray-100">
		<img src="/logo.png" alt="logo" class="h-16 w-16" />
	</div>

	<!-- Menu items -->
	<div class="flex-1 overflow-y-auto py-2">
		{#each menus as menu}
			<div class="mb-1">
				<button
					class="w-full text-left px-2 focus:outline-none"
					on:click={() => (menu.submenus ? toggleSubmenu(menu.location) : handleMenuClick(menu))}
				>
					<div
						class={`flex items-center justify-between rounded-md py-2 px-3 ${activeMenu === menu.location ? 'bg-[#287F71] text-white' : 'hover:bg-gray-100'}`}
					>
						<div class="flex items-center space-x-3">
							<Icon
								icon={menu.icon}
								class={`text-xl ${activeMenu === menu.location ? 'text-white' : 'text-gray-500'}`}
							/>
							<span class={`${activeMenu === menu.location ? 'text-white' : 'text-gray-700'}`}
								>{menu.name ?? menu.location}</span
							>
						</div>
						<div class="flex items-center">
							{#if menu.location === 'Support' && !notificationsLoading}
								<span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
									{$notifications?.support ?? 0}
								</span>
							{/if}
							{#if menu.location === 'Opposition' && !notificationsLoading}
								<span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
									{oppsCount}
								</span>
							{/if}
							{#if menu.location === 'ClaimRequests' && claimRequestsCount > 0}
								<span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
									{claimRequestsCount}
								</span>
							{/if}
							{#if menu.submenus}
								<Icon
									icon="heroicons:chevron-down"
									class={`transition-transform duration-200 ${activeMenu === menu.location ? 'rotate-180 text-white' : 'text-gray-400'}`}
									width="16"
								/>
							{/if}
						</div>
					</div>
				</button>
				{#if menu.submenus && activeMenu === menu.location}
					<div class="ml-10 mt-1 space-y-1">
						{#each menu.submenus as submenu}
							<button
								class="w-full text-left block py-2 px-3 rounded-md text-sm {activeSubmenu ===
								submenu.name
									? 'font-medium text-[#287F71] bg-gray-50'
									: 'text-gray-600 hover:bg-gray-50'}"
								on:click={() => handleMenuClick(menu, submenu)}
							>
								{submenu.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- System notification -->
	{#if systemNotification.isActive}
		<div class="p-3 mx-2 mb-3">
			<div
				class={`rounded-lg border-2 shadow-lg ${getNotificationColors(systemNotification.priority)}`}
			>
				<div class="flex items-center justify-between p-3 border-b border-white/20">
					<div class="flex items-center space-x-2">
						<Icon
							icon={getNotificationIcon(systemNotification.type)}
							class="text-lg flex-shrink-0"
						/>
						<span class="font-semibold text-xs">{systemNotification.title}</span>
					</div>
					<button
						class="text-white/80 hover:text-white transition-colors p-1"
						on:click={toggleSystemNotifications}
					>
						<Icon
							icon={showSystemNotifications ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
							width="16"
						/>
					</button>
				</div>
				{#if showSystemNotifications}
					<div class="p-3">
						<ul class="list-disc pl-5 text-xs text-white/90 leading-relaxed">
							{#each systemNotification.message as line}
								<li>{line}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Footer logo -->
	<div class="p-4 border-t border-gray-100 flex justify-center">
		<img src="/einao.png" alt="einao logo" class="h-12 w-auto opacity-70" />
	</div>
</div>
