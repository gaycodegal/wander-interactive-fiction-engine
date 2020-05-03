print("hi")
function read(file)
    local f = assert(io.open(file, "rb"))
    local content = f:read("*all")
    f:close()
    return content
end

rules = read("engine/cfg/test-lang-rules.txt")
words = read("engine/cfg/test-lang-words.txt")
lang = Lang.new()
lang:init_rules(rules)
lang:init_words(words)
print(lang)
sentence = "is the apple clean"
ast = lang:parse_sentence(sentence)
assert(ast, "invalid sentence")
print(ast)

print(AST.WORD)
print(ast.value.rule[1].value.tagged.ast.value.word.origin)
