<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { InputEvents } from './index.js';
	import { cn } from '$lib/utils.js';
	import { Motion, useMotionTemplate, useMotionValue } from 'svelte-motion';

	type $$Props = HTMLInputAttributes;
	type $$Events = InputEvents;

	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = undefined;
	export { className as class };
	let visible = false;

	let mouseX = useMotionValue(0);
	let mouseY = useMotionValue(0);

	function handleMouseMove({ currentTarget, clientX, clientY }: any) {
		let { left, top } = currentTarget.getBoundingClientRect();

		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}
	// Workaround for https://github.com/sveltejs/svelte/issues/9305
	// Fixed in Svelte 5, but not backported to 4.x.
	export let readonly: $$Props['readonly'] = undefined;
</script>

<!--<Motion-->
<!--	let:motion-->
<!--	style={{-->
<!--		background: visible-->
<!--			? useMotionTemplate`-->
<!--  radial-gradient(-->
<!--    100px circle at ${mouseX}px ${mouseY}px,-->
<!--    var(&#45;&#45;green-500),-->
<!--    transparent 80%-->
<!--  )-->
<!--`-->
<!--			: useMotionTemplate`-->
<!--  radial-gradient(-->
<!--    '0px' circle at ${mouseX}px ${mouseY}px,-->
<!--    var(&#45;&#45;green-500),-->
<!--    transparent 80%-->
<!--  )-->
<!--`-->
<!--	}}-->
<!--&gt;-->
<!--	<div-->
<!--		use:motion-->
<!--		on:mousemove={handleMouseMove}-->
<!--		on:mouseenter={() => (visible = true)}-->
<!--		on:mouseleave={() => (visible = false)}-->
<!--		class="group/input rounded-lg p-[2px] transition duration-300"-->
<!--	>-->
	<input
		class={cn(
			'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
		bind:value
		{readonly}
		on:blur
		on:change
		on:click
		on:focus
		on:focusin
		on:focusout
		on:keydown
		on:keypress
		on:keyup
		on:mouseover
		on:mouseenter
		on:mouseleave
		on:mousemove
		on:paste
		on:input
		on:wheel|passive
		{...$$restProps}
	/>
<!--	</div>-->
<!--</Motion>-->
