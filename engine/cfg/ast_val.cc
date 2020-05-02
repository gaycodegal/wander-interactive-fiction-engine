#include "ast_val.hh"

namespace AST {

std::ostream& operator<<(std::ostream& os, const AST& self) {
  switch (self.type) {
    case AST::Type::WORD:
      os << "(WORD " << self.value.word.word << ", " << self.value.word.origin
         << ')';
      break;
    case AST::Type::TAGGED:
      os << "(TAGGED " << self.value.tagged.symbol << ", "
         << *(self.value.tagged.ast) << ')';
      break;
    case AST::Type::RULE:
      os << "\n(RULE\n";
      for (const auto& ast : self.value.rule) {
        os << *ast << "\n";
      }
      os << ")";
      break;
  }
  return os;
}

}  // namespace AST
