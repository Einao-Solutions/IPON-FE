<script lang="ts">
		import Input from '../../lib/components/ui/input/input.svelte';
		import * as Form from "$lib/components/ui/form"
		import {zodClient} from "sveltekit-superforms/adapters";
		import {loginSchema, type LoginSchema} from "./schema";
		import {currentScreen} from '$lib/store';
		import {
		type SuperValidated,
		type Infer,
		superForm} from "sveltekit-superforms";
		import { goto } from '$app/navigation';
		export let data: SuperValidated<Infer<LoginSchema>>;
		function SignUp()
		{
			if(window.innerWidth>640)
			{
				goto("signup");
			}

			else {
				currentScreen.set(1);
			}
		}
		function ForgotPassword()
		{
			if(window.innerWidth>640)
			{
				goto("reset");
			}

			else {
				currentScreen.set(2);
			}
		}
</script>

<form method="post" use:enhance>
	<Form.Field {form} name="email">
		<Form.Control let:attrs>
			<Form.Label>Email</Form.Label>
			<Input {...attrs} bind:value={$formData.email} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control let:attrs>
			<Form.Label>Password</Form.Label>
			<Input type="password" {...attrs} bind:value={$formData.password} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<p>Dont have an account, sign up <button on:click={()=>SignUp()}>here</button></p>
	<p>forgotten password? click <button on:click={()=>ForgotPassword()}>here</button></p>
	<Form.Button>Submit</Form.Button>
</form>