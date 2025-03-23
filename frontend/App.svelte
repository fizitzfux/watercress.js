<script>
    import List from "./List.svelte";
    import Item from "./Item.svelte";
    import { selected, items, item_ids_by_date, tasks } from "./state.svelte";
    import { request_queue } from "./api.svelte";

    // Save states to localstorage on change
    // can be reset using window.resetState()
    $effect(() => window.localStorage?.setItem("selected", JSON.stringify(selected)))
    $effect(() => window.localStorage?.setItem("tasks", JSON.stringify(tasks)))
    $effect(() => window.localStorage?.setItem("items", JSON.stringify(items)))
    $effect(() => window.localStorage?.setItem("item_ids_by_date", JSON.stringify(item_ids_by_date)))
    $effect(() => window.localStorage?.setItem("request_queue", JSON.stringify(request_queue)))
</script>

{#if request_queue.length > 0}
    <span class="error">WARNING! No internet connection. {request_queue.length} requests queued</span>
{/if}

<!-- Screens are in reverse order so mobile layout works, CSS am I right.... -->
{#if selected.item_id}
    <div id="screen2">
        <Item />
    </div>
{:else}
    <div id="screen2" class="empty">
        <h3>No item selected.</h3>
    </div>
{/if}

<div id="screen1">
    <List />
</div>
