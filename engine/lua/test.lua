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
sentence = "eat a clean apple"
print(lang:parse_sentence(sentence))
