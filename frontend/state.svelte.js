// This file stores all base states in the application
// except for new items this allows full offline functionality
// and high responsiveness as it's all local

export const today = new Date().toISOString().substring(0, 10)

export const selected = $state(JSON.parse(window.localStorage?.getItem("selected")) || {
    /** @type {number | null} */
    item_id: null,
    /** @type {Date} */
    date: today,
    completed: false,
})

/** @type {{id: number, task: {title: string}}} */
export const tasks = $state(JSON.parse(window.localStorage?.getItem("tasks")) || {})

/** @type {{id: number, task: {at: string, task_id: number, completed: boolean}}} */
export const items = $state(JSON.parse(window.localStorage?.getItem("items")) || {})
/** @type {{date: string, item_ids: number[]}} */
export const item_ids_by_date = $state(JSON.parse(window.localStorage?.getItem("item_ids_by_date")) || {})
