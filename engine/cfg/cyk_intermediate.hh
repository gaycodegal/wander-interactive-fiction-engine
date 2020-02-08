#pragma once
#include <string>

struct Word {
  std::string word;
  std::string origin;
};

struct Derivation {
  std::string left_symbol;
  std::string right_symbol;
  size_t left_index;
  size_t right_index;
};

struct CYKIntermediate {
  enum Type { WORD, DERIVATION };
  Type type;
  union Value {
    Word word;
    Derivation derivation;
    Value() : word() {}
    ~Value() {}
  } value;

  CYKIntermediate(const CYKIntermediate& v) {
    type = v.type;
    switch (v.type) {
      case Type::WORD:
        value.word = v.value.word;
        break;
      case Type::DERIVATION:
        value.derivation = v.value.derivation;
        break;
    }
  }

  CYKIntermediate(Word word) {
    this->value.word = word;
    this->type = Type::WORD;
  }

  CYKIntermediate(Derivation derivation) {
    this->value.derivation = derivation;
    this->type = Type::DERIVATION;
  }
};
