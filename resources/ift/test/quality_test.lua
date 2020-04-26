require("ift/sentence")

redApple = Item.new("apple", {"red"}, {"eat"}, nil)
greenApple = Item.new("apple", {"green"}, nil, nil)
theTable = Item.new("table", {"brown"}, nil, {redApple})
world = Item.new(nil, nil, nil, {greenApple, theTable})

subject = {
   distinct = true,
   noun = "apple",
   adjective = nil,
}
preposition = nil
quality = {
   adjective = "red"
}

sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == false, "is the apple red? (want: false due to green apple)")

subject.distinct = false
sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == true, "is an apple red? (want: true)")

quality = {
   component = "eat"
}

sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == true, "is an apple eat-able? (want: true)")

subject.adjective = "green"
sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == false, "is a green apple eat-able? (want: false)")

subject.adjective = "red"
sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == true, "is a red apple eat-able? (want: true)")

preposition = {
   prep = "on",
   subject = {
      distinct = true,
      noun = "table",
      adjective = nil,
   },
}
sentence = QualitySentence.new("is", subject, preposition, quality)
assert(sentence:eval(world) == true, "is a red apple on the table eat-able? (want: true)")
