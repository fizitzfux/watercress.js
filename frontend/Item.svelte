<script>
    import { selected, item_ids_by_date, items, tasks } from './state.svelte.js';
    import { post, put, remove } from './api.svelte.js';

    let item = $state({})
    $effect(() => {
        item = Object.assign({
            id: selected.item_id,
            at: selected.date,
            task_id: "-1",
        }, items[selected.item_id])
    })
    let task = $derived(Object.assign({}, tasks[item.task_id]))
    let is_new = $derived(item.id < 0)

    async function onSave() {
        if (is_new) {
            if (item.task_id == "-1") {
                // Create new task
                const data = await post('task').with({
                    title: item.title,
                })
                if (data) {
                    tasks[data.id] = {
                        id: data.id,
                        title: item.title,
                    }
                    item.task_id = data.id
                }
            }
            // Create new item
            const data = await post('item').with(item)
            if (data) {
                console.log(data)
                item.id = data.id
                items[data.id] = item
                selected.item_id = data.id
                if (!item_ids_by_date[item.at]) {
                    item_ids_by_date[item.at] = []
                }
                item_ids_by_date[item.at].push(data.id)
                selected.date = item.at
            }
        }
        else {
            // Update item
            put(`item/${item.id}`).with(item)
            if (item.at !== items[item.id].at) {
                if (!item_ids_by_date[item.at]) {
                    item_ids_by_date[item.at] = []
                }
                item_ids_by_date[items[item.id].at]?.splice(item_ids_by_date[items[item.id].at].indexOf(item.id), 1)
                item_ids_by_date[item.at].push(item.id)
                selected.date = item.at
            }
            items[item.id] = item
        }
    }

    function onDelete() {
        remove(`item/${item.id}`)
        selected.item_id = null
        item_ids_by_date[selected.date].splice(item_ids_by_date[selected.date].indexOf(item.id), 1)
        delete items[item.id]
    }
</script>

<!-- Task selector -->
<select name="task" bind:value="{item.task_id}" disabled={!is_new}>
    {#if is_new}
        <option value="-1">New task</option>
        {#each Object.entries(tasks) as [id, t]}
            <option value="{id}">{t.title}</option>
        {/each}
    {:else}
        <option value="{task.id}">{task.title}</option>
    {/if}
</select>
<input type="text" name="title" bind:value={item.title} class={item.task_id == "-1" ? '' : 'hidden'} />

<input type="date" name="at" bind:value={item.at} />

<div class="button_group">
    <button onclick={()=>selected.item_id = null}>Close</button>
    {#if !is_new}
        <button onclick={onDelete}>Delete</button>
    {/if}
    <button onclick={onSave}>Save</button>
</div>
