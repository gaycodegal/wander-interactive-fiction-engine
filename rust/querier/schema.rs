table! {
    todos (id) {
    id -> Integer,
    title -> Text,
    completed -> Bool,
    }
}

table! {
    items (name) {
    name -> Text,
    description -> Text,
    attributes -> Text,
    components -> Text,
    }
}

table! {
    locations (name) {
    name -> Text,
    description -> Text,
    items -> Text,
    neighbors -> Text,
    characters -> Text,
    }
}

table! {
    characters (name) {
    name -> Text,
    components -> Text,
    }
}

table! {
    dialogues (characters, flags, location) {
    characters -> Text,
    flags -> Text,
    location -> Text,
    dialogue -> Text,
    }
}

joinable!(dialogues -> characters (characters));
joinable!(dialogues -> locations (location));

allow_tables_to_appear_in_same_query!(characters, locations, dialogues);