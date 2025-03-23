"use strict";

import {default as Express} from 'express';
import * as HTTP from 'http';
import * as Vite from 'vite';
import fs from 'fs';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import Database from 'better-sqlite3';
import pkg from '../package.json' with { type: 'json' };

// Database
const db = new Database('backend/sqlite3.db');
db.exec(fs.readFileSync('backend/schema.sql').toString())

// Database queries
const query = {
	get_items_for_past_date: db.prepare(`
		select id from items
		where at=:date
	`),
	get_items_for_today: db.prepare(`
		select id from items
		where at=:date
		or id in (
			select id from items
			where at<:date
			and completed=0
		)
	`),
	get_items_for_future_date: db.prepare(`
		select id from items
		where at=:date
	`),
	update_item: db.prepare(`
		update items
		set completed=:completed,
		at=:at,
		task_id=:task_id
		where id=:id
	`),
	get_item_by_id: db.prepare(`
		select * from items
		where id=:id
	`),
	insert_new_item: db.prepare(`
		insert into
		items ( task_id, at)
		values(:task_id,:at)
	`),
	delete_item: db.prepare(`
		delete from items
		where id=:id
	`),
	get_task_by_id: db.prepare(`
		select * from tasks
		where id=:id
	`),
	get_all_tasks: db.prepare(`
		select * from tasks
	`),
	insert_new_task: db.prepare(`
		insert into
		tasks( title)
		values(:title)
	`),
}

// SSE abstraction
class Subscriber {
	/** @type {Set<(item: any) => undefined>} */
	listeners = new Set()

	push(event_type, item) {
		this.listeners.forEach((listener) => listener(event_type, item))
	}
}
const subscriber = new Subscriber()


// Express app
const app = Express();
app.use(Express.json());
const httpServer = HTTP.createServer();
httpServer.on('request', app);

// Allow resetting database for tests
if (process.env.TESTING) {
	app.get('/reset_database', (req, res) => {
		db.unsafeMode(true)
		db.exec(`
			PRAGMA writable_schema = 1;
			delete from sqlite_master where type in ('table', 'index', 'trigger');
			PRAGMA writable_schema = 0;
			VACUUM;
			PRAGMA INTEGRITY_CHECK;
		`)
		db.unsafeMode(false)
		db.exec(fs.readFileSync('backend/schema.sql').toString())
		res.json({})
	})
}


app.get('/api/', (req, res) => {
	res.json({name: pkg.name, version: pkg.version})
})

app.get('/api/item/subscribe', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		Connection: 'keep-alive',
		'Cache-Control': 'no-cache',
	})

	let counter = 0
    
    // Send a message on connection
    res.write('event: connected\n')
    res.write(`data: null\n`)
    res.write(`id: ${counter}\n\n`)
    counter += 1

	const listener = (event_type, item) => {
		res.write(`event: item_${event_type}\n`)
		res.write(`data: ${JSON.stringify(item)}\n`)
		res.write(`id: ${counter}\n\n`)
		counter += 1
	}
	subscriber.listeners.add(listener)
    
    // Close the connection when the client disconnects
    req.on('close', () => {
		subscriber.listeners.delete(listener)
		res.end('OK')
	})
})

// Items
app.get('/api/item/ids/:year/:month/:day', (req, res) => {
	const {year, month, day} = req.params
	const date = `${year}-${month}-${day}`
	const today = new Date().toISOString().substring(0, 10)

	let items = null
	if (date > today)
		items = query.get_items_for_future_date.all({date})
	else if (date < today)
		items = query.get_items_for_past_date.all({date})
	else
		items = query.get_items_for_today.all({date})

	res.json({item_ids: items.map(i => i.id)})
})
app.get('/api/item/:id', (req, res) => {
	const { id } = req.params
	const item = query.get_item_by_id.get({id})
	res.status(item? 200: 404).json({item})
})
app.put('/api/item/:id', (req, res) => {
	const { id } = req.params
	const data = req.body
	const item = {...data, id}
	query.update_item.run(item)
	subscriber.push('update', item)
	res.status(204).end()
})
app.post('/api/item', (req, res) => {
	const item = req.body
	const info = query.insert_new_item.run(item)
	subscriber.push('add', item)
	res.status(201).json({id: info.lastInsertRowid})
})
app.delete('/api/item/:id', (req, res) => {
	const { id } = req.params
	query.delete_item.run({id})
	subscriber.push('delete', {id})
	res.status(204).end()
})

// Tasks
app.get('/api/task/:id', (req, res) => {
	const { id } = req.params
	const task = query.get_task_by_id.get({id})
	res.status(task? 200: 404).json({task})
})
app.get('/api/task', (req, res) => {
	const tasks = query.get_all_tasks.all()
	res.json({tasks})
})
app.post('/api/task', (req, res) => {
	const { title } = req.body
	const info = query.insert_new_task.run({title})
	res.status(201).json({id: info.lastInsertRowid})
})


// Vite
app.use((await Vite.createServer({
	root: 'frontend/',
	logLevel: 'info',
	server: {
		middlewareMode: true,
		hmr: {server: httpServer}
	},
	plugins: [
		svelte(),
	],
	appType: 'spa',
})).middlewares);

// Start the server
const host = process.env.HOST || '0.0.0.0';
const port = (0|process.env.PORT) || 3000;
httpServer.listen(port, host, () => {
	console.log(`Running at http://${host}:${port}`);
});
