print("hi")
function read(file)
    local f = assert(io.open(file, "rb"))
    local content = f:read("*all")
    f:close()
    return content
end

rules = read("engine/cfg/test-lang-rules.txt")
print(rules)
