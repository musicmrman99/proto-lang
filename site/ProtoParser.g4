parser grammar ProtoParser;

options {
    tokenVocab = ProtoLexer;
}

program : newline? expression+ EOF ;

expression : (expressionAtom | newline)+ ;

expressionAtom :
    /* Comments */
    anyWhitespace? COMMENT_LINE_OPEN (~NEWLINE)* #comment_line
  | COMMENT_BLOCK_OPEN (~COMMENT_BLOCK_CLOSE)* COMMENT_BLOCK_CLOSE #comment_block

    /* Literals */
  | LIT_NUMBER #lit_number
  | LIT_STRING #lit_string
  | LIT_LOGICAL #lit_logical

    /* Recursive Literals */
  | map_literal #lit_map
    
  | (OPEN_BLOCK anyWhitespace?
        expression*
    anyWhitespace? CLOSE_BLOCK) #lit_block
    
    /* Sentences */
  | (WORD | SPACE)+ #sentence_fragment

    /* Specific Syntaxes */
  | PARAMETER_OPEN PARAMETER_INDEX map_literal? #parameter
;

map_literal : OPEN_MAP anyWhitespace?
    expression? (ELEM_DELIM anyWhitespace? expression)*
anyWhitespace? CLOSE_MAP ;

newline : (NEWLINE SPACE?)+ ;
anyWhitespace : (SPACE | NEWLINE)+ ;
