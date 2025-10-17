<script lang="ts">
	import { onMount } from 'svelte';
	import { baseURL } from '$lib/helpers';
	import AppStatusTag from '$lib/components/ui/ApplicationStatusTag/AppStatusTag.svelte';
	import coatOfArms from '$lib/assets/logo.png';
	import { mapDateToString } from '../home/components/dashboardutils';
	interface TrademarkData {
		fileId: string;
		title: string;
		fileStatus: string;
		filingDate: string;
	}

	interface UrlParams {
		[key: string]: string;
	}

	let urlParams: UrlParams = {};
	let isLoading: boolean = true;
	let verificationStatus: 'pending' | 'verified' | 'invalid' | 'error' | 'info' = 'pending';
	let trademarkData: TrademarkData | null = null;
	let scanTimestamp: string = '';
	let fileId: string = '';
	let verificationMessage: string = '';

	onMount(() => {
		if (typeof window !== 'undefined') {
			urlParams = Object.fromEntries(new URLSearchParams(window.location.search));
			scanTimestamp = new Date().toISOString();

			// Extract file ID from URL parameters
			fileId = urlParams.fileId || urlParams.id || urlParams.file || '';

			// Verify the trademark document
			if (fileId) {
				verifyDocument(fileId);
			} else {
				// If no fileId, show general information page
				verificationStatus = 'info';
				verificationMessage = 'Welcome to IPO Nigeria Document Verification';
				isLoading = false;
			}
		}
	});

	async function verifyDocument(fileId: string): Promise<void> {
		try {
			// Call your .NET backend to verify trademark document
			const response = await fetch(`${baseURL}/api/letters/verify-trademark?fileId=${fileId}`);

			if (response.ok) {
				trademarkData = (await response.json()) as TrademarkData;
				verificationStatus = 'verified';
				verificationMessage = 'Document verified successfully';
			} else if (response.status === 404) {
				verificationStatus = 'invalid';
				verificationMessage = 'Trademark document not found in our records';
			} else {
				verificationStatus = 'error';
				verificationMessage = 'Unable to verify document at this time';
			}
		} catch (error) {
			console.error('Verification error:', error);
			verificationStatus = 'error';
			verificationMessage = 'Network error during verification';
		} finally {
			setTimeout(() => {
				isLoading = false;
			}, 1000);
		}
	}

	function goToPortal(): void {
		window.location.href = 'https://portal.iponigeria.com';
	}

	function contactSupport(): void {
		window.location.href = 'mailto:info@iponigeria.com?subject=Document Verification Inquiry';
	}

	function searchDocument(): void {
		const input = prompt('Enter your File ID:');
		if (input && input.trim()) {
			window.location.href = `/verify?fileId=${input.trim()}`;
		}
	}
</script>

