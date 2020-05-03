#pragma once

#include <iostream>
#include <sstream>
#include <string>

#include "types.hh"

namespace AST {

struct Word {
  Str word;
  Str origin;
};

struct Tagged {
  Str symbol;
  struct AST* ast;
};

struct AST {
  enum Type { WORD, TAGGED, RULE };
  Type type;
  union Value {
    Word word;
    Tagged tagged;
    Vec<struct AST*> rule;
    Value() : word() {}
    ~Value() {}
  } value;

  ~AST() {
    switch (type) {
      case Type::WORD:
        break;
      case Type::TAGGED:
        delete value.tagged.ast;
        break;
      case Type::RULE:
        for (const auto& ast : value.rule) {
          delete ast;
        }
        break;
    }
  }

  AST(const AST& v) {
    type = v.type;
    switch (v.type) {
      case Type::WORD:
        value.word = v.value.word;
        break;
      case Type::TAGGED:
        value.tagged.symbol = v.value.tagged.symbol;
        // copy construct the value recursively
        value.tagged.ast = new AST(*v.value.tagged.ast);
        break;
      case Type::RULE:
        for (const auto& ast : v.value.rule) {
          value.rule.push_back(new AST(*ast));
        }
        break;
    }
  }

  AST(Word word) {
    this->value.word = word;
    this->type = Type::WORD;
  }

  AST(Tagged tagged) {
    this->value.tagged = tagged;
    this->type = Type::TAGGED;
  }

  AST(Vec<AST*> rule) {
    this->value.rule = rule;
    this->type = Type::RULE;
  }

  Vec<AST*> deleteAndClaimRule() {
    Vec<AST*> rule = value.rule;
    type = Type::WORD;
    delete this;
    return rule;
  }

  Str toString() {
    std::ostringstream ss;
    ss << *this;
    return ss.str();
  }

  friend std::ostream& operator<<(std::ostream& os, const AST& self);
};
}  // namespace AST
