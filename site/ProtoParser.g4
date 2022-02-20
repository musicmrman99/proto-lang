parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? expression+ EOF ;

expression : (expression_atom | newline)+ ;

expression_atom :
    /* Comments */
    any_whitespace? OPEN_COMMENT_LINE (~NEWLINE)* #comment_line
  | OPEN_COMMENT_BLOCK (~CLOSE_COMMENT_BLOCK)* CLOSE_COMMENT_BLOCK #comment_block

    /* Literals */
  | NUMBER_LITERAL #lit_number
  | STRING_LITERAL #lit_string
  | LOGICAL_LITERAL #lit_logical
  | map_literal #lit_map
  | block_literal #lit_block
    
    /* Associations */
  | any_whitespace? ASSOCIATION any_whitespace? #association

    /* Specific Syntaxes */
  | OPEN_PARAMETER PARAMETER_INDEX map_literal? #parameter

    /* Sentences and Sentence Templates */
  | any_whitespace? IS_DEFINED_AS any_whitespace? #declaration_point
  | PLACEHOLDER #placeholder_point
  | (WORD | SPACE)+ #sentence_fragment
;

map_literal : OPEN_MAP any_whitespace?
    expression? (ELEM_DELIM any_whitespace? expression)*
any_whitespace? CLOSE_MAP ;

block_literal : OPEN_BLOCK any_whitespace?
    expression*
any_whitespace? CLOSE_BLOCK;

newline : (NEWLINE SPACE?)+ ;
any_whitespace : (SPACE | NEWLINE)+ ;
