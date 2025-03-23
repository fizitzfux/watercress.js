create table if not exists tasks(
  id integer primary key,
  title text not null
);

insert or replace into tasks(id,title) values(1, 'Get water');
insert or replace into tasks(id,title) values(2, 'Sleep for more than 5 hours');
insert or replace into tasks(id,title) values(3, 'Eat breakfast');


create table if not exists items(
  id integer primary key,
  task_id integer,
  completed integer not null default FALSE,
  at date not null default (date('now', 'start of day')),
  foreign key(task_id) references tasks(id) on delete cascade
);

insert or replace into items(id,task_id) values(1, 1);
insert or replace into items(id,task_id,completed,at) values(2, 2, FALSE, '2025-01-13');
insert or replace into items(id,task_id,completed) values(3, 3, TRUE);
insert or replace into items(id,task_id,completed) values(4, 1, TRUE);
