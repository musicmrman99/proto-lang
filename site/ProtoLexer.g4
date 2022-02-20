lexer grammar ProtoLexer;

fragment DIGIT : [0-9] ;
fragment STRING_QUOTE : ["] ;
fragment STRING_CHAR : ~["] ;
fragment STRING_ESCAPE : '\\' . ;
fragment WORD_CHAR : [a-zA-Z'_()-] ;

COMMENT_LINE_OPEN : '#' ;
COMMENT_BLOCK_OPEN : '#{' ;
COMMENT_BLOCK_CLOSE : '}#' ;

IS_DEFINED_AS : ':' ;
PLACEHOLDER : '|' ;

NUMBER_LITERAL : DIGIT+ ('.' DIGIT+)? ;
STRING_LITERAL : STRING_QUOTE (STRING_ESCAPE | STRING_CHAR)* STRING_QUOTE ;
LOGICAL_LITERAL : 'true' | 'false' ;

OPEN_MAP : '[' ;
CLOSE_MAP : ']' ;
ELEM_DELIM : ',' ;

OPEN_BLOCK : '{' ;
CLOSE_BLOCK : '}' ;

WORD : WORD_CHAR ((WORD_CHAR | DIGIT)+)? ;

SPACE : (' ' | '\t')+ ;
NEWLINE : ('\r'? '\n' | '\r') ;

PARAMETER_OPEN : '@' -> pushMode(PARAMETER_EXPRESSION) ;
mode PARAMETER_EXPRESSION;
    PARAMETER_INDEX : DIGIT+ -> popMode ;
