import {Lang} from "wife/typescript/cfg/lang";

let x = new Lang();
x.init_words(`
an indefiniteArticle
a indefiniteArticle
the definiteArticle
eat verb
on prep
apple noun
table noun
is qVerb
does qVerb
edible type
exist type
red adjective
green adjective
clean adjective
blotchy adjective
dirty adjective
`);
x.init_rules(`
S: Verb NounClause | Verb NounClause PrepClause | QuestionVerb NounClause Type | QuestionVerb NounClause PrepClause Type
NounClause: Count ANoun | Adjective Noun | noun
PrepClause: Prep NounClause
ANoun: Adjective Noun | noun
QuestionVerb: qVerb
Adjective: adjective
Type: type
Prep: prep
Verb: verb
Noun: noun
Count: definiteArticle | indefiniteArticle | number
`);

console.log("result", x.parse_sentence("eat an clean apple on the green table"));
