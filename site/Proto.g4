grammar Proto;

/* Parser Rules
-------------------------------------------------- */

program : newline? expression+ EOF ;

expression : (expressionAtom | newline)+ ;

expressionAtom :
    /* Literals */
    LIT_NUMBER #lit_number
  | LIT_STRING #lit_string
  | LIT_LOGICAL #lit_logical

    /* Recursive Literals */
  | (OPEN_MAP anyWhitespace?
        expression? (ELEM_DELIM anyWhitespace? expression)*
    anyWhitespace? CLOSE_MAP) #lit_map
    
  | (OPEN_BLOCK anyWhitespace?
        expression*
    anyWhitespace? CLOSE_BLOCK) #lit_block
    
    /* Sentences */
  | (WORD | SPACE)+ #sentence_fragment
;

newline : (NEWLINE SPACE?)+ ;
anyWhitespace : (SPACE | NEWLINE)+ ;

/* Lexer Rules
-------------------------------------------------- */

fragment DIGIT : [0-9] ;
fragment WORD_CHAR : [a-zA-Z'_()-] ;
fragment STRING_QUOTE : ["] ;
fragment STRING_CHAR : ~["] ;
fragment STRING_ESCAPE : '\\' . ;

LIT_NUMBER : DIGIT+ ('.' DIGIT+)? ;
LIT_STRING : STRING_QUOTE (STRING_ESCAPE | STRING_CHAR)* STRING_QUOTE ;
LIT_LOGICAL : 'true' | 'false' ;

OPEN_MAP : '[' ;
CLOSE_MAP : ']' ;
ELEM_DELIM : ',' ;

OPEN_BLOCK : '{' ;
CLOSE_BLOCK : '}' ;

WORD : WORD_CHAR ((WORD_CHAR | DIGIT)+)? ;

SPACE : (' ' | '\t')+ ;
NEWLINE : ('\r'? '\n' | '\r') ;
