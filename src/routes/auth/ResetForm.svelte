<script lang="ts">
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { forgotPasswordSchema, type ForgotPasswordSchema } from './schema';
	import * as Form from "$lib/components/ui/form"
	export let data: SuperValidated<Infer<ForgotPasswordSchema>>;
	import { goto } from '$app/navigation';
	import Input from '../../lib/components/ui/input/input.svelte';
	import { currentScreen } from '$lib/store';


	const form = superForm(data, {
		validators: zodClient(forgotPasswordSchema),
	});
	const { form: formData, enhance} = form;

	function LoginPage()
	{
		if(window.innerWidth>640)
		{
			goto("login");
		}

		else {
			currentScreen.set(0);
		}
	}
</script>

<form method="POST" use:enhance>
	<Form.Field {form} name="email">
		<Input placeholder="Enter Email" bind:value={$formData.email}/>
	</Form.Field>
	<Form.Button>Reset</Form.Button>
	<span>Already Have an account?<button style="color: #0c4128; font-weight: bold" on:click={() => LoginPage()}>Login</button> </span>

</form>
