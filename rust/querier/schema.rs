table! {
    items (name) {
    name -> Text,
    description -> Nullable<Text>,
    attributes -> Nullable<Text>,
    components -> Nullable<Text>,
    }
}

table! {
    locations (name) {
    name -> Text,
    description -> Nullable<Text>,
    items -> Nullable<Text>,
    neighbors -> Nullable<Text>,
    characters -> Nullable<Text>,
    }
}

table! {
    characters (name) {
    name -> Text,
    components -> Nullable<Text>,
    }
}

table! {
    dialogues (id) {
    id -> Integer,
    characters -> Text,
    flags -> Nullable<Text>,
    location -> Text,
    dialogue -> Text,
    priority -> Integer,
    }
}

table! {
    nodes (id) {
    id -> Integer,
    data -> Text,
    }
}
