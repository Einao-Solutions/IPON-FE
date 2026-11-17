<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import * as Pagination from "$lib/components/ui/pagination";

  export let pageIndex = 0;
  export let pageSize = 10;
  export let totalCount = 0;
  export let disabled = false;
  const dispatch = createEventDispatcher<{ change: void }>();

  function changePage(page: number) {
    if (disabled || page === pageIndex + 1) return;
    pageIndex = page - 1;
    dispatch("change");
  }
</script>

<div class="users-pagination">
  <p aria-live="polite">
    {totalCount} matching results | Page {pageIndex + 1} of {Math.max(
      1,
      Math.ceil(totalCount / pageSize),
    )}
  </p>
  <div class="users-pagination-controls">
    <label class="flex items-center gap-2 whitespace-nowrap">
      Per page
      <select
        class="rounded-md border bg-background p-2"
        bind:value={pageSize}
        {disabled}
        on:change={() => {
          pageIndex = 0;
          dispatch("change");
        }}
      >
        {#each [10, 20, 50, 100] as size}
          <option value={size}>{size}</option>
        {/each}
      </select>
    </label>
    <Pagination.Root
      count={totalCount}
      perPage={pageSize}
      page={pageIndex + 1}
      onPageChange={changePage}
      let:pages
    >
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton disabled={disabled || pageIndex === 0} />
        </Pagination.Item>
        {#each pages as page (page.key)}
          {#if page.type === "ellipsis"}
            <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link
                {page}
                {disabled}
                isActive={pageIndex + 1 === page.value}
                aria-current={pageIndex + 1 === page.value ? "page" : undefined}
              >
                {page.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton
            disabled={disabled || (pageIndex + 1) * pageSize >= totalCount}
          />
        </Pagination.Item>
      </Pagination.Content>
    </Pagination.Root>
  </div>
</div>
