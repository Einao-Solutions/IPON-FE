<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import type { TextareaEvents } from './index.js';
	import { cn } from '$lib/utils.js';
	import { Motion, useMotionTemplate, useMotionValue } from 'svelte-motion';

	type $$Props = HTMLTextareaAttributes;
	type $$Events = TextareaEvents;
	let visible = false;

	let mouseX = useMotionValue(0);
	let mouseY = useMotionValue(0);

	function handleMouseMove({ currentTarget, clientX, clientY }: any) {
		let { left, top } = currentTarget.getBoundingClientRect();

		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}
	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = undefined;
	export { className as class };

	// Workaround for https://github.com/sveltejs/svelte/issues/9305
	// Fixed in Svelte 5, but not backported to 4.x.
	export let readonly: $$Props['readonly'] = undefined;
</script>

<Motion
	let:motion
	style={{
		background: visible
			? useMotionTemplate`
  radial-gradient(
    100px circle at ${mouseX}px ${mouseY}px,
    var(--green-500),
    transparent 80%
  )
`
			: useMotionTemplate`
  radial-gradient(
    '0px' circle at ${mouseX}px ${mouseY}px,
    var(--green-500),
    transparent 80%
  )
`
	}}
>
	<div
		use:motion
		on:mousemove={handleMouseMove}
		on:mouseenter={() => (visible = true)}
		on:mouseleave={() => (visible = false)}
		class="group/input rounded-lg p-[2px] transition duration-300"
	>
		<textarea
			class={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			bind:value
			{readonly}
			on:blur
			on:change
			on:click
			on:focus
			on:keydown
			on:keypress
			on:keyup
			on:mouseover
			on:mouseenter
			on:mouseleave
			on:paste
			on:input
			{...$$restProps}
		></textarea>
	</div>
</Motion>
