PRAGMA foreign_keys = ON;

create table items(
name text primary key,
description text,
attributes text,
components text
);
create unique index item_names on items (name);
insert into items values("apple", "A delicious red apple.", "red,fruit", '{"item_type": "edible", "health": 5}');
insert into items values("posioned_apple", "A poisoned green apple.", "green,poisoned,fruit", '{"item_type": "edible", "health": -5}');
insert into items values("banana", "A phallic shapped fruit.", "yellow,fruit", '{"item_type": "edible", "health": 5, "erotic:" 1}');
insert into items values("firetruck", "A red toy truck.", "red,toy", '{"item_type": "gift"}');

create table locations(
name text primary key,
description text,
items text,
neighbors text,
characters text
);
create unique index location_names on locations (name);
insert into locations values(
"players_bedroom",
"A blue room, with a bed in the corner, and a lamp. The door is chained shut. There is a firetruck on the bed. Your dad is sitting on the bed next to the firetruck.",
"firetruck,apple",
'{"south": "hallway"}',
"dad");
insert into locations values(
"hallway",
"A white hallway. At the end is the door to your bedroom. On the other end is the kitchen.",
"banana",
'{"south": "players_bedroom", "north": "kitchen"}',
"mom,sister");

create table characters(
name text primary key,
components text
);
create unique index character_names on characters (name);
insert into characters values("dad", '');

create table dialogues(
character_name text,
flags text,
location text,
dialogue text,
primary key(character_name, flags, location),
foreign key(character_name) references characters(name),
foreign key(location) references locations(name)
);
create unique index dialogue_trees on dialogues (character_name, flags, location);
insert into dialogues values("dad", "in_trouble", "players_bedroom", '{"Give Firetruck": "Daddy here is the firetruck."}');


create table player(
name text primary key,
components text
);
