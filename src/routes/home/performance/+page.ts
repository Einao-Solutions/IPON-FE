import { browser } from '$app/environment';

export const prerender = true;

export async function load() {
    // Return empty data during prerender/SSR
    // The actual data will be fetched client-side in the component
    return {
        initialData: null
    };
}