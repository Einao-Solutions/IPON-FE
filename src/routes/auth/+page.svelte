<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import ministry from "$lib/assets/ministry.png";
  import logo from "$lib/assets/logo.png";
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { Label } from "$lib/components/ui/label";
  import { Toaster } from "$lib/components/ui/sonner";
  import { toast } from "svelte-sonner";
  import Icon from "@iconify/svelte";
  import { baseURL, UserRoles, type UsersType, UserTypes } from "$lib/helpers";
  import { goto } from "$app/navigation";
  import { loggedInUser } from "$lib/store";
  import { onMount } from "svelte";

  interface CreateUserRequest {
    email: string;
    password: string;
    verifypassword: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }

  interface AuthResponse {
    token?: string;
    user?: UsersType;
    message?: string;
  }

  let createUser: CreateUserRequest = {
    email: "",
    password: "",
    verifypassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  };

  let currentScreen: number = 0;
  let email: string = "";
  let password: string = "";
  let showVerificationEmail: boolean = false;
  let isLoading: boolean = false;
  let resetEmail: string | undefined = undefined;

  onMount(async () => {
    const url = $page.url;
    const token = getTokenFromCookie();

    if (token && (await validateToken(token))) {
      await goto("/home/dashboard");
    }

    const verify_user = url.searchParams.get("verify_user") ?? null;
    if (verify_user !== null) {
      await verifyUser(verify_user);
    }
  });

  function getTokenFromCookie(): string | null {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) => c.trim().startsWith("auth_token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  }

  function setAuthCookies(token: string) {
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; secure; samesite=strict`;
    // document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${maxAge * 4}; secure; samesite=strict`;
  }

  function clearAuthCookies() {
    document.cookie = "auth_token=; path=/; max-age=0";
    document.cookie = "refresh_token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
  }

  async function validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseURL}/api/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async function verifyUser(userId: string) {
    currentScreen = 1;
    try {
      const response = await fetch(
        `${baseURL}/api/auth/verify?userId=${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        email = data.email;
        currentScreen = 0;
        toast.success(
          "Successfully verified account, please login to continue",
          {
            position: "top-right",
          }
        );
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.", {
        position: "top-right",
      });
      currentScreen = 0;
    }
  }

  async function sendVerificationEmail(email: string, userId: string) {
    try {
      const response = await fetch(`${baseURL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          userId,
          verificationUrl: `${window.location.origin}/auth?verify_user=${userId}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  }

  function validatePassword(password: string): {
    valid: boolean;
    message?: string;
  } {
    if (password.length < 8) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long",
      };
    }
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }
    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number",
      };
    }
    return { valid: true };
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function CreateUserAccount() {
    if (!createUser.firstName || !createUser.lastName) {
      toast.error("Please provide both first and last name", {
        position: "top-right",
      });
      return;
    }

    if (!validateEmail(createUser.email)) {
      toast.error("Please provide a valid email address", {
        position: "top-right",
      });
      return;
    }

    if (createUser.password !== createUser.verifypassword) {
      toast.error("Passwords do not match", {
        position: "top-right",
      });
      return;
    }

    const passwordValidation = validatePassword(createUser.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message, {
        position: "top-right",
      });
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createUser.email,
          password: createUser.password,
          firstName: createUser.firstName,
          lastName: createUser.lastName,
          phoneNumber: createUser.phoneNumber,
          roles: [UserRoles.Agent],
        }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        await sendVerificationEmail(createUser.email, data.user.id);

        toast.success("Account created successfully", {
          position: "top-right",
          description: `Verification email has been sent to ${createUser.email}`,
        });

        currentScreen = 0;
        showVerificationEmail = true;

        // Clear form
        createUser = {
          email: "",
          password: "",
          verifypassword: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
        };
      } else {
        const error = await response.json();
        toast.error(error.message || "Registration failed", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("An error occurred during registration", {
        position: "top-right",
      });
    } finally {
      isLoading = false;
    }
  }

  async function login() {
    if (!validateEmail(email)) {
      toast.error("Please provide a valid email address", {
        position: "top-right",
      });
      return;
    }

    if (!password) {
      toast.error("Please provide a password", {
        position: "top-right",
      });
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();

        // if (!data.success || !data.token) {
        //   throw new Error("Failed to Login");
        // }

        // Set auth tokens
        setAuthCookies(data.token);
		console.log("okay");

        // // Set user data
        // loggedInUser.set(data.user);
        // const encoded = encodeURIComponent(JSON.stringify(data.user));
        // document.cookie = `user=${encoded}; path=/; max-age=${7 * 24 * 60 * 60}`;

        toast.success("Login successful", {
          position: "top-right",
        });
        await goto("/home/dashboard");
      } else {
        const error = await response.json();

        switch (response.status) {
          case 401:
            toast.error("Invalid email or password", {
              position: "top-right",
            });
            break;
          case 403:
            toast.error("Please verify your email before logging in", {
              position: "top-right",
            });
            showVerificationEmail = true;
            break;
          default:
            toast.error(error.message || "Login failed", {
              position: "top-right",
            });
        }
      }
    } catch (error) {
      toast.error("An error occurred during login", {
        position: "top-right",
      });
    } finally {
      isLoading = false;
    }
  }

  async function resetPassword() {
    if (!resetEmail || !validateEmail(resetEmail)) {
      toast.error("Please provide a valid email address", {
        position: "top-right",
      });
      return;
    }

    isLoading = true;

    try {
      const response = await fetch(`${baseURL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          resetUrl: `${window.location.origin}/auth/reset-password`,
        }),
      });

      if (response.ok) {
        toast.success("Password reset email sent", {
          position: "top-right",
          description: `Password reset instructions have been sent to ${resetEmail}`,
        });
        resetEmail = "";
        currentScreen = 0;
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to send reset email", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("An error occurred while sending reset email", {
        position: "top-right",
      });
    } finally {
      isLoading = false;
    }
  }

  async function resendVerificationEmail() {
    if (!email || !validateEmail(email)) {
      toast.error("Please provide a valid email address", {
        position: "top-right",
      });
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success("Verification email resent", {
          position: "top-right",
        });
      } else {
        toast.error("Failed to resend verification email", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        position: "top-right",
      });
    }
  }
