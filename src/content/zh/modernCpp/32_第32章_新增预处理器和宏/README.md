# 第32章 新增预处理器和宏（C++17 C++20）

# 32.1 预处理器__hasinclude

C++17标准为预处理器增加了一个新特性__hasinclude，用于判断某个头文件是否能够被包含进来，例如：

```cpp
if __hasinclude(<optional>) # include <optional> # define have_optional 1 #elif __hasinclude(<experimental/optional>) # include <experimental/optional> # define have_optional 1 # define experimental_optional 1 # else # define have_optional 0 #endif
```

如果 __has Include (<optional>) 中的头文件 optional 可以被包含进来，那么表达式求值为 1；否则求值为 0。请注意，__has Include 的实参必须和 #include 的实参具有同样的形式，否则会导致编译错误。另外，__has Include 并不关心头文件是否已经被包含进来。

