#include <optional>
#include <vector>

template <typename T>
using Opt = std::optional<T>;
using None = std::nullopt_t;

using Str = std::string;

template <typename T>
using Vec = std::vector<T>;
