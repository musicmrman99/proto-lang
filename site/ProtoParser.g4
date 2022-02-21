parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? (comment | expression)+ EOF ;

comment : comment_line | comment_block ;
comment_line : any_whitespace? OPEN_COMMENT_LINE (~NEWLINE)* ;
comment_block : OPEN_COMMENT_BLOCK (~CLOSE_COMMENT_BLOCK)* CLOSE_COMMENT_BLOCK ;

expression : (
    // Values
    NUMBER_LITERAL
  | STRING_LITERAL
  | LOGICAL_LITERAL
  | map_literal
  | block_literal
  | parameter

    // Operators and Sentences (these are reorganised in 2nd-phase parse/link)
  | association
  | declaration_point
  | placeholder_point
  | sentence_fragment

    // Newline (determines sentence terminators during 2nd-phase parse/link)
  | newline
)+ ;

map_literal : OPEN_MAP any_whitespace?
    expression? (ELEM_DELIM any_whitespace? expression)*
any_whitespace? CLOSE_MAP ;

block_literal : OPEN_BLOCK any_whitespace?
    expression*
any_whitespace? CLOSE_BLOCK;

parameter : OPEN_PARAMETER PARAMETER_INDEX map_literal? ;

association : any_whitespace? ASSOCIATION any_whitespace? ;

declaration_point : any_whitespace? IS_DEFINED_AS any_whitespace? ;
placeholder_point : PLACEHOLDER ;
sentence_fragment : (WORD | SPACE)+ ;

newline : (NEWLINE SPACE?)+ ;
any_whitespace : (SPACE | NEWLINE)+ ;
