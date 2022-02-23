parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? expression_atom+ EOF ;

comment : comment_line | comment_block ;
comment_line : any_whitespace OPEN_COMMENT_LINE (~NEWLINE)* ;
comment_block : OPEN_COMMENT_BLOCK (~CLOSE_COMMENT_BLOCK)* CLOSE_COMMENT_BLOCK ;

expression_atom : (
    // Values
    number_literal
  | string_literal
  | logical_literal
  | map_literal
  | block_literal
  | parameter

    // Operators and Sentences (these are reorganised in 2nd-phase parse/link)
  | association_operator
  | declaration_operator
  | placeholder_operator
  | sentence_fragment

    // Newline (determines sentence terminators during 2nd-phase parse/link)
  | newline

    // Comment (ignored)
  | comment
) ;

number_literal : INT_LITERAL (DECIMAL_POINT INT_LITERAL)? ;
string_literal : STRING_LITERAL ;
logical_literal : LOGICAL_LITERAL ;

map_literal : OPEN_MAP any_whitespace?
    (expression_atom+?)? (ELEM_DELIM any_whitespace? expression_atom+?)*
any_whitespace? CLOSE_MAP ;

block_literal : OPEN_BLOCK any_whitespace?
    (expression_atom+?)?
any_whitespace? CLOSE_BLOCK;

parameter_index : INT_LITERAL ;
parameter_extraction : map_literal ;
parameter : OPEN_PARAMETER parameter_index? parameter_extraction? ;

association_operator : any_whitespace ASSOCIATION any_whitespace ;
declaration_operator : any_whitespace IS_DEFINED_AS any_whitespace ;
placeholder_operator : PLACEHOLDER ;

sentence_fragment : (WORD | SPACE)+ ;

newline : (NEWLINE SPACE?)+ ;
any_whitespace : (SPACE | NEWLINE)+ ;
