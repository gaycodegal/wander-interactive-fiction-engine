#include "querier.hh"

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
}

}  // namespace