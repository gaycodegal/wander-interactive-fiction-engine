use std::fs;
use ast::AST;
use std::collections::HashMap;
use std::iter;

pub struct Lang {
    terminals: HashMap<String, Vec<String>>,
    pairs: HashMap<String, Vec<String>>,
    words: HashMap<String, String>,
    gen: i32,
    gen_lookup: HashMap<String, String>,
}

impl Lang {
    pub fn new() -> Lang {
        Lang {
            terminals: HashMap::new(),
            pairs: HashMap::new(),
            words: HashMap::new(),
            gen: 0,
            gen_lookup: HashMap::new(),
        }
    }

    pub fn from_file(rules_file: &str, words_file: &str) -> Lang {
	let mut lang = Lang::new();
	let rules = fs::read_to_string(rules_file).unwrap();
	let words = fs::read_to_string(words_file).unwrap();
	lang.init_rules(&rules);
	lang.init_words(&words);
	return lang;
    }

    // Rules section

    /**
     * Parses and initializes up the Lang's rules.
     */
    pub fn init_rules(&mut self, rules: &str) {
        let rules = rules.lines().filter(|x| !x.is_empty());
        for rule in rules {
            let mut parts = rule.split(":");
            let rule_type = parts.next();
            let values = parts.next();
            if parts.next() != None {
                eprintln!("[Ignored] Badly formatted rule \"{}\"", rule);
                continue;
            }

            if let (&Some(rule_type), &Some(values)) =
                (&rule_type.as_ref(), &values.as_ref())
            {
                let values = values.split("|");
                for value in values {
                    self.parse_rule_value(rule_type, value);
                }
            } else {
                eprintln!("[Ignored] Badly formatted rule \"{}\"", rule);
            }
        }
    }

    fn parse_rule_value(&mut self, rule_type: &str, value: &str) {
        let names = value.trim().split_whitespace().collect::<Vec<&str>>();
        let len_names = names.len();
        if len_names == 0 {
            self.rule_parsing_error(
                "Length must be >=1 for rule",
                rule_type,
                value,
            );
            return;
        }

        // non-terminal tuple
        if len_names > 2 {
            self.new_n_pair_rule(rule_type, names);
            return;
        }

        // non-terminal pair
        if len_names == 2 {
            if first_char_uppercase(names[0]) && first_char_uppercase(names[0])
            {
                self.new_pair_rule(rule_type, names[0], names[1])
            } else {
                self.rule_parsing_error(
                    "Unions must be between non-terminal vars",
                    rule_type,
                    value,
                );
            }
            return;
        }

        // terminal definition handling
        if first_char_lowercase(names[0]) {
            self.new_terminal_rule(rule_type, names[0]);
        } else {
            self.rule_parsing_error("No unit rules", rule_type, value);
        }
    }

    fn new_n_pair_rule(&mut self, rule_type: &str, vals: Vec<&str>) {
        let tvals = vals.clone();
        // check all non-terminal symbols
        for sym in tvals {
            if !first_char_uppercase(sym) {
                self.rule_parsing_error(
                    "Unions must be between non-terminal vars",
                    rule_type,
                    sym,
                );
                return;
            }
        }

        // chain everything together under generated types
        // except the last value pair
        let mut first = vals[0].to_string();
        let mut second = vals[1];
        let mut gname = self.next_gen_name(rule_type);
        self.new_pair_rule(&gname, &first, second);
        for i in 2..(vals.len() - 1) {
            first = gname;
            second = vals[i];
            gname = self.next_gen_name(rule_type);
            self.new_pair_rule(&gname, &first, second);
        }

        // the last value pair is the chain together with the last value
        // and is set to the real type so we know what's up.
        first = gname;
        if let Some(second) = vals.last() {
            self.new_pair_rule(rule_type, &first, second);
        }
    }

    fn new_pair_rule(&mut self, rule_type: &str, k1: &str, k2: &str) {
        let vals = self
            .pairs
            .entry(key_of_pair_rule(k1, k2))
            .or_insert(Vec::new());
        vals.push(rule_type.to_string());
    }

