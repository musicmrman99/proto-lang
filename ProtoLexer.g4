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

// "uncomposed reserved" characters being separate from WORD_CHAR forces the lexer to stop
// just before one of these characters and begin lexing a new token (due to the rules below),
// which could be a reserved word.
// If these characters do not match any reserved word token, then a token considered equivalent 
//to an ordinary WORD token will consume them so that they may be used for custom semantics in
// sentences.
// WARNING: This set of characters must be mutually exclusive with WORD_CHAR, or the lexer will
//          exhibit undesirable behaviour.
// Included in parser: decimal point
// Includes: associations, 'true'/'false', 'using'
// Excludes: comments, numbers, text, maps, blocks, parameters, sentence def chars (`:` and `|`)
fragment UNCOMPOSED_RESERVED_CHAR : [\-<>ftu] ;

// Comment-only characters
fragment COMMENT_PERMITTED_CHAR : [\u2500-\u257F] ; // \u2500-\u257F are the box-drawing characters

// Text - special case
fragment TEXT_QUOTE : ["] ;
fragment TEXT_CHAR : ~["] ;

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

/* Values (Literals and Syntactic Expressions)
-------------------- */

// Numbers (and indexes for Parameters)
INT_LITERAL : DIGIT+ ;
DECIMAL_POINT : '.' ;

// Text
TEXT_LITERAL : TEXT_QUOTE TEXT_CHAR* TEXT_QUOTE ;

// Logicals
LOGICAL_LITERAL : 'true' | 'false' ;

// Maps
OPEN_MAP : '[' ;
CLOSE_MAP : ']' ;
MAP_SEPARATOR : ',' ;
MAP_ASSOCIATION : [<-][->] ;

// Blocks
CLOSE_BLOCK : '}' ;
OPEN_BLOCK : '{' ;

// Parameters
OPEN_PARAMETER : '@' ;

/* Sentences and Using
-------------------- */

// Using
// Using is treated somewhat similarly to the sentence template 'using |'
// to determine what it applies to.
OPEN_USING : 'using ' ;

// Sentences
IS_DEFINED_AS : ':' ;
PLACEHOLDER : '|' ;
WORD : WORD_CHAR+ ;
UNCOMPOSED_RESERVED_WORD : UNCOMPOSED_RESERVED_CHAR ;

// Comment-only characters
COMMENT_OTHER : COMMENT_PERMITTED_CHAR ;
