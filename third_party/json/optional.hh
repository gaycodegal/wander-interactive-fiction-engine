#include <optional>

#include "json_third_party.hh"

namespace nlohmann {
template <typename T>
struct adl_serializer<std::optional<T>> {
  static void to_json(json& j, const std::optional<T>& opt) {
    if (!opt) {
      j = {};
    } else {
      j = opt.value();
    }
  }

  static void from_json(const json& j, std::optional<T>& opt) {
    if (j.is_null()) {
      opt = {};
    } else {
      opt = j.get<T>();
    }
  }
};
}  // namespace nlohmann