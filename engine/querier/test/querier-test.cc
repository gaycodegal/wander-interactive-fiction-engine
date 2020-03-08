#include "querier.hh"

#include <memory>

#include "gtest/gtest.h"

namespace {
/* models::Item common_item() {
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
  return models::Dialogue(0, "dad,mom,sister",
                          "apple_acquired,brother_dead"
                          "kitchen",
                          0,
                          "{\"story\":[],\"choices\": [{\"what\":\"What's for "
                          "dinner y'all?\",\"next\":4},{\"what\":\"How can I "
                          "help set up?\",\"next\":5}],\"visited\":false}");
}

models::Node common_node() {
  return models::Node(100,
                      "{\"story\":[{\"what\":\"Mama milk?\",\"who\": "
                      "\"dad\"},{\"what\":\"Really dad?\",\"who\": "
                      "\"sister\"}],\"choices\": null,\"visited\":false}");
} */

auto create_test_db(Str file) {
  auto querier = std::make_unique<Querier>(file);
  querier->dump_from_file("engine/querier/test_dump_json.json");
  return querier;
}

TEST(Querier, get_all_items) {
  auto querier = create_test_db("test_get_all_items.db");
  auto items = querier->query_items({}, {}, {});
  EXPECT_EQ(items.size(), 5);
}

TEST(Querier, insert_item) {
  auto querier = create_test_db("test_insert_item.db");
  auto item = models::Item("Test_Item_Insert", "Test item for insert testing.",
                           "test,debug,insert", "{'test': 'test'}");

  querier->insert_item(item);
  auto got_item = querier->get_item("Test_Item_Insert");
  EXPECT_EQ(item, got_item);
}

}  // namespace