</script>

<Toaster />
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  <div
    class="relative flex min-h-screen w-full items-center justify-between overflow-hidden p-4 md:p-10"
  >
    <!-- Left side - Information -->
    <div class="hidden lg:flex lg:w-1/2 space-y-8 pr-12">
      <div class="space-y-6">
        <img alt="logo" src={logo} class="object-contain h-24" />

        <div class="space-y-6 text-slate-700">
          <div
            class="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <div class="flex-shrink-0 mt-1">
              <Icon
                icon="hugeicons:file-add"
                class="text-green-600"
                width="1.5rem"
                height="1.5rem"
              />
            </div>
            <div>
              <strong class="text-lg text-slate-900"
                >Register Your IP Rights</strong
              >
              <p class="mt-2 text-sm">
                Protect your intellectual property and secure your competitive
                edge. Register your trademarks, patents and designs today.
              </p>
            </div>
          </div>

          <div
            class="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <div class="flex-shrink-0 mt-1">
              <Icon
                icon="ant-design:file-done-outlined"
                class="text-blue-600"
                width="1.5rem"
                height="1.5rem"
              />
            </div>
            <div>
              <strong class="text-lg text-slate-900">Renew Your Rights</strong>
              <p class="mt-2 text-sm">
                Don't let your rights expire. Renew now to maintain
                uninterrupted protection.
              </p>
            </div>
          </div>

          <div
            class="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <div class="flex-shrink-0 mt-1">
              <Icon
                icon="ic:baseline-sync"
                class="text-purple-600"
                width="1.5rem"
                height="1.5rem"
              />
            </div>
            <div>
              <strong class="text-lg text-slate-900">Update Your Data</strong>
              <p class="mt-2 text-sm">
                Keep your information current. Update your data for a seamless
                experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right side - Authentication Form -->
    <div class="w-full lg:w-1/2 max-w-md mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {#if currentScreen === 0}
          <!-- Login Form -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p class="mt-2 text-sm text-slate-600">Sign in to your account</p>
            </div>

            {#if showVerificationEmail}
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start">
                  <Icon
                    icon="mdi:check-circle"
                    class="text-green-600 mt-0.5 mr-2"
                    width="1.2rem"
                    height="1.2rem"
                  />
                  <div class="text-sm text-green-800">
                    <p class="font-medium">Verification email sent</p>
                    <p class="mt-1">
                      Please check {email} to verify your account
                    </p>
                    <Button
                      variant="link"
                      class="p-0 h-auto text-green-700 mt-2"
                      on:click={resendVerificationEmail}
                    >
                      Resend verification email
                    </Button>
                  </div>
                </div>
              </div>
            {/if}

            <div class="space-y-4">
              <div>
                <Label class="text-slate-700">Email</Label>
                <Input
                  type="email"
                  bind:value={email}
                  placeholder="you@example.com"
                  class="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label class="text-slate-700">Password</Label>
                <Input
                  type="password"
                  bind:value={password}
                  placeholder="••••••••"
                  class="mt-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              class="w-full bg-green-700 hover:bg-green-800 text-white"
              on:click={() => login()}
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
              Sign In
            </Button>

            <div class="space-y-2 pt-4 border-t">
              <Button
                variant="ghost"
                class="w-full justify-center text-slate-600 hover:text-slate-900"
                on:click={() => (currentScreen = 2)}
              >
                Don't have an account? <span class="ml-1 font-semibold"
                  >Sign up</span
                >
              </Button>

              <Button
                variant="ghost"
                class="w-full justify-center text-slate-600 hover:text-slate-900"
                on:click={() => (currentScreen = 4)}
              >
                Forgot your password?
              </Button>
            </div>
          </div>
        {:else if currentScreen === 2}
          <!-- Sign Up Form -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-3xl font-bold text-slate-900">Create Account</h2>
              <p class="mt-2 text-sm text-slate-600">Join IPONigeria today</p>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label class="text-slate-700">First Name</Label>
                  <Input
                    bind:value={createUser.firstName}
                    placeholder="John"
                    class="mt-1"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label class="text-slate-700">Last Name</Label>
                  <Input
                    bind:value={createUser.lastName}
                    placeholder="Doe"
                    class="mt-1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label class="text-slate-700">Email</Label>
                <Input
                  type="email"
                  bind:value={createUser.email}
                  placeholder="you@example.com"
                  class="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label class="text-slate-700">Phone Number</Label>
                <Input
                  type="tel"
                  bind:value={createUser.phoneNumber}
                  placeholder="+234 800 000 0000"
                  class="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label class="text-slate-700">Password</Label>
                <Input
                  type="password"
                  bind:value={createUser.password}
                  placeholder="••••••••"
                  class="mt-1"
                  disabled={isLoading}
                />
                <p class="mt-1 text-xs text-slate-500">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <Label class="text-slate-700">Confirm Password</Label>
                <Input
                  type="password"
                  bind:value={createUser.verifypassword}
                  placeholder="••••••••"
                  class="mt-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              class="w-full bg-green-700 hover:bg-green-800 text-white"
              on:click={CreateUserAccount}
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
              Create Account
            </Button>

            <div class="pt-4 border-t">
              <Button
                variant="ghost"
                class="w-full justify-center text-slate-600 hover:text-slate-900"
                on:click={() => (currentScreen = 0)}
                disabled={isLoading}
              >
                Already have an account? <span class="ml-1 font-semibold"
                  >Sign in</span
                >
              </Button>
            </div>
          </div>
        {:else if currentScreen === 4}
          <!-- Reset Password Form -->
          <div class="space-y-6">
            <div class="text-center">
              <h2 class="text-3xl font-bold text-slate-900">Reset Password</h2>
              <p class="mt-2 text-sm text-slate-600">
                Enter your email to receive reset instructions
              </p>
            </div>

            <div>
              <Label class="text-slate-700">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                bind:value={resetEmail}
                class="mt-1"
                disabled={isLoading}
              />
            </div>

            <div class="flex space-x-3">
              <Button
                variant="outline"
                class="flex-1"
                on:click={() => (currentScreen = 0)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                class="flex-1 bg-green-700 hover:bg-green-800 text-white"
                on:click={resetPassword}
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
                Send Reset Link
              </Button>
            </div>
          </div>
        {:else if currentScreen === 1}
          <!-- Verifying User -->
          <div class="space-y-6 text-center py-8">
            <Icon
              icon="line-md:loading-loop"
              class="mx-auto text-green-600"
              width="3rem"
              height="3rem"
            />
            <div>
              <h3 class="text-xl font-semibold text-slate-900">
                Verifying Account
              </h3>
              <p class="mt-2 text-sm text-slate-600">
                Please wait while we verify your account...
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Mobile logo -->
      <div class="lg:hidden mt-8 text-center">
        <img alt="logo" src={logo} class="object-contain h-16 mx-auto" />
      </div>
    </div>
  </div>
</div>
