<script lang="ts">
	import Input from '../../lib/components/ui/input/input.svelte';
	import * as Form from "$lib/components/ui/form"
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { signupSchema, type SignUpSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import { currentScreen } from '$lib/store';
	export let data: SuperValidated<Infer<SignUpSchema>>;
	const form = superForm(data, {
		validators: zodClient(signupSchema),
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

