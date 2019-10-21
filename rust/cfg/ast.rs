use std::fmt;

#[derive(Clone)]
pub enum AST {
    Word((String, String)),
    Tagged(String, Box<AST>),
    Rule(Vec<AST>),
}

impl fmt::Display for AST {
    fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
        fmt.write_str(&str_ast(self))?;
        Ok(())
    }
}

fn str_ast(ast: &AST) -> String {
    let mut out: Vec<String> = Vec::new();
    str_ast_helper(&mut out, ast);
    return out.join("");
}

fn str_ast_helper(out: &mut Vec<String>, ast: &AST) {
    match ast {
        AST::Word((a, b)) => out.push(format!("(Word {} {})", a, b)),
        AST::Tagged(a, b) => {
            out.push(format!("(Tagged {} ", a));
            str_ast_helper(out, b);
            out.push(")".to_string());
        }
        AST::Rule(v) => {
            out.push("(".to_string());
            for ast in v.iter() {
                str_ast_helper(out, ast);
                out.push(" ".to_string());
            }
            out.pop();
            out.push(")".to_string());
        }
    }
}
