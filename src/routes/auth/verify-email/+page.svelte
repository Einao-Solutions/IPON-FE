<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "$lib/components/ui/button";
  import { baseURL } from "$lib/helpers";

  let status: "loading" | "success" | "error" = "loading";
  let message = "Verifying your email address...";
  const redirectDelayMs = 5000;
  let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  function scheduleRedirectToSignIn() {
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
    }

    redirectTimeout = setTimeout(() => {
      void goto("/auth");
    }, redirectDelayMs);
  }

  async function verifyEmailFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email")?.trim() ?? "";
    const token = params.get("token")?.trim() ?? "";

    if (!email || !token) {
      status = "error";
      message = "The verification link is invalid. Please request a new verification email.";
      return;
    }

    const verifyUrl = `${baseURL}/api/auth/VerifyEmail?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    try {
      const getResponse = await fetch(verifyUrl, {
        method: "GET",
      });

      if (getResponse.ok) {
        status = "success";
        message = "Your email has been verified successfully. Redirecting to sign in in 5 seconds...";
        scheduleRedirectToSignIn();
        return;
      }

      const postResponse = await fetch(verifyUrl, {
        method: "POST",
      });

      if (postResponse.ok) {
        status = "success";
        message = "Your email has been verified successfully. Redirecting to sign in in 5 seconds...";
        scheduleRedirectToSignIn();
      } else {
        status = "error";
        message = "Verification failed. The link may be expired or already used.";
      }
    } catch (error) {
      status = "error";
      message = "We could not verify your email right now. Please try again later.";
    }
  }

  onMount(async () => {
    await verifyEmailFromUrl();

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
  <div class="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
    <div class="w-full rounded-2xl bg-white p-8 text-center shadow-xl">
      {#if status === "loading"}
        <Icon
          icon="line-md:loading-twotone-loop"
          class="mx-auto text-green-700"
          width="3rem"
          height="3rem"
        />
      {:else if status === "success"}
        <Icon
          icon="mdi:check-circle-outline"
          class="mx-auto text-green-700"
          width="3rem"
          height="3rem"
        />
      {:else}
        <Icon
          icon="mdi:alert-circle-outline"
          class="mx-auto text-red-600"
          width="3rem"
          height="3rem"
        />
      {/if}

      <h1 class="mt-4 text-2xl font-bold text-slate-900">Email Verification</h1>
      <p class="mt-3 text-sm text-slate-600">{message}</p>

      <div class="mt-6 space-y-3">
        <Button
          class="w-full bg-green-700 text-white hover:bg-green-800"
          on:click={() => goto("/auth")}
        >
          Go to sign in
        </Button>
        {#if status === "error"}
          <Button
            variant="outline"
            class="w-full"
            on:click={() => goto("/auth")}
          >
            Request new verification email
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