<svelte:head>
	<title>Document Verified - IPO Nigeria</title>
	<meta
		name="description"
		content="Official document verification - Intellectual Property Office of Nigeria"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<main class="min-h-screen bg-white">
	{#if isLoading}
		<div class="flex flex-col items-center justify-center min-h-screen text-black">
			<!-- Nigerian Coat of Arms -->
			<div class="mb-8 animate-pulse">
				<img src={coatOfArms} alt="Nigerian Coat of Arms" class="w-32 h-32" />
			</div>

			<div class="relative w-20 h-20 mb-6">
				<div
					class="absolute inset-0 border-4 border-transparent border-t-black/60 rounded-full animate-spin"
				></div>
				<div
					class="absolute inset-2 border-4 border-transparent border-t-black/80 rounded-full animate-spin animation-delay-300"
				></div>
				<div
					class="absolute inset-4 border-4 border-transparent border-t-black rounded-full animate-spin animation-delay-600"
				></div>
			</div>

			<p class="text-xl font-medium mb-2">Verifying Document...</p>
			<p class="text-sm opacity-75">Federal Republic of Nigeria</p>
		</div>
	{:else}
		<div class="min-h-screen text-black animate-fade-in">
			<!-- Header with Nigerian Coat of Arms -->
			<header class="bg-white border-b-2 border-black/10 text-center py-8 px-4">
				<!-- Nigerian Coat of Arms -->
				<div class="flex justify-center mb-6">
					<img src={coatOfArms} alt="Nigerian Coat of Arms" class="w-24 h-24 md:w-32 md:h-32" />
				</div>

				<div class="max-w-4xl mx-auto" style="font-family: 'Times New Roman', Times, serif;">
					<h1 class="text-2xl md:text-4xl font-bold mb-2">Federal Republic of Nigeria</h1>
					<h2 class="text-lg md:text-2xl font-semibold mb-1 opacity-90">
						Federal Ministry of Industry, Trade and Investment
					</h2>
					<h3 class="text-xl md:text-2xl font-semibold mb-1 opacity-90">Commercial Law Department</h3>
				</div>
			</header>

			<div class="max-w-4xl mx-auto px-4 py-8">
				{#if verificationStatus === 'verified' && trademarkData}
					<!-- Main Verification Badge -->
					<div
						class="bg-white border-2 border-green-500/50 rounded-3xl p-6 md:p-12 text-center mb-8 animate-bounce-in"
					>
						<div class="flex justify-center mb-6">
							<svg
								width="100"
								height="100"
								viewBox="0 0 24 24"
								fill="none"
								class="animate-bounce-in-delayed"
							>
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke="#10B981"
									stroke-width="2"
									fill="#10B981"
									fill-opacity="0.1"
								/>
								<path
									d="m9 12 2 2 4-4"
									stroke="#10B981"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>

						<h2 class="text-3xl md:text-5xl font-bold mb-4 text-green-600 drop-shadow-lg">
							Document Verified
						</h2>
					</div>

					<!-- Document Information -->
					<div class="bg-white rounded-2xl p-6 md:p-8 mb-8 border border-black/10">
						<h3 class="text-xl md:text-2xl font-bold text-center mb-6">
							Verified Document Details
						</h3>
						<div class="grid gap-4 md:gap-6">
							<!-- <div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-black/10"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0">Document Type:</span>
								<span class="font-medium text-right">Trademark Acceptance Letter</span>
							</div> -->
							<div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-black/10"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0">File Number:</span>
								<span class="font-mono text-sm bg-black/5 px-3 py-2 rounded-lg"
									>{trademarkData.fileId}</span
								>
							</div>
							<div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-black/10"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0"> Title:</span>
								<span class="font-medium text-right">{trademarkData.title}</span>
							</div>
							<!-- <div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-black/10"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0">Filing Date:</span>
								<span class="font-medium text-right"
									>{mapDateToString(trademarkData.filingDate)}</span
								>
							</div> -->
							<!-- <div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3 border-b border-black/10"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0">Status:</span>
								<AppStatusTag value={trademarkData.fileStatus} />
							</div> -->
							<div
								class="flex flex-col md:flex-row justify-between items-start md:items-center py-3"
							>
								<span class="font-semibold opacity-80 mb-1 md:mb-0">Verification Date:</span>
								<span class="font-medium text-right">{mapDateToString(scanTimestamp)}</span>
							</div>
						</div>
					</div>
				{:else if verificationStatus === 'invalid'}
					<div class="bg-white border-2 border-red-500/50 rounded-3xl p-6 md:p-12 text-center mb-8">
						<div class="flex justify-center mb-6">
							<svg width="100" height="100" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="#DC2626" stroke-width="2" />
								<path d="m15 9-6 6" stroke="#DC2626" stroke-width="2" stroke-linecap="round" />
								<path d="m9 9 6 6" stroke="#DC2626" stroke-width="2" stroke-linecap="round" />
							</svg>
						</div>
						<h2 class="text-3xl md:text-5xl font-bold mb-4 text-red-600">Document Not Found</h2>
						<p class="text-lg md:text-xl leading-relaxed opacity-95 max-w-2xl mx-auto mb-4">
							{verificationMessage}
						</p>
						{#if fileId}
							<p class="font-mono text-sm bg-black/5 px-3 py-2 rounded-lg inline-block">
								File ID: {fileId}
							</p>
						{/if}
					</div>
				{:else if verificationStatus === 'error'}
					<div
						class="bg-white border-2 border-yellow-500/50 rounded-3xl p-6 md:p-12 text-center mb-8"
					>
						<div class="flex justify-center mb-6">
							<svg width="100" height="100" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="#F59E0B" stroke-width="2" />
								<path d="M12 8v4" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
								<path d="m12 16 .01 0" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
							</svg>
						</div>
						<h2 class="text-3xl md:text-5xl font-bold mb-4 text-yellow-600">Verification Error</h2>
						<p class="text-lg md:text-xl leading-relaxed opacity-95 max-w-2xl mx-auto">
							{verificationMessage}
						</p>
					</div>
				{:else}
					<!-- General info page when no fileId is provided -->
					<div
						class="bg-white border-2 border-blue-500/50 rounded-3xl p-6 md:p-12 text-center mb-8"
					>
						<div class="flex justify-center mb-6">
							<svg width="100" height="100" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="#3B82F6" stroke-width="2" />
								<path
									d="m9 12 2 2 4-4"
									stroke="#3B82F6"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<h2 class="text-3xl md:text-5xl font-bold mb-4 text-blue-600">
							IPO Nigeria Document Verification
						</h2>
						<p class="text-lg md:text-2xl leading-relaxed opacity-95 max-w-2xl mx-auto mb-8">
							Verify the authenticity of official documents issued by the Intellectual Property
							Office of Nigeria
						</p>

						<div class="bg-black/5 rounded-2xl p-6 md:p-8 text-left max-w-2xl mx-auto">
							<h3 class="text-xl font-bold text-center mb-6">How to Verify Documents</h3>
							<ol class="space-y-3 text-lg">
								<li class="flex items-start">
									<span
										class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5"
										>1</span
									>
									<span class="text-black">Scan the QR code on your official document</span>
								</li>
								<!-- <li class="flex items-start">
									<span
										class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5"
										>2</span
									>
									<span class="text-black"
										>Or enter your File ID manually using the button below</span
									>
								</li> -->
								<li class="flex items-start">
									<span
										class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0.5"
										>3</span
									>
									<span class="text-black"
										>View verification results and document details instantly</span
									>
								</li>
							</ol>
						</div>
					</div>
				{/if}

				<!-- Authenticity Notice -->
				<!-- <div class="bg-green-500/5 border border-green-500/30 rounded-2xl p-6 md:p-8 mb-8 text-black">
          <h3 class="text-xl md:text-2xl font-bold text-green-600 mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Authenticity Guaranteed
          </h3>
          <p class="leading-relaxed opacity-90">
            All genuine IPO Nigeria documents contain QR codes that link directly to this official verification system. 
            This ensures the authenticity and legitimacy of your intellectual property documents.
          </p>
        </div> -->

				<!-- Security Features -->
				<!-- <div class="bg-black/5 rounded-2xl p-6 md:p-8 mb-8 text-black">
          <h3 class="text-xl md:text-2xl font-bold text-center mb-6">Security Features</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex flex-col items-center text-center p-4 bg-black/10 rounded-xl hover:bg-black/15 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
              <div class="text-3xl mb-2">📱</div>
              <span class="text-sm font-medium">QR Code Verification</span>
            </div>
            <div class="flex flex-col items-center text-center p-4 bg-black/10 rounded-xl hover:bg-black/15 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
              <div class="text-3xl mb-2">🔐</div>
              <span class="text-sm font-medium">Digital Authentication</span>
            </div>
            <div class="flex flex-col items-center text-center p-4 bg-black/10 rounded-xl hover:bg-black/15 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
              <div class="text-3xl mb-2">✅</div>
              <span class="text-sm font-medium">Official Seal</span>
            </div>
            <div class="flex flex-col items-center text-center p-4 bg-black/10 rounded-xl hover:bg-black/15 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
              <div class="text-3xl mb-2">🏛️</div>
              <span class="text-sm font-medium">Government Issued</span>
            </div>
          </div>
        </div> -->

				<!-- Action Buttons -->
				<div class="flex flex-col md:flex-row gap-4 justify-center mb-8">
					<button
						on:click={goToPortal}
						class="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-900 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg min-w-[200px] flex items-center justify-center"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
							/>
						</svg>
						Visit IPO Nigeria Portal
					</button>

					<!-- <button
						on:click={contactSupport}
						class="bg-transparent text-black px-8 py-4 rounded-full font-bold text-lg border-2 border-black hover:bg-black hover:text-white transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 min-w-[200px] flex items-center justify-center"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						Contact Us
					</button> -->
				</div>

				<!-- Warning Notice -->
				<!-- <div class="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-6 md:p-8 mb-8 text-black">
          <h4 class="text-lg md:text-xl font-bold text-yellow-600 mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            Important Notice
          </h4>
          <p class="leading-relaxed opacity-90">
            If you received this document from an unofficial source or suspect fraud, 
            please contact our office immediately. Genuine IPO Nigeria documents 
            will always direct to this official verification page.
          </p>
        </div> -->
			</div>

			<!-- Footer -->
			<footer class="bg-white text-center py-8 px-4 border-t border-black/10 opacity-80 text-black">
				<p class="mb-2 text-sm">&copy; 2024 Federal Ministry of Industry, Trade and Investment</p>
				
				<p class="mb-4 text-sm">Powered by</p>
				<div class="p-4 border-t border-gray-100 flex justify-center">
					<img src="/einao.png" alt="einao logo" class="h-12 w-auto opacity-70" />
				</div>
				<div class="flex justify-center items-center gap-4 text-sm">
					<a href="https://iponigeria.com" class="hover:text-green-600 transition-colors underline"
						>iponigeria.com</a
					>
					<!-- <span class="opacity-50">•</span>
          <a href="mailto:info@iponigeria.com" class="hover:text-green-600 transition-colors underline">info@iponigeria.com</a> -->
				</div>
			</footer>
		</div>
	{/if}
</main>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		60% {
			transform: scale(1.15);
			opacity: 0.8;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.8s ease-out;
	}

	.animate-bounce-in {
		animation: bounceIn 0.8s ease-out;
	}

	.animate-bounce-in-delayed {
		animation: bounceIn 0.8s ease-out 0.3s both;
	}

	.animation-delay-300 {
		animation-delay: 300ms;
	}

	.animation-delay-600 {
		animation-delay: 600ms;
	}
</style>
