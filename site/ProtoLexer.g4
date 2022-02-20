lexer grammar ProtoLexer;

// Primitives
fragment DIGIT : [0-9] ;
fragment STRING_QUOTE : ["] ;
fragment STRING_CHAR : ~["] ;
fragment STRING_ESCAPE : '\\' . ;
fragment WORD_CHAR : [a-zA-Z'_()-] ;

/* Global Tokens
-------------------------------------------------- */

OPEN_COMMENT_LINE : '#' ;
OPEN_COMMENT_BLOCK : '#{' ;
CLOSE_COMMENT_BLOCK : '}#' ;

NUMBER_LITERAL : DIGIT+ ('.' DIGIT+)? ;
STRING_LITERAL : STRING_QUOTE (STRING_ESCAPE | STRING_CHAR)* STRING_QUOTE ;
LOGICAL_LITERAL : 'true' | 'false' ;

WORD : WORD_CHAR ((WORD_CHAR | DIGIT)+)? ;

SPACE : (' ' | '\t')+ ;
NEWLINE : ('\r'? '\n' | '\r') ;

/* Block Mode (default)
-------------------------------------------------- */

/* Unique Tokens */
IS_DEFINED_AS : ':' ;
PLACEHOLDER : '|' ;

/* Allowed Mode Transitons */
CLOSE_BLOCK : '}' -> popMode ;                     // <-
OPEN_MAP : '[' -> pushMode(MAP_MODE) ;             // -> Map Mode
OPEN_BLOCK : '{' -> pushMode(DEFAULT_MODE) ;       // -> Block Mode
OPEN_PARAMETER : '@' -> pushMode(PARAMETER_MODE) ; // -> Parameter Mode

// Global Tokens already defined in default mode

/* Map Mode
-------------------------------------------------- */

mode MAP_MODE;
    /* Unique Tokens */
    ASSOCIATION : [<-][-/][->] ;
    ELEM_DELIM : ',' ;

    /* Allowed Mode Transitons */
    CLOSE_MAP : ']' -> popMode ;                // <-
    MAP_MODE_OPEN_MAP : OPEN_MAP ->             // -> Map Mode
        type(OPEN_MAP),
        pushMode(MAP_MODE) ;
    MAP_MODE_OPEN_BLOCK : OPEN_BLOCK ->         // -> Block Mode
        type(OPEN_BLOCK),
        pushMode(DEFAULT_MODE) ;
    MAP_MODE_OPEN_PARAMETER : OPEN_PARAMETER -> // -> Parameter Mode
        type(OPEN_PARAMETER),
        pushMode(PARAMETER_MODE) ;

    /* Global Tokens */
    MAP_MODE_OPEN_COMMENT_LINE : OPEN_COMMENT_LINE -> type(OPEN_COMMENT_LINE) ;
    MAP_MODE_OPEN_COMMENT_BLOCK : OPEN_COMMENT_BLOCK -> type(OPEN_COMMENT_BLOCK) ;
    MAP_MODE_CLOSECOMMENT_BLOCK : CLOSE_COMMENT_BLOCK -> type(CLOSE_COMMENT_BLOCK) ;

    MAP_MODE_NUMBER_LITERAL : NUMBER_LITERAL -> type(NUMBER_LITERAL) ;
    MAP_MODE_STRING_LITERAL : STRING_LITERAL -> type(STRING_LITERAL) ;
    MAP_MODE_LOGICAL_LITERAL : LOGICAL_LITERAL -> type(LOGICAL_LITERAL) ;

    MAP_MODE_WORD : WORD -> type(WORD) ;

    MAP_MODE_SPACE : SPACE -> type(SPACE) ;
    MAP_MODE_NEWLINE : NEWLINE -> type(NEWLINE) ;

/* Parameter Mode
-------------------------------------------------- */

mode PARAMETER_MODE;
    /* Unique Tokens / Allowed Mode Transitons */
    PARAMETER_INDEX : DIGIT+ -> popMode ; // <-

    // No Global Tokens
