<script>
    import { put } from './api.svelte.js';
    import { selected, today, items, tasks, item_ids_by_date } from './state.svelte.js';

    let { self = $bindable() } = $props()

    let classes = $state('')
    $effect(() => {
        let result = []

        if (self.id == selected.item_id) {
            result.push('selected')
        }
    
        if (!self.completed && self.at < today) {
            if (selected.date == today) {
                result.push('old')
            }
            else {
                result.push('skipped')
            }
        }
        if (!(self.at < today && self.completed && selected.date == self.at)
            && (self.completed && !selected.completed)
            || (!self.completed && selected.completed)) {
            result.push('hidden')
        }

        classes = result.join(' ')
    })

    async function onComplete(e) {
        e.stopPropagation()
        
        self.completed = e.target.checked ? 1 : 0
        
        if (await Notification.requestPermission() == "granted") {
            let service_worker = await navigator.serviceWorker.ready
            if (self.completed) {
                service_worker.showNotification("Task Completed!", {
                    body: `Good job! You completed task '${tasks[self.task_id].title}'!!!`,
                    icon: "/icons/web-app-manifest-512x512.png",
                    tag: "task-status",
                })
            }
            else {
                service_worker.showNotification("Task Un-completed...", {
                    body: `Aww... You un-completed task '${tasks[self.task_id].title}'...`,
                    icon: "/icons/web-app-manifest-512x512.png",
                    tag: "task-status",
                })
            }
        }
        
        put(`item/${self.id}`).with(self)
        if (self.at != selected.date) {
            item_ids_by_date[selected.date]?.splice(item_ids_by_date[selected.date].indexOf(self.id), 1)
        }
        items[self.id] = self
    }

    function onOpen(e) {
        if (e.target.type !== "checkbox") {
            selected.item_id = self.id
        }
    }
</script>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<li class={classes} onclick={onOpen}>
    <input type="checkbox" checked={self.completed ? true : false} oninput={onComplete} />
    <p>{tasks[self.task_id].title}</p>
</li>
