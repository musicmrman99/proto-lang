lexer grammar ProtoLexer;

/* Character Classes
-------------------------------------------------- */

// Space characters
fragment SPACE_CHAR : [\t ] ;
fragment NEWLINE_CHAR : ('\r'? '\n' | '\r') ; // Eh, pretend it's one character.

// Digit characters
fragment DIGIT : [0-9] ;

// Word characters - roughly ordered by ASCII/Unicode code point (excludes reserved symbols)
fragment LETTER : [A-Za-eg-su-zªºÀ-ÖØ-öø-ňŊ-ɏͰ-ϿЀ-ӿ] ; // exclude 'f' and 't' (the starting letters of 'false' and 'true')
fragment GENERAL_SYMBOL : [!&'()*/\\;?¡¿«»‹›…] ;
fragment TYPOGRAPHIC_SYMBOL : [^_`~¨¯´¶¸–—†‡•Ⅰ-Ⅻ] ;
fragment MATH_SYMBOL : [%+=¬°±µ·×÷‰′″\u0220-\u022F] ; // Excludes math chars that also have general uses, eg. the set [-*/]
fragment CURRENCY_SYMBOL : [¤$£¥¢] ; // Others will be added later
fragment DOMAIN_SYMBOL : [§©®] ;

fragment WORD_CHAR : (
    LETTER
  | GENERAL_SYMBOL
  | TYPOGRAPHIC_SYMBOL
  | MATH_SYMBOL
  | CURRENCY_SYMBOL
  | DOMAIN_SYMBOL
) ;

// These allow reserved operator symbols to be used in ordinary sentences.
// This set of characters must be mutually exclusive with WORD_CHAR, or the lexer will exhibit undesirable behaviour.
// Includes: associations, decimal point, 'true'/'false'
// Excludes: comments, numbers, strings, maps, blocks, parameters, sentence def chars (`:` and `|`)
fragment RESERVED_CHAR : [\-<>.ft] ;

// Comment-only characters
fragment COMMENT_PERMITTED_CHAR : [\u2500-\u257F] ; // \u2500-\u257F are the box-drawing characters

// Strings - special case
fragment STRING_QUOTE : ["] ;
fragment STRING_CHAR : ~["] ;
fragment STRING_ESCAPE : '\\' . ;

/* Tokens
-------------------------------------------------- */

/* Comments
-------------------- */

OPEN_COMMENT_LINE : '#' ;
OPEN_COMMENT_BLOCK : '#{' ;
CLOSE_COMMENT_BLOCK : '}#' ;

/* Spaces
-------------------- */

SPACE : SPACE_CHAR+ ;
NEWLINE : NEWLINE_CHAR ;

/* Primitive Literal Components
-------------------- */

// Numbers (and indexes for Parameters)
INT_LITERAL : DIGIT+ ;
DECIMAL_POINT : '.' ;

// Strings
STRING_LITERAL : STRING_QUOTE (STRING_ESCAPE | STRING_CHAR)* STRING_QUOTE ;

// Logicals
LOGICAL_LITERAL : 'true' | 'false' ;

// Maps
OPEN_MAP : '[' ;
CLOSE_MAP : ']' ;
ASSOCIATION : [<-][-/][->] ;
ELEM_DELIM : ',' ;

// Blocks
CLOSE_BLOCK : '}' ;
OPEN_BLOCK : '{' ;

// Parameters
OPEN_PARAMETER : '@' ;

// Sentences
IS_DEFINED_AS : ':' ;
PLACEHOLDER : '|' ;
WORD : WORD_CHAR+ ;
  // "Unreserved" words are characters that would otherwise be reserved, but
  // did not match any reserved token, so may be used for custom semantics in
  // sentences. Care should always be taken when using "unreserved" characters
  // in Proto code.
UNRESERVED_WORD : RESERVED_CHAR ;

// Comment-only characters
COMMENT_OTHER : COMMENT_PERMITTED_CHAR ;
