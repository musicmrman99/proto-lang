parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? expression+ EOF ;

expression : (expression_atom | newline)+ ;

expression_atom :
    /* Comments */
    any_whitespace? COMMENT_LINE_OPEN (~NEWLINE)* #comment_line
  | COMMENT_BLOCK_OPEN (~COMMENT_BLOCK_CLOSE)* COMMENT_BLOCK_CLOSE #comment_block

    /* Literals */
  | NUMBER_LITERAL #lit_number
  | STRING_LITERAL #lit_string
  | LOGICAL_LITERAL #lit_logical
  | map_literal #lit_map
  | block_literal #lit_block
    
    /* Sentences and Sentence Templates */
  | (WORD | SPACE)+ #sentence_fragment
  | PLACEHOLDER #placeholder_point
  | any_whitespace? IS_DEFINED_AS any_whitespace? #declaration_point

    /* Specific Syntaxes */
  | PARAMETER_OPEN PARAMETER_INDEX map_literal? #parameter
;

map_literal : OPEN_MAP any_whitespace?
    expression? (ELEM_DELIM any_whitespace? expression)*
any_whitespace? CLOSE_MAP ;

block_literal : OPEN_BLOCK any_whitespace?
    expression*
any_whitespace? CLOSE_BLOCK;

newline : (NEWLINE SPACE?)+ ;
any_whitespace : (SPACE | NEWLINE)+ ;
