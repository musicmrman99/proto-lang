lexer grammar ProtoLexer;

/* Character Classes
-------------------------------------------------- */

/* Primitive Classes
-------------------- */

// Language reserved characters
/* Excludes symbols that only appear in multi-symbol tokens (eg. the OPEN_COMMENT_LINE or
   ASSOCIATION tokens), as using them in sentences can be avoided more easily. */
fragment RESERVED_SYMBOL : [#",:@[\]{|}] ;

// Comment-only characters
fragment COMMENT_SYMBOL : [\u2500-\u257F] ; // \u2500-\u257F are the box-drawing characters

// Spaces
fragment SPACE : [\t ] ;
fragment NEWLINE : ('\r'? '\n' | '\r') ;

// Digit characters
fragment DIGIT : [0-9] ;

// Word characters - roughly ordered by ASCII/Unicode code point (excludes reserved symbols)
fragment LETTER : [A-Za-zªºÀ-ÖØ-öø-ňŊ-ɏͰ-ϿЀ-ӿ] ;
fragment GENERAL_SYMBOL : [!#&'()*\-./\\;?¡¿«»‹›…] ;
fragment TYPOGRAPHIC_SYMBOL : [^_`~¨¯´¶¸–—†‡•Ⅰ-Ⅻ] ;
fragment MATH_SYMBOL : [%+<=>¬°±µ·×÷‰′″\u0220-\u022F] ; // Excludes math chars that also have general uses, eg. the set [-*/]
fragment CURRENCY_SYMBOL : [¤$£¥¢] ; // Others will be added later
fragment DOMAIN_SYMBOL : [§©®] ;

// Strings - special case
fragment STRING_QUOTE : ["] ;
fragment STRING_CHAR : ~["] ;
fragment STRING_ESCAPE : '\\' . ;

/* Composite Classes
-------------------- */

fragment WORD_CHAR : (
    LETTER
  | GENERAL_SYMBOL
  | TYPOGRAPHIC_SYMBOL
  | MATH_SYMBOL
  | CURRENCY_SYMBOL
  | DOMAIN_SYMBOL
) ;

/* Global Tokens
-------------------------------------------------- */

OPEN_COMMENT_LINE : '#' ;
OPEN_COMMENT_BLOCK : '#{' ;
CLOSE_COMMENT_BLOCK : '}#' ;

INT_LITERAL : DIGIT+ ;
DECIMAL_POINT : '.' ;
STRING_LITERAL : STRING_QUOTE (STRING_ESCAPE | STRING_CHAR)* STRING_QUOTE ;
LOGICAL_LITERAL : 'true' | 'false' ;

OPEN_PARAMETER : '@' ;

WORD : WORD_CHAR ((WORD_CHAR | DIGIT)+)? ;

ANY_SPACE : SPACE+ ;
ANY_NEWLINE : NEWLINE ;

/* Block Mode (default)
-------------------------------------------------- */

/* Unique Tokens */
IS_DEFINED_AS : ':' ;
PLACEHOLDER : '|' ;

/* Allowed Mode Transitons */
CLOSE_BLOCK : '}' -> popMode ;                     // <-
OPEN_MAP : '[' -> pushMode(MAP_MODE) ;             // -> Map Mode
OPEN_BLOCK : '{' -> pushMode(DEFAULT_MODE) ;       // -> Block Mode

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

    /* Global Tokens */
    MAP_MODE_OPEN_COMMENT_LINE : OPEN_COMMENT_LINE -> type(OPEN_COMMENT_LINE) ;
    MAP_MODE_OPEN_COMMENT_BLOCK : OPEN_COMMENT_BLOCK -> type(OPEN_COMMENT_BLOCK) ;
    MAP_MODE_CLOSECOMMENT_BLOCK : CLOSE_COMMENT_BLOCK -> type(CLOSE_COMMENT_BLOCK) ;

    MAP_MODE_INT_LITERAL : INT_LITERAL -> type(INT_LITERAL) ;
    MAP_MODE_DECIMAL_POINT : DECIMAL_POINT -> type(DECIMAL_POINT) ;
    MAP_MODE_STRING_LITERAL : STRING_LITERAL -> type(STRING_LITERAL) ;
    MAP_MODE_LOGICAL_LITERAL : LOGICAL_LITERAL -> type(LOGICAL_LITERAL) ;

    MAP_MODE_OPEN_PARAMETER : OPEN_PARAMETER -> type(OPEN_PARAMETER) ;

    MAP_MODE_WORD : WORD -> type(WORD) ;

    MAP_MODE_ANY_SPACE : ANY_SPACE -> type(ANY_SPACE) ;
    MAP_MODE_ANY_NEWLINE : ANY_NEWLINE -> type(ANY_NEWLINE) ;
