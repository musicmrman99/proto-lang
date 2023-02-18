# Proto - A Functional Language for Beginners

This is a **proto**type of language that allows you to build other languages - a **proto**-language (parent language), you could say.

Hence the name.

## Notes on Environment
This project followed much of the advice/ideas in [The ANTLR Mega-Tutorial](https://tomassetti.me/antlr-mega-tutorial/) by Gabriele Tomassetti. That includes ANTLR setup and some shell aliases that are used below for build and test - see the tutorial for details.

## Web Execution Environment

### Building
This is how to build the parser for the execution environment:

In Bash:
```bash
antlr4 -Dlanguage=JavaScript -visitor -no-listener ProtoLexer.g4 -o site/src/lang/build
antlr4 -Dlanguage=JavaScript -visitor -no-listener ProtoParser.g4 -o site/src/lang/build
```

## Test Suite

### Building
This is how to build the parser for the test suite:

In Bash:
```bash
antlr4 -Dlanguage=Java ProtoLexer.g4 -o tests/build/generated
antlr4 -Dlanguage=Java ProtoParser.g4 -o tests/build/generated
javac tests/build/generated/Proto*.java -d tests/build
```

### Running
The test suite is manual - each of these commands should be run in turn and its output checked for correctness.

**Note**: This should be automated at some point. 

In CMD:
```batch
cd tests/build

grun Proto program -gui ../feature/positive/comment.ptl
grun Proto program -gui ../tests/feature/positive/primitive.ptl
grun Proto program -gui ../tests/feature/positive/sentence.ptl
grun Proto program -gui ../tests/feature/positive/map.ptl
grun Proto program -gui ../tests/feature/positive/association.ptl
grun Proto program -gui ../tests/feature/positive/block.ptl
grun Proto program -gui ../tests/feature/positive/parameter.ptl

grun Proto program -gui ../tests/feature/negative/map.ptl
grun Proto program -gui ../tests/feature/negative/association.ptl
grun Proto program -gui ../tests/feature/negative/parameter.ptl

grun Proto program -gui ../tests/integration/positive/comment.ptl
grun Proto program -gui ../tests/integration/positive/sentence.ptl
grun Proto program -gui ../tests/integration/positive/map.ptl
grun Proto program -gui ../tests/integration/positive/block.ptl
grun Proto program -gui ../tests/integration/positive/parameter.ptl

grun Proto program -gui ../tests/integration/negative/association.ptl
```
