#pragma once

template <typename T>
class MagicStatic {
 public:
  static T& Instance() {
    static T instance;
    return instance;
  }

 private:
  friend T;
  // Default Constructor/Deconstructor
  MagicStatic() = default;
  ~MagicStatic() = default;

  // Delete the copy and move constructors
  MagicStatic(const MagicStatic&) = delete;
  MagicStatic(const MagicStatic&&) = delete;
  MagicStatic& operator=(const MagicStatic&) = delete;
  MagicStatic& operator=(MagicStatic&&) = delete;
};