    fn new_terminal_rule(&mut self, rule_type: &str, terminal: &str) {
        let vals = self
            .terminals
            .entry(terminal.to_string())
            .or_insert(Vec::new());
        vals.push(rule_type.to_string());
    }

    fn rule_parsing_error(&self, reason: &str, rule_type: &str, value: &str) {
        eprintln!(
            "[Ignored] Bad rule {}: {}\nReason: {}",
            rule_type, value, reason
        );
    }

    fn next_gen_name(&mut self, rule_type: &str) -> String {
        self.gen += 1;
        let name = format!("__{}", self.gen);
        self.gen_lookup
            .entry(name.to_string())
            .or_insert(rule_type.to_string());
        return name;
    }

    // WORDS SECTION

    pub fn init_words(&mut self, words: &str) {
        let words = words.lines().filter(|x| !x.is_empty());
        for word in words {
            let mut pair = word.trim().split_whitespace();
            if let (Some(word), Some(terminal)) = (pair.next(), pair.next()) {
                self.words
                    .entry(word.to_string())
                    .or_insert(terminal.to_string());
            }
        }
    }

    pub fn parse_sentence(&self, sentence: &str) -> Result<AST, String> {
        let mut origins = sentence.split_whitespace().filter(|x| !x.is_empty());
        let words = origins.clone().filter_map(|x| self.words.get(x));
        let n = words.clone().count();

	if n == 0 {
	    return Err("Zero length sentence".to_string());
	}

	
        // Check for and report unknown words
        if origins.clone().count() != n {
            let mut error: Vec<String> = Vec::new();
            error.push("Unknown words:".to_string());
            for invalid in origins.filter_map(|x| {
                if self.words.contains_key(x) {
                    None
                } else {
                    Some(x)
                }
            }) {
                error.push(format!("Not a word: {}", invalid));
            }
            return Err(error.join("\n"));
        }

        let mut matrix: Vec<HashMap<String, CYKIntermediate>> =
            iter::repeat_with(|| HashMap::new()).take(n * n).collect();

        // Initialize matrix with the sentence
        let mut s = 0;
        for word in words {
            if let (Some(origin), Some(keys)) =
                (origins.next(), self.terminals.get(word))
            {
                let vals = iter::repeat_with(|| {
                    CYKIntermediate::Word((
                        word.to_string(),
                        origin.to_string(),
                    ))
                });
                let mut map = HashMap::new();
                map.extend(keys.iter().map(|x| x.to_string()).zip(vals));
                matrix[index2(n, n, 0, s)] = map;
            } else {
                return Err(format!("Unusable word {}", word));
            }
            s += 1;
        }

        // Execute CYK algorithm
        for l in 2..(n + 1) {
            for s in 1..(n - l + 2) {
                for p in 1..l {
                    let l_ind = index2(n, n, p - 1, s - 1);
                    let left = matrix[l_ind].clone();
                    let r_ind = index2(n, n, l - p - 1, s + p - 1);
                    let right = matrix[r_ind].clone();
                    let insert_ind = index2(n, n, l - 1, s - 1);
                    self.cyk_add_pairs_to_matrix(
                        &mut matrix,
                        &left,
                        &right,
                        l_ind,
                        r_ind,
                        insert_ind,
                    );
                }
            }
        }

        // Derive a sentence AST
        if let Some(answer) = matrix[index2(n, n, n - 1, 0)].get("S") {
            let ast = self.derive_answer(&matrix, answer);
            if let Some(ast) = ast {
                return Ok(ast);
            }
        }
        return Err("Bad grammar".to_string());
    }

    fn cyk_add_pairs_to_matrix(
        &self,
        matrix: &mut Vec<HashMap<String, CYKIntermediate>>,
        left: &HashMap<String, CYKIntermediate>,
        right: &HashMap<String, CYKIntermediate>,
        l_ind: usize,
        r_ind: usize,
        insert_ind: usize,
    ) {
        for l_sym in left.keys() {
            for r_sym in right.keys() {
                let pair = key_of_pair_rule(l_sym, r_sym);
                if let Some(derivations) = self.pairs.get(&pair) {
                    for rule_type in derivations {
                        let derivation = CYKIntermediate::Derivation((
                            l_sym.to_string(),
                            r_sym.to_string(),
                            l_ind,
                            r_ind,
                        ));
                        matrix[insert_ind]
                            .insert(rule_type.to_string(), derivation);
                    }
                }
            }
        }
    }

