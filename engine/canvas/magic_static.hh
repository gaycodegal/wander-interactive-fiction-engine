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
  
  // Delete the copy and move constructors
  MagicStatic() = default;
  ~MagicStatic() = default;
  MagicStatic(const MagicStatic&) = delete;
  MagicStatic(const MagicStatic&&) = delete;
  MagicStatic& operator=(const MagicStatic&) = delete;
  MagicStatic& operator=(MagicStatic&&) = delete;
};
