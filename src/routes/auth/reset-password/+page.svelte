<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Toaster } from "$lib/components/ui/sonner";
  import { toast } from "svelte-sonner";
  import Icon from "@iconify/svelte";
  import { baseURL } from "$lib/helpers";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let newPassword: string = "";
  let confirmPassword: string = "";
  let isLoading: boolean = false;
  let showNewPassword: boolean = false;
  let showConfirmPassword: boolean = false;
  let token: string = "";
  let email: string = "";

  onMount(() => {
    token = $page.url.searchParams.get("token") ?? "";
    email = $page.url.searchParams.get("email") ?? "";

    if (!token) {
      toast.error("Invalid or missing reset token", {
        position: "top-right",
      });
    }
  });

  function validatePassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
  }

  async function submitNewPassword() {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields", {
        position: "top-right",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-right",
      });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message, {
        position: "top-right",
      });
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token", {
        position: "top-right",
      });
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${baseURL}/api/auth/ResetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password reset successfully", {
          position: "top-right",
          description: "You can now sign in with your new password.",
        });
        await goto("/auth");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to reset password", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("An error occurred while resetting your password", {
        position: "top-right",
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<Toaster />

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-slate-900">Set New Password</h2>
          <p class="mt-2 text-sm text-slate-600">
            Enter your new password below
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <Label class="text-slate-700">New Password</Label>
            <div class="mt-1 flex items-center">
              <Input
                type={showNewPassword ? "text" : "password"}
                bind:value={newPassword}
                placeholder="••••••••"
                class="flex-1"
                disabled={isLoading}
              />
              <button
                type="button"
                class="ml-2 p-2 rounded hover:bg-slate-100 text-slate-600"
                on:click={() => (showNewPassword = !showNewPassword)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <Icon
                  icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"}
                  width="1.2rem"
                  height="1.2rem"
                />
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              Must be 8+ characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div>
            <Label class="text-slate-700">Confirm New Password</Label>
            <div class="mt-1 flex items-center">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                bind:value={confirmPassword}
                placeholder="••••••••"
                class="flex-1"
                disabled={isLoading}
              />
              <button
                type="button"
                class="ml-2 p-2 rounded hover:bg-slate-100 text-slate-600"
                on:click={() => (showConfirmPassword = !showConfirmPassword)}
                aria-label={showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"}
              >
                <Icon
                  icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
                  width="1.2rem"
                  height="1.2rem"
                />
              </button>
            </div>
          </div>
        </div>

        <Button
          class="w-full bg-green-700 hover:bg-green-800 text-white"
          on:click={submitNewPassword}
          disabled={isLoading}
        >
          {#if isLoading}
            <Icon
              icon="line-md:loading-twotone-loop"
              class="mr-2"
              width="1.2rem"
              height="1.2rem"
            />
          {/if}
          Reset Password
        </Button>

        <div class="pt-4 border-t">
          <Button
            variant="ghost"
            class="w-full justify-center text-slate-600 hover:text-slate-900"
            on:click={() => goto("/auth")}
            disabled={isLoading}
          >
            Back to <span class="ml-1 font-semibold">Sign in</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>