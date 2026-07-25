# 测试代码风格规范（Test Conventions）

> 仅作用于测试源集（`src/test/`、`src/*Test/`、`__tests__/`、`*_test.go`、`tests/`、`test/` 等各语言约定的测试目录）。按项目实际使用的主语言适用对应小节；多语言仓库按各模块语言分别套用。与 `testing-and-quality.md`（验证门与质量底线）互补：那份讲"何时测、测什么、过不过"，本份讲"测试代码本身怎么写"。

## 1. 跨语言通用规范（强制）

### 1.1 测试标识符必须用英文，可 grep

- 测试方法 / 函数 / 用例名使用 **英文 lowerCamelCase** 或各语言约定的大小写风格，语义清晰、可被 `grep` / `rg` 直接定位。
- 禁止用中文、拼音、数字编号（`test1` / `test_场景_1`）作标识符。
- 禁止用 Kotlin 反引号包裹的中文方法名（`` fun `中文方法名`() ``）、JS 的中文函数名、Python 的中文函数名等任何把中文塞进标识符的写法。
- 标识符应表达"被测行为 + 期望"，如 `fieldTypeListOfStringDisplayName`、`varintEncodesBoundaryValues`、`testParseEmptyReturnsError`。

### 1.2 中文语义描述必须存在

- 每个测试用例必须有**简体中文**的语义描述，说明"被测行为 + 期望结果"，不得只留英文标识符。
- 中文描述通过各语言机制承载：注解（`@DisplayName`）、描述块（`describe`/`it` 文案）、子测试名（`t.Run` 名）、docstring（pytest）等，具体见各语言小节。
- 禁止用英文描述代替中文，禁止省略描述只留标识符。

### 1.3 断言失败消息与注释使用中文

- 断言失败消息（如 `assertEquals(expected, actual, "...")
` 第三参数、`expect(a, "...")
`、`Errorf("...")
`、`pytest.fail("...")
`）使用简体中文。
- 测试内部注释沿用仓库全局规范：仅中文注释，禁止英文注释（参见 `comments.md`）。

### 1.4 组织与命名

- 测试类 / 套件命名沿用被测对象 + `Test` 后缀（或各语言约定后缀），保持英文 UpperCamelCase（例 `PacketBuilderTest`、`PacketBuilderSpec`、`TestPacketBuilder`）。
- 用嵌套分组（`@Nested` / `describe` / `t.Run` / `TestClass`）按"被测对象的某个行为面"组织，分组描述使用中文。
- 参数化测试的用例名模板使用中文（如 `[index] 输入 {0} 应编码为 {1}`），方法名保持英文。

### 1.5 提交前自查清单

- [ ] 每个测试用例标识符是英文，可 grep 定位
- [ ] 每个测试用例带中文语义描述
- [ ] 嵌套分组有中文描述
- [ ] 断言失败消息、测试内注释均为中文
- [ ] 不依赖搜索 `@DisplayName` / `describe` 文案来定位用例

## 2. Kotlin + Java（JUnit 5）

### 2.1 方法名英文 lowerCamelCase

```kotlin
@Test
@DisplayName("List<String> 字段类型的 displayName 应为 List<String>")
fun fieldTypeListOfStringDisplayName() {
    val t = FieldType.LIST(FieldType.STRING)
    assertEquals("List<String>", t.displayName)
}
```

❌ 错误：方法名用中文

```kotlin
@Test
fun `List String 字段类型的 displayName 应为 List String`() { ... }
```

❌ 错误：缺少 `@DisplayName`

```kotlin
@Test
fun fieldTypeListOfStringDisplayName() { ... }
```

❌ 错误：`@DisplayName` 用英文

```kotlin
@Test
@DisplayName("FieldType.LIST displayName should be List<String>")
fun fieldTypeListOfStringDisplayName() { ... }
```

### 2.2 `@Nested` 分组与 `@ParameterizedTest`

```kotlin
@Nested
@DisplayName("枚举字段解码的边界情况")
inner class EnumDecodeEdge { ... }

@ParameterizedTest(name = "[{index}] 输入 {0} 应编码为 {1}")
@MethodSource("varintCases")
@DisplayName("VarInt 编码覆盖典型边界值")
fun varintEncodesBoundaryValues(input: Int, expected: ByteArray) { ... }
```

### 2.3 类级 `@DisplayName`

