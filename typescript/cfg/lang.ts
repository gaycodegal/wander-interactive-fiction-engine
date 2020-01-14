type AST = any[];
type Word = [string, string]
type Derivation = [string, string, number, number];
type CYKIntermediate = Word | Derivation;

export class Lang {
    terminals: { [key:string]:Array<string>; };
    pairs: { [key:string]:Array<string>; };
    words: { [key:string]:string; };
    gen: number;
    gen_lookup: { [key:string]:string; };

    constructor() {
        this.terminals = {};
	this.pairs = {};
	this.words = {};
	this.gen_lookup = {};
	this.gen = 0;
    }
    
    /*from_file(rules_file: string, words_file: string): Lang {
      const lang = new Lang();
      let rules = fs::read_to_string(rules_file).unwrap();
      let words = fs::read_to_string(words_file).unwrap();
      lang.init_rules(&rules);
      lang.init_words(&words);
      return lang;
      }*/

    // Rules section

    /**
     * Parses and initializes up the Lang's rules.
     */
    init_rules(_rules: string) {
        const rules: Array<string> = _rules.split("\n").filter(x => x.length > 0);
        for(let irule in rules) {
	    const rule = rules[irule];
            let parts = rule.split(":").reverse();
            const rule_type = parts.pop();
            const valuesStr = parts.pop();
            if (parts.length > 0 || !rule_type || !valuesStr) {
                console.error(`[Ignored] Badly formatted rule "${rule}"`);
                continue;
            }
	    
            const values = valuesStr.split("|");
            for (let ivalue in values) {
		const value = values[ivalue];
                this.parse_rule_value(rule_type, value);
            }
        }
    }

    private parse_rule_value(rule_type: string, value: string) {
        const names = value.trim().split(" ");
        const len_names = names.length;
        if (len_names == 0) {
            this.rule_parsing_error(
                "Length must be >=1 for rule",
                rule_type,
                value,
            );
            return;
        }

        // non-terminal tuple
        if (len_names > 2) {
            this.new_n_pair_rule(rule_type, names);
            return;
        }

        // non-terminal pair
        if (len_names == 2) {
            if (first_char_uppercase(names[0]) && first_char_uppercase(names[0])
               ) {
                this.new_pair_rule(rule_type, names[0], names[1])
            } else {
                this.rule_parsing_error(
                    "Unions must be between non-terminal vars",
                    rule_type,
                    value,
                );
            }
            return;
        }

        // terminal definition handling
        if (first_char_lowercase(names[0])) {
            this.new_terminal_rule(rule_type, names[0]);
        } else {
            this.rule_parsing_error("No unit rules", rule_type, value);
        }
    }

    private new_n_pair_rule(rule_type: string, vals: string[]) {
        // check all non-terminal symbols
        for (let isym in vals) {
	    const sym = vals[isym];
            if (!first_char_uppercase(sym)) {
                this.rule_parsing_error(
                    "Unions must be between non-terminal vars",
                    rule_type,
                    sym,
                );
                return;
            }
        }

        // chain everything together under generated types
        // except the last value pair
        let first = vals[0];
        let second = vals[1];
        let gname = this.next_gen_name(rule_type);
        this.new_pair_rule(gname, first, second);
        for (let i = 2; i < vals.length - 1; ++i) {
            first = gname;
            second = vals[i];
            gname = this.next_gen_name(rule_type);
            this.new_pair_rule(gname, first, second);
        }

        // the last value pair is the chain together with the last value
        // and is set to the real type so we know what's up.
        first = gname;
        second = vals[vals.length - 1];
        this.new_pair_rule(rule_type, first, second);
    }

    private new_pair_rule(rule_type: string, k1: string, k2: string) {
	let key = key_of_pair_rule(k1, k2);
        const vals = this.pairs[key] || [];
        vals.push(rule_type);
	this.pairs[key] = vals;
    }

    private new_terminal_rule(rule_type: string, terminal: string) {
        const vals = this.terminals[terminal] || [];
        vals.push(rule_type);
	this.terminals[terminal] = vals;
    }

    private rule_parsing_error(reason: string, rule_type: string, value: string) {
        console.error(
            `[Ignored] Bad rule ${rule_type}: ${value}\nReason: ${reason}`
        );
    }

    private next_gen_name(rule_type: string): string {
        this.gen += 1;
        const name = "__" + this.gen;
        if (!this.gen_lookup[name]) {
	    this.gen_lookup[name] = rule_type;
	}
        return name;
    }

    // WORDS SECTION

    init_words(words_: string) {
        const words = words_.split("\n").filter(x => x.length > 0);
        for (let iword in words) {
	    let word = words[iword];
            let pair = word.trim().split(" ");
	    word = pair[0];
	    const terminal = pair[1];
	    if (word && terminal && !this.words[word]) {
		this.words[word] = terminal;
            }
        }
    }

