<script lang="ts">
  import { onMount } from "svelte";

  const STORAGE_KEY = "cookie_consent";
  // Retain user choice for 6 months (common practice under ePrivacy guidance)
  const CONSENT_TTL_MS = 1000 * 60 * 60 * 24 * 180;

  type ConsentRecord = {
    value: "accepted" | "rejected";
    timestamp: number;
  };

  let visible = false;

  function readConsent(): ConsentRecord | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ConsentRecord;
      if (!parsed?.value || typeof parsed.timestamp !== "number") return null;
      if (Date.now() - parsed.timestamp > CONSENT_TTL_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function setConsent(value: "accepted" | "rejected") {
    try {
      const record: ConsentRecord = { value, timestamp: Date.now() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // ignore storage errors (e.g. privacy mode / quota)
    }
    visible = false;
  }

  onMount(() => {
    if (!readConsent()) visible = true;
  });
</script>

{#if visible}
  <div
    class="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    role="dialog"
    aria-live="polite"
    aria-label="Cookie consent"
  >
    <div
      class="mx-auto max-w-3xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="text-sm text-slate-700 leading-relaxed">
        We use cookies to enable secure login, remember preferences, and analyse
        usage. Read our
        <a
          href="/cookie-policy"
          class="text-green-800 font-medium underline hover:text-green-900"
          >Cookies Policy</a
        >
        to learn more.
      </div>
      <div class="flex items-center gap-2 sm:flex-shrink-0">
        <button
          type="button"
          on:click={() => setConsent("rejected")}
          class="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Reject
        </button>
        <button
          type="button"
          on:click={() => setConsent("accepted")}
          class="px-4 py-2 text-sm font-semibold rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  </div>
{/if}
