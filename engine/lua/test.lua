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
sentence = "eat a clean apple"
end_states = {"ActionSentence", "QuestionSentence"}
print("Rules:\n")
print(rules)
print([[accepted derivations: {"ActionSentence", "QuestionSentence"}]])
print("\nparsing", sentence)
ast = lang:parse_sentence(sentence, end_states)
assert(ast, "invalid sentence")
print("sentence parse-type:", ast.end_state_name)
print("\nDerivation:")
print(ast.ast)

--print(AST.WORD)
--print(ast.ast.value.rule[1].value.tagged.ast.value.word.origin)