    parse_sentence(sentence: string): AST {
        let origins = sentence.split(" ").filter(x => x.length > 0);
        const words = origins.map(x => this.words[x]).filter(x=>x);
        const n = words.length;

        if (n == 0) {
            throw new Error("Zero length sentence");
        }

        // Check for and report unknown words
        if (origins.length != n) {
            let error: any[] = [];
            error.push("Unknown words:");
	    error = error.concat(origins.map(x => !this.words[x] && `Not a word: ${x}`).filter(x=>x));
            throw new Error(error.join("\n"));
        }

        let matrix: Array<{[key:string]: CYKIntermediate;}> = new Array(n * n);
	for (let i = 0; i < n * n; ++i) {
	    matrix[i] = {};
	}
	origins = origins.reverse();
        // Initialize matrix with the sentence
        let s = 0;
        for (let iword in words) {
	    const word = words[iword];
	    const origin = origins.pop();
	    const keys = this.terminals[word];
            if (origin && keys) {
		let map = {};
		for (let ikey in keys) {
		    let key = keys[ikey];
		    map[key] = [word, origin];
		}
                matrix[index2(n, n, 0, s)] = map;
            } else {
                throw new Error(`Unusable word ${word}`);
            }
            s += 1;
	}
	
        // Execute CYK algorithm
	for (let l = 2; l < n + 1; ++l) {
            for (let s = 1; s < n - l + 2; ++s) {
                for (let p = 1; p < l; ++p) {
                    const l_ind = index2(n, n, p - 1, s - 1);
                    const left = matrix[l_ind];
                    const r_ind = index2(n, n, l - p - 1, s + p - 1);
                    const right = matrix[r_ind];
                    const insert_ind = index2(n, n, l - 1, s - 1);
                    this.cyk_add_pairs_to_matrix(
                        matrix,
                        left,
                        right,
                        l_ind,
                        r_ind,
                        insert_ind,
                    );
                }
            }
        }

        // Derive a sentence AST
	const answer = matrix[index2(n, n, n - 1, 0)]["S"];
        if (answer) {
            const ast = this.derive_answer(matrix, answer);
            if (ast) {
                return ast;
            }
        }
        throw new Error("Bad grammar");
    }

    private cyk_add_pairs_to_matrix(
        matrix: Array<{[key: string]: CYKIntermediate;}>,
        left: {[key: string]: CYKIntermediate;},
        right: {[key: string]: CYKIntermediate;},
        l_ind: number,
        r_ind: number,
        insert_ind: number,
    ) {
        for (let l_sym in left) {
            for (let r_sym in right) {
                const pair = key_of_pair_rule(l_sym, r_sym);
		const derivations = this.pairs[pair];
                if (derivations) {
                    for (let irule_type in derivations) {
			const rule_type = derivations[irule_type];
                        const derivation: Derivation = [
                            l_sym,
                            r_sym,
                            l_ind,
                            r_ind,
                        ];
                        matrix[insert_ind][rule_type] = derivation;
                    }
                }
            }
        }
    }
    
    private derive_answer(
        matrix: Array<{[key: string]: CYKIntermediate;}>,
        answer: CYKIntermediate,
    ): AST | null {
        if (isWord(answer)) {
	    return answer;
	}
	if (isDerivation(answer)) {
	    const l_sym = answer[0];
	    const r_sym = answer[1];
	    const l_ind = answer[2];
	    const r_ind = answer[3];
            const l_val = matrix[l_ind][l_sym];
            const r_val = matrix[r_ind][r_sym];
	    if (!l_val || !r_val) return null;
            let l_answer = this.derive_answer(matrix, l_val);
	    if (!l_answer) return null;
            const r_answer = [r_sym, this.derive_answer(matrix, r_val)];
	    if (!r_answer[1]) return null;
            // Handle N-Pair
	    const c = l_sym[0];
            if (c == '_') {
                let ans: Array<AST> = [];
                ans = ans.concat(l_answer);
                ans.push(r_answer);
                return ans;
            }
	    
            l_answer = [l_sym, l_answer];
            let ans: Array<AST> = [];
            ans.push(l_answer);
            ans.push(r_answer);
            return ans;

        }
	return null;
    }
}

function isDerivation(x: CYKIntermediate): x is Derivation {
    return x.length == 4;
}

function isWord(x: CYKIntermediate): x is Word {
    return x.length == 2;
}

function index2(dim_row: number, dim_col: number, row: number, col: number): number {
    if (row >= dim_row || col >= dim_col) {
        console.error("indexing broke");
        return 0;
    }
    return row + col * dim_row;
}

function key_of_pair_rule(k1: string, k2: string): string {
    return `${k1}::${k2}`;
}

function first_char_uppercase(s: string): boolean {
    if (s.length == 0) return false;
    const c = s[0];
    return c == c.toUpperCase();
}

function first_char_lowercase(s: string): boolean {
    if (s.length == 0) return false;
    const c = s[0];
    return c == c.toLowerCase();
}
