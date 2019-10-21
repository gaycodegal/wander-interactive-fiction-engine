use ast::AST;
use ast::AST::Rule;
use ast::AST::Tagged;
use ast::AST::Word;

pub struct ASTSearch<'life> {
    tree: Option<&'life AST>,
}

impl<'life> ASTSearch<'life> {
    pub fn new<'outside>(tree: Option<&'outside AST>) -> ASTSearch<'outside> {
        ASTSearch { tree: tree }
    }

    pub fn get_tree(&self, symbol: &str) -> ASTSearch<'life> {
        if let Some(tree) = self.tree {
            return ASTSearch::new(self.get_tree_helper(symbol, tree));
        } else {
            return ASTSearch::new(None);
        }
    }

    fn get_tree_helper(
        &self,
        symbol: &str,
        tree: &'life AST,
    ) -> Option<&'life AST> {
        match tree {
            Word(_) => None,
            Tagged(non_terminal, child) => {
                if non_terminal == symbol {
                    Some(child)
                } else {
                    self.get_tree_helper(symbol, child)
                }
            }

            Rule(children) => {
                for child in children {
                    let result = self.get_tree_helper(symbol, child);
                    if result.is_some() {
                        return result;
                    }
                }
                return None;
            }
        }
    }

    pub fn child_tree(&self, symbol: &str) -> ASTSearch<'life> {
        if let Some(tree) = self.tree {
            match tree {
                Tagged(_, child) => {
                    ASTSearch::new(self.find_tree_in_children(symbol, child))
                }
                Rule(_) => {
                    ASTSearch::new(self.find_tree_in_children(symbol, tree))
                }
                _ => ASTSearch::new(None),
            }
        } else {
            ASTSearch::new(None)
        }
    }

    fn find_tree_in_children(
        &self,
        symbol: &str,
        tree: &'life AST,
    ) -> Option<&'life AST> {
        match tree {
            Rule(children) => {
                for child in children {
                    if let Tagged(non_terminal, _) = child.clone() {
                        if non_terminal == symbol {
                            return Some(child);
                        }
                    }
                }
                return None;
            }
            _ => None,
        }
    }

    pub fn get_terminal(&self, symbol: &str) -> Option<String> {
        if let Some(tree) = self.tree {
            return self.get_terminal_helper(symbol, tree);
        } else {
            return None;
        }
    }

    fn get_terminal_helper(
        &self,
        symbol: &str,
        tree: &'life AST,
    ) -> Option<String> {
        match tree {
            Word((terminal, origin)) => {
                if symbol == terminal {
                    Some(origin.to_string())
                } else {
                    None
                }
            }
            Tagged(_, child) => self.get_terminal_helper(symbol, child),

            Rule(children) => {
                for child in children {
                    let result = self.get_terminal_helper(symbol, child);
                    if result.is_some() {
                        return result;
                    }
                }
                return None;
            }
        }
    }
}