测试类本身不强制 `@DisplayName`，但如需补充上下文则使用中文。

## 3. TypeScript / JavaScript（Jest / Vitest 风格）

### 3.1 用 `describe` / `it` / `test` 承载中文描述

- 测试函数名用英文 lowerCamelCase（如 `fieldTypeListOfStringDisplayName`），或直接用 `it`/`test` 的中文文案承载语义——二者至少其一为英文标识符 + 中文描述文案。
- `describe` / `it` / `test` 的描述字符串使用简体中文。

```typescript
describe('FieldType', () => {
  describe('displayName', () => {
    it('List<String> 字段类型的 displayName 应为 List<String>', () => {
      const t = FieldType.list(FieldType.string)
      expect(t.displayName).toBe('List<String>')
    })
  })
})
```

### 3.2 参数化与失败消息

```typescript
it.each([
  [0, [0x00]],
  [127, [0x7f]],
  [128, [0x80, 0x01]],
])('输入 %i 应编码为 %p', (input, expected) => {
  expect(encodeVarint(input)).toEqual(expected)
})

expect(t.displayName, 'List<String> 类型的 displayName 应为 List<String>').toBe('List<String>')
```

### 3.3 文件命名

测试文件沿用 `*.test.ts` / `*.spec.ts` 约定，保持英文。

## 4. Go（`testing` 包）

### 4.1 顶层 `TestXxx` + `t.Run` 子测试中文描述

- 顶层函数名遵循 Go 约定 `TestXxx`（英文 UpperCamelCase，`Xxx` 表被测对象）。
- 子测试用 `t.Run` 的中文名承载语义描述。

```go
func TestFieldType(t *testing.T) {
    t.Run("List<String> 字段类型的 displayName 应为 List<String>", func(t *testing.T) {
        ft := FieldTypeList(FieldTypeString)
        if got := ft.DisplayName(); got != "List<String>" {
            t.Errorf("DisplayName() = %q, 期望 List<String>", got)
        }
    })

    t.Run("枚举字段解码的边界情况", func(t *testing.T) {
        // 子用例 ...
    })
}
```

### 4.2 表驱动测试

表驱动的用例名 `name` 字段使用中文描述，函数名保持英文。

```go
func TestVarintEncode(t *testing.T) {
    cases := []struct {
        name     string
        input    int
        expected []byte
    }{
        {"输入 0 应编码为 [0x00]", 0, []byte{0x00}},
        {"输入 127 应编码为 [0x7f]", 127, []byte{0x7f}},
    }
    for _, c := range cases {
        t.Run(c.name, func(t *testing.T) {
            if got := EncodeVarint(c.input); !bytes.Equal(got, c.expected) {
                t.Errorf("EncodeVarint(%d) = %v, 期望 %v", c.input, got, c.expected)
            }
        })
    }
}
```

### 4.3 文件命名

测试文件 `*_test.go`，与被测文件同包，保持英文。

## 5. Python（pytest）

### 5.1 函数名英文 snake_case + docstring 中文描述

- 测试函数名 `test_xxx`（英文 snake_case），语义清晰可 grep。
- 用 docstring 承载简体中文语义描述（"被测行为 + 期望结果"）。

```python
def test_field_type_list_of_string_display_name():
    """List<String> 字段类型的 displayName 应为 List<String>"""
    t = FieldType.list(FieldType.string)
    assert t.display_name == "List<String>"
```

❌ 错误：函数名用中文

```python
def test_字段类型_display_name():
    ...
```

❌ 错误：缺中文描述

```python
def test_field_type_list_of_string_display_name():
    assert t.display_name == "List<String>"
```

### 5.2 参数化与类分组

```python
@pytest.mark.parametrize(
    "input,expected",
    [(0, b"\x00"), (127, b"\x7f"), (128, b"\x80\x01")],
    ids=["输入 0 应编码为 0x00", "输入 127 应编码为 0x7f", "输入 128 应编码为 0x80 0x01"],
)
def test_varint_encodes_boundary_values(input, expected):
    """VarInt 编码覆盖典型边界值"""
    assert encode_varint(input) == expected


class TestEnumDecodeEdge:
    """枚举字段解码的边界情况"""

    def test_empty_input_returns_error(self):
        """空输入应返回解码错误"""
        ...
```

### 5.3 文件命名

测试文件 `test_*.py` / `*_test.py`，保持英文。
