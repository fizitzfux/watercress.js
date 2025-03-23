<script>
    import ListItem from "./ListItem.svelte";
    import { get } from "./api.svelte";
    import { selected, items, item_ids_by_date, today, tasks } from './state.svelte.js';
    
    $effect(async () => {
        const data = await get(`task`)
        if (data) {
            data.tasks.forEach(task => {
                tasks[task.id] = task
            })
        }
    })
    
    $effect(async () => {
        // Copy date to avoid race condition
        const date = {tmp: selected.date}.tmp

        const data = await get(`item/ids/${date.replaceAll('-', '/')}`)
        if (data) {
            item_ids_by_date[date] ??= []
            data.item_ids.forEach(async id => {
                const item_data = await get(`item/${id}`) 
                if (item_data) {
                    const item = item_data.item
                    items[item.id] = item
                    if (!item_ids_by_date[date].includes(id)) {
                        item_ids_by_date[date].push(id)
                    }
                }
            })
        }
    })

    function addDays(amount) {
        let date = new Date(selected.date)
        date.setDate(date.getDate() + amount)
        selected.date = date.toISOString().substring(0, 10)
        selected.item_id = null
    }

    // Item feed subscription
    const subscription = new EventSource('/api/item/subscribe')

    subscription.addEventListener('open', () => {
        console.log('[SUB] connected')
    })
    
    subscription.addEventListener('error', () => {
        console.log('[SUB] connection error')
    })
    
    subscription.addEventListener('item_update', (e) => {
        console.log('[SUB] received item update')
        const item = JSON.parse(e.data)
        const old_item = items[item.id]
        items[item.id] = item

        if (old_item && item.at != old_item.at) {
            item_ids_by_date[old_item.at]?.splice(item_ids_by_date[old_item.at].indexOf(item.id), 1)
            if (!item_ids_by_date[item.at]) {
                item_ids_by_date[item.at] = []
            }
            item_ids_by_date[item.at].push(item.id)
        }
    })

    subscription.addEventListener('item_add', (e) => {
        console.log('[SUB] received new item')
        const item = JSON.parse(e.data)
        items[item.id] = item

        if (!item_ids_by_date[item.at]) {
            item_ids_by_date[item.at] = []
        }
        if (!item_ids_by_date[item.at].includes(item.id)) {
            item_ids_by_date[item.at].push(item.id)
        }
    })

    subscription.addEventListener('item_delete', (e) => {
        console.log('[SUB] received item deletion')
        const { id } = JSON.parse(e.data)
        const item = items[id]
        if (item) {
            item_ids_by_date[item.at]?.splice(item_ids_by_date[item.at].indexOf(item.id), 1)
        }
        delete items[id]
    })
</script>

<!-- Day selector -->
<div id="current_day">
    <button onclick={()=>addDays(-1)}>{'<'}</button>
    <input type="date" bind:value={selected.date} />
    <button onclick={()=>addDays(1)}>{'>'}</button>
</div>

<!-- Todo/completed selector -->
<div class="button_group {selected.date != today ? 'hidden' : ''}">
    <button onclick={()=>selected.completed = false} class={!selected.completed ? 'selected' : ''}>To Do</button>
    <button onclick={()=>selected.completed = true} class={selected.completed ? 'selected' : ''}>Completed</button>
</div>

<!-- Items -->
<ol>
    {#each item_ids_by_date[selected.date] as id}
        {#if items[id] && id >= 0}
            <ListItem bind:self={items[id]} />
        {/if}
    {/each}

    <!-- New item -->
    <li class="button_group">
        <button onclick={()=>selected.item_id = -1} class="{selected.item_id == -1 ? 'selected' : ''}">New Task</button>
    </li>
</ol>
