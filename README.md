# Proto - A Functional Language for Beginners

This is a **proto**type of language that allows you to build other languages - a **proto**-language (parent language), you could say.

Hence the name.

## Notes on Environment
This project followed much of the advice/ideas in [The ANTLR Mega-Tutorial](https://tomassetti.me/antlr-mega-tutorial/) by Gabriele Tomassetti. That includes ANTLR setup and some shell aliases that are used below for build and test - see the tutorial for details.

## Build
cd site
antlr4 -Dlanguage=Java ProtoLexer.g4 -o test
antlr4 -Dlanguage=Java ProtoParser.g4 -o test
javac test/Proto*.java -d test/build

## Test
cd site/test/build
grun Proto program -gui ../../tests/primitives.ptl
grun Proto program -gui ../../tests/sentence.ptl
grun Proto program -gui ../../tests/map.ptl
