#include "querier.hh"

#include <cstdio>
#include <iostream>
#include <memory>

#include "gtest/gtest.h"

namespace {
models::Item common_item() {
  return models::Item("Test_Item", "Test item for testing.", "test,debug,?",
                      "{'test': 'test'}");
}

models::Location common_location() {
  return models::Location(
      "Test_Location", "Test location for testing.",
      "{ \"south\": \"Test_South\", \"north\": \"Test_North\" }",
      "Test_Character", "Test_Item");
}

models::Character common_character() {
  return models::Character("Test_Character", "{ \"interactable\": true }");
}

models::Dialogue common_dialogue() {
  return models::Dialogue(6, "dad,mom,sister", "apple_acquired,brother_dead",
                          "kitchen", 0,
                          "{\"story\":[],\"choices\": [{\"what\":\"What's for "
                          "dinner y'all?\",\"next\":4},{\"what\":\"How can I "
                          "help set up?\",\"next\":5}],\"visited\":false}");
}

models::Node common_node() {
  return models::Node(6,
                      "{\"story\":[{\"what\":\"Mama milk?\",\"who\": "
                      "\"dad\"},{\"what\":\"Really dad?\",\"who\": "
                      "\"sister\"}],\"choices\": null,\"visited\":false}");
}

auto create_test_db(Str file) {
  auto querier = std::make_unique<Querier>(file);
  querier->dump_from_file("engine/querier/test_dump_json.json");
  return querier;
}

TEST(Querier, get_all_items) {
  auto querier = create_test_db("test_get_all_items.db");
  auto items = querier->query_items({}, {}, {});
  EXPECT_EQ(items.size(), 5);

  remove("test_get_all_items.db");
}

TEST(Querier, insert_and_get_item) {
  auto querier = create_test_db("test_insert_and_get_item.db");
  auto item = models::Item("Test_Item_Insert", "Test item for insert testing.",
                           "test,debug,insert", "{'test': 'test'}");

  querier->insert_item(item);
  auto got_item = querier->get_item("Test_Item_Insert");
  EXPECT_EQ(item, got_item);

  remove("test_insert_and_get_item.db");
}

TEST(Querier, insert_items) {
  auto querier = create_test_db("test_insert_items.db");
  Vec<models::Item> items;

  items.push_back(models::Item("Test_Item_Insert_1",
                               "Test item for insert testing.",
                               "test,debug,insert", "{'test': 'test'}"));
  items.push_back(models::Item("Test_Item_Insert_2",
                               "Test item for insert testing.",
                               "test,debug,insert", "{'test': 'test'}"));

  querier->insert_items(items);
  auto got_items = querier->query_items("Test_Item_Insert", {}, {});
  EXPECT_EQ(items.size(), got_items.size());
  EXPECT_EQ(items[0], got_items[0]);
  EXPECT_EQ(items[1], got_items[1]);

  remove("test_insert_items.db");
}

TEST(Querier, insert_existing_item) {
  auto querier = create_test_db("test_insert_existing_item.db");

  try {
    querier->insert_item(common_item());
  } catch (const std::system_error &err) {
    ASSERT_STREQ("UNIQUE constraint failed: item.name: constraint failed",
                 err.what());
  }

  remove("test_insert_existing_item.db");
}

TEST(Querier, get_non_existant_item) {
  auto querier = create_test_db("get_nonexistant_item.db");

  try {
    querier->get_item("Fake_Item");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("get_nonexistant_item.db");
}

TEST(Querier, remove_item) {
  auto querier = create_test_db("remove_item.db");

  querier->remove_item("Test_Item");

  try {
    querier->get_item("Test_Item");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("remove_item.db");
}

TEST(Querier, simple_update_item) {
  auto querier = create_test_db("simple_update_item.db");

  auto item = common_item();
  item.description = "updated description.";
  querier->update_item(item);

  auto got_item = querier->get_item(item.name);
  EXPECT_EQ(item, got_item);

  remove("simple_update_item.db");
}

TEST(Querier, complex_update_item) {
  auto querier = create_test_db("complex_update_item.db");

  auto item = common_item();
  item.description = "updated description.";
  item.attributes = "update,test";
  item.components = "{\"updated\": true}";
  querier->update_item(item);

  auto got_item = querier->get_item(item.name);
  EXPECT_EQ(item, got_item);

  remove("complex_update_item.db");
}

TEST(Querier, get_all_locations) {
  auto querier = create_test_db("test_get_all_locations.db");
  auto locations = querier->query_locations({}, {}, {});
  EXPECT_EQ(locations.size(), 5);

  remove("test_get_all_locations.db");
}

TEST(Querier, insert_and_get_location) {
  auto querier = create_test_db("test_insert_and_get_location.db");
  auto location = models::Location("Test_Location_Insert",
                                   "Test location for insert testing.", "????",
                                   "vitae", "umbra");

  querier->insert_location(location);
  auto got_location = querier->get_location("Test_Location_Insert");
  EXPECT_EQ(location, got_location);

  remove("test_insert_and_get_location.db");
}

/* TEST(Querier, insert_locations) {
  auto querier = create_test_db("test_insert_locations.db");
  Vec<models::location> locations;

  locations.push_back(models::Location("Test_location_Insert_1",
                               "Test location for insert testing.",
                               "random",
                               "vitae",
                               "umbra"));
  locations.push_back(models::Location("Test_location_Insert_2",
                               "Test location for insert testing.",
                                "random",
                               "vitae",
                               "umbra"));

  querier->insert_locations(locations);
  auto got_locations = querier->query_locations("Test_location_Insert", {}, {});
  EXPECT_EQ(locations.size(), got_locations.size());
  EXPECT_EQ(locations[0], got_locations[0]);
  EXPECT_EQ(locations[1], got_locations[1]);

  remove("test_insert_locations.db");
} */

TEST(Querier, insert_existing_location) {
  auto querier = create_test_db("test_insert_existing_location.db");

  try {
    querier->insert_location(common_location());
  } catch (const std::system_error &err) {
    ASSERT_STREQ("UNIQUE constraint failed: location.name: constraint failed",
                 err.what());
  }

  remove("test_insert_existing_location.db");
}

TEST(Querier, get_non_existant_location) {
  auto querier = create_test_db("get_nonexistant_location.db");

  try {
    querier->get_location("Fake_Location");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("get_nonexistant_location.db");
}

TEST(Querier, remove_location) {
  auto querier = create_test_db("remove_location.db");

  querier->remove_location("Test_Location");

  try {
    querier->get_location("Test_Location");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("remove_location.db");
}

TEST(Querier, simple_update_location) {
  auto querier = create_test_db("simple_update_location.db");

  auto location = common_location();
  location.description = "updated description.";
  querier->update_location(location);

  auto got_location = querier->get_location(location.name);
  EXPECT_EQ(location, got_location);

  remove("simple_update_location.db");
}

TEST(Querier, complex_update_location) {
  auto querier = create_test_db("complex_update_location.db");

  auto location = common_location();
  location.description = "updated description.";
  location.setItems("apple_toml");
  location.neighbors = "{\"updated\": true}";
  location.characters = "dad";
  querier->update_location(location);

  auto got_location = querier->get_location(location.name);
  EXPECT_EQ(location, got_location);

  remove("complex_update_location.db");
}

TEST(Querier, get_all_characters) {
  auto querier = create_test_db("test_get_all_characters.db");
  auto characters = querier->query_characters({}, {});
  EXPECT_EQ(characters.size(), 4);

  remove("test_get_all_characters.db");
}

TEST(Querier, insert_and_get_character) {
  auto querier = create_test_db("test_insert_and_get_character.db");
  auto character =
      models::Character("Test_Character_Insert", "{ \"interactable\": true }");

  querier->insert_character(character);
  auto got_character = querier->get_character("Test_Character_Insert");
  EXPECT_EQ(character, got_character);

  remove("test_insert_and_get_character.db");
}

/* TEST(Querier, insert_characters) {
  auto querier = create_test_db("test_insert_characters.db");
  Vec<models::Character> characters;

  characters.push_back(models::Character("Test_Character_Insert_1",
                               "{ \"interactable\": true }"));
  characters.push_back(models::Character("Test_Character_Insert_2",
                               "{ \"interactable\": true }"));

  querier->insert_characters(characters);
  auto got_characters = querier->query_characters("Test_Character_Insert", {},
{}); EXPECT_EQ(characters.size(), got_characters.size());
  EXPECT_EQ(characters[0], got_characters[0]);
  EXPECT_EQ(characters[1], got_characters[1]);

  remove("test_insert_characters.db");
} */

TEST(Querier, insert_existing_character) {
  auto querier = create_test_db("test_insert_existing_character.db");

  try {
    querier->insert_character(common_character());
  } catch (const std::system_error &err) {
    ASSERT_STREQ("UNIQUE constraint failed: character.name: constraint failed",
                 err.what());
  }

  remove("test_insert_existing_character.db");
}

TEST(Querier, get_non_existant_character) {
  auto querier = create_test_db("get_nonexistant_character.db");

  try {
    querier->get_character("Fake_Character");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("get_nonexistant_character.db");
}

TEST(Querier, remove_character) {
  auto querier = create_test_db("remove_character.db");

  querier->remove_character("Test_Character");

  try {
    querier->get_character("Test_Character");
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("remove_character.db");
}

TEST(Querier, simple_update_character) {
  auto querier = create_test_db("simple_update_character.db");

  auto character = common_character();
  character.components = "{\"updated\": true}";
  querier->update_character(character);

  auto got_character = querier->get_character(character.name);
  EXPECT_EQ(character, got_character);

  remove("simple_update_character.db");
}

TEST(Querier, get_all_dialogues) {
  auto querier = create_test_db("test_get_all_dialogues.db");

  auto dialogues = querier->query_dialogues({}, {}, {}, {});
  EXPECT_EQ(dialogues.size(), 6);

  remove("test_get_all_dialogues.db");
}

TEST(Querier, insert_and_get_dialogue) {
  auto querier = create_test_db("test_insert_and_get_dialogue.db");
  auto dialogue =
      models::Dialogue(-1, "dad,fairy,blob", {}, "backyard", 1,
                       "{\"story\":[{\"who\": \"Blob\", \"what\": \"Hello! I "
                       "am Blob.\"}],\"choices\": null,\"visited\":false}");

  int id = querier->insert_dialogue(dialogue);
  dialogue.id = id;

  auto got_dialogue = querier->get_dialogue(7);
  EXPECT_EQ(dialogue, got_dialogue);

  remove("test_insert_and_get_dialogue.db");
}

/* TEST(Querier, insert_dialogues) {
  auto querier = create_test_db("test_insert_dialogues.db");
  Vec<models::Dialogue> dialogues;

  dialogues.push_back(models::Dialogue(50, "dad,fairy,blob", {}, "backyard", 1,
"Hello! I am Blob.")); dialogues.push_back((models::Dialogue(51,
"sister,mom,blob", {}, "living_room", 1, "{\"story\":[{\"who\": \"Blob\",
\"what\": \"Pew pew pew!\"}],\"choices\": null,\"visited\":false}"));

  querier->insert_dialogues(dialogues);
  auto got_dialogues = querier->query_dialogues("Test_Dialogue_Insert", {}, {});
  EXPECT_EQ(dialogues.size(), got_dialogues.size());
  EXPECT_EQ(dialogues[0], got_dialogues[0]);
  EXPECT_EQ(dialogues[1], got_dialogues[1]);

  remove("test_insert_dialogues.db");
} */

TEST(Querier, insert_existing_dialogue) {
  auto querier = create_test_db("test_insert_existing_dialogue.db");

  try {
    querier->insert_dialogue(common_dialogue());
  } catch (const std::system_error &err) {
    ASSERT_STREQ("UNIQUE constraint failed: dialogue.id: constraint failed",
                 err.what());
  }

  remove("test_insert_existing_dialogue.db");
}

TEST(Querier, get_non_existant_dialogue) {
  auto querier = create_test_db("get_nonexistant_dialogue.db");

  try {
    querier->get_dialogue(867);
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("get_nonexistant_dialogue.db");
}

TEST(Querier, remove_dialogue) {
  auto querier = create_test_db("remove_dialogue.db");

  querier->remove_dialogue(100);

  try {
    querier->get_dialogue(100);
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("remove_dialogue.db");
}

TEST(Querier, simple_update_dialogue) {
  auto querier = create_test_db("simple_update_dialogue.db");

  auto dialogue = common_dialogue();
  dialogue.setDialogue("updated dialogue.");
  querier->update_dialogue(dialogue);

  auto got_dialogue = querier->get_dialogue(6);
  EXPECT_EQ(dialogue, got_dialogue);

  remove("simple_update_dialogue.db");
}

TEST(Querier, complex_update_dialogue) {
  remove("complex_update_dialogue.db");
  auto querier = create_test_db("complex_update_dialogue.db");

  auto dialogue = common_dialogue();
  dialogue.setDialogue(
      "{\"story\":[{\"who\": \"mario\", \"what\": \"Mama Mia\"}],\"choices\": "
      "null,\"visited\":false}");
  dialogue.characters = "mario";
  dialogue.flags = "hw";
  dialogue.flags = "Test_Location";
  querier->update_dialogue(dialogue);

  auto got_dialogue = querier->get_dialogue(6);
  EXPECT_EQ(dialogue, got_dialogue);

  remove("complex_update_dialogue.db");
}

TEST(Querier, insert_and_get_node) {
  auto querier = create_test_db("test_insert_and_get_node.db");
  auto node = models::Node(-1, "Test_Node_Insert");

  int id = querier->insert_node(node);
  node.id = id;

  auto got_node = querier->get_node(id);
  EXPECT_EQ(node, got_node);

  remove("test_insert_and_get_node.db");
}

/* TEST(Querier, insert_nodes) {
  auto querier = create_test_db("test_insert_nodes.db");
  Vec<models::Node> nodes;

  nodes.push_back(models::Node(50, "dad,fairy,blob", {}, "backyard", 1, "Hello!
I am Blob.")); nodes.push_back((models::Node(51, "sister,mom,blob", {},
"living_room", 1, "{\"story\":[{\"who\": \"Blob\", \"what\": \"Pew pew
pew!\"}],\"choices\": null,\"visited\":false}"));

  querier->insert_nodes(nodes);
  auto got_nodes = querier->query_nodes("Test_Node_Insert", {}, {});
  EXPECT_EQ(nodes.size(), got_nodes.size());
  EXPECT_EQ(nodes[0], got_nodes[0]);
  EXPECT_EQ(nodes[1], got_nodes[1]);

  remove("test_insert_nodes.db");
} */

TEST(Querier, insert_existing_node) {
  auto querier = create_test_db("test_insert_existing_node.db");

  try {
    querier->insert_node(common_node());
  } catch (const std::system_error &err) {
    ASSERT_STREQ("UNIQUE constraint failed: node.id: constraint failed",
                 err.what());
  }

  remove("test_insert_existing_node.db");
}

TEST(Querier, get_non_existant_node) {
  auto querier = create_test_db("get_nonexistant_node.db");

  try {
    querier->get_node(867);
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("get_nonexistant_node.db");
}

TEST(Querier, remove_node) {
  auto querier = create_test_db("remove_node.db");

  querier->remove_node(1);

  try {
    querier->get_node(1);
  } catch (const std::system_error &err) {
    ASSERT_STREQ("Not found", err.what());
  }

  remove("remove_node.db");
}

TEST(Querier, simple_update_node) {
  auto querier = create_test_db("simple_update_node.db");

  auto node = common_node();
  node.setDialogue("updated node.");
  querier->update_node(node);

  auto got_node = querier->get_node(6);
  EXPECT_EQ(node, got_node);

  remove("simple_update_node.db");
}

}  // namespace