    fn derive_answer(
        &self,
        matrix: &Vec<HashMap<String, CYKIntermediate>>,
        answer: &CYKIntermediate,
    ) -> Option<AST> {
        match answer {
            CYKIntermediate::Word((a, b)) => {
                return Some(AST::Word((a.to_string(), b.to_string())));
            }
            CYKIntermediate::Derivation((l_sym, r_sym, l_ind, r_ind)) => {
                let l_val = matrix[l_ind.clone()].get(l_sym)?;
                let r_val = matrix[r_ind.clone()].get(r_sym)?;
                let l_answer = self.derive_answer(matrix, l_val)?;
                let r_answer = AST::Tagged(
                    r_sym.to_string(),
                    Box::new(self.derive_answer(matrix, r_val)?),
                );

                // Handle N-Pair
                if let (Some(c), AST::Rule(l_answer)) =
                    (l_sym.chars().next(), l_answer.clone())
                {
                    if c == '_' {
                        let mut ans: Vec<AST> = Vec::new();
                        ans.extend(l_answer);
                        ans.push(r_answer);
                        return Some(AST::Rule(ans));
                    }
                }

                // Normal 2-Pair rule
                let l_answer =
                    AST::Tagged(l_sym.to_string(), Box::new(l_answer));
                let mut ans: Vec<AST> = Vec::new();
                ans.push(l_answer);
                ans.push(r_answer);
                Some(AST::Rule(ans))
            }
        }
    }
}

#[derive(Clone)]
enum CYKIntermediate {
    Word((String, String)),
    Derivation((String, String, usize, usize)),
}

fn index2(dim_row: usize, dim_col: usize, row: usize, col: usize) -> usize {
    if row >= dim_row || col >= dim_col {
        eprintln!("indexing broke");
        return 0;
    }
    return row + col * dim_row;
}

fn key_of_pair_rule(k1: &str, k2: &str) -> String {
    return format!("{}::{}", k1, k2);
}

fn first_char_uppercase(s: &str) -> bool {
    if let Some(c) = s.chars().next() {
        if c.is_uppercase() {
            return true;
        }
    }
    return false;
}

fn first_char_lowercase(s: &str) -> bool {
    if let Some(c) = s.chars().next() {
        if c.is_lowercase() {
            return true;
        }
    }
    return false;
}

#[cfg(test)]
mod test {
    use super::Lang;

    fn make_lang() -> Lang {
        Lang::from_file("rust/test-data/test-lang-rules.txt", "rust/test-data/test-lang-words.txt")
    }

    #[test]
    fn test_produces_ast() {
        let lang = make_lang();
        let test = "eat the green apple on a table";
        let ast = lang.parse_sentence(test).unwrap();
        assert_eq!("((Tagged Verb (Word verb eat)) (Tagged NounClause \
((Tagged Count (Word definiteArticle the)) (Tagged ANoun ((Tagged Adjective \
(Word adjective green)) (Tagged Noun (Word noun apple)))))) (Tagged PrepClause \
((Tagged Prep (Word prep on)) (Tagged NounClause ((Tagged Count (Word \
indefiniteArticle a)) (Tagged ANoun (Word noun table)))))))",
		   format!("{}", ast));
    }

    #[test]
    fn test_unknown_words_produces_error() {
        let lang = make_lang();
        let test = "eat my green horse on a table";
        match lang.parse_sentence(test) {
            Err(error) => assert_eq!(
                "Unknown words:
Not a word: my
Not a word: horse",
                error
            ),
            Ok(_) => {
                panic!("Should have failed");
            }
        };
    }

    #[test]
    fn test_bad_grammar_produces_error() {
        let lang = make_lang();
        let test = "eat apple eat apple";
        match lang.parse_sentence(test) {
            Err(error) => assert_eq!("Bad grammar", error),
            Ok(_) => {
                panic!("Should have failed");
            }
        };
    }
}
