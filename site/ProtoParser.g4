parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? expression_atom+ EOF ;

// Note: The order of groups matters, but rarely the order of nodes within groups.
expression_atom : (
    // Values (Literals and Syntactic Expressions)
    number_literal
  | string_literal
  | logical_literal
  | map_literal
  | block_literal
  | parameter

    // Operators (reorganised in 2nd-phase parse/link)
  | declaration_operator
  | placeholder_operator

    // Newlines (determines sentence terminators during 2nd-phase parse/link)
  | newline

    // Comments (ignored)
  | comment

    // Sentences (reorganised in 2nd-phase parse/link)
  | sentence_fragment
) ;

// Comments
comment : comment_line | comment_block ;
comment_line : any_whitespace? OPEN_COMMENT_LINE (~NEWLINE)* ;
comment_block : OPEN_COMMENT_BLOCK (~CLOSE_COMMENT_BLOCK)* CLOSE_COMMENT_BLOCK ;

// Values (Literals and Syntactic Expressions)
number_literal : INT_LITERAL (DECIMAL_POINT INT_LITERAL)? ;
string_literal : STRING_LITERAL ;
logical_literal : LOGICAL_LITERAL ;

map_expression_atom : (
    expression_atom
  | association_operator
);
map_literal : OPEN_MAP any_whitespace?
    (map_expression_atom+? (ELEM_DELIM any_whitespace? map_expression_atom+?)*)?
any_whitespace? CLOSE_MAP ;
association_operator : any_whitespace ASSOCIATION any_whitespace ;

block_literal : OPEN_BLOCK any_whitespace?
    (expression_atom+?)?
any_whitespace? CLOSE_BLOCK;

parameter_index : INT_LITERAL ;
parameter_extraction : map_literal ;
parameter : OPEN_PARAMETER parameter_index? parameter_extraction? ;

// Sentences
declaration_operator : any_whitespace IS_DEFINED_AS any_whitespace ;
placeholder_operator : PLACEHOLDER ;
sentence_fragment : WORD | SPACE | DECIMAL_POINT ;

// Language-aware kinds of whitespace
newline : (NEWLINE SPACE?)+ ;
any_whitespace : (SPACE | NEWLINE)+ ;
