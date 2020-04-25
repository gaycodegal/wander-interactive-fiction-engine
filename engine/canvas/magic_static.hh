#include <iostream>
template <class T>
class MagicStatic {
 public:
  static T& Instance() {
    static T instance;
    return instance;
  }

 private:
  // Delete the copy and move constructors
  MagicStatic& operator=(const MagicStatic&) = delete;  // no self-assignments
  MagicStatic& operator=(MagicStatic&&) = delete;       // no move assignment
};
