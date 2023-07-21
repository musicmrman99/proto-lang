import mock from "./utils/mock";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

// AST and runtime constants - Numbers
const zeroAst         = mock.repr.ast.number(0).with(defaultMods);
const oneAst          = mock.repr.ast.number(1).with(defaultMods);
const largeIntegerAst = mock.repr.ast.number(1563).with(defaultMods);
const singleDpRealAst = mock.repr.ast.number(156.3).with(defaultMods);
const multiDpRealAst  = mock.repr.ast.number(156.362).with(defaultMods);

const smallIntegerAst = mock.repr.ast.number(12).with(defaultMods);
const smallRealAst    = mock.repr.ast.number(0.7).with(defaultMods);

const zero         = mock.repr.runtime.number(0).with(defaultMods);
const one          = mock.repr.runtime.number(1).with(defaultMods);
const largeInteger = mock.repr.runtime.number(1563).with(defaultMods);
const singleDpReal = mock.repr.runtime.number(156.3).with(defaultMods);
const multiDpReal  = mock.repr.runtime.number(156.362).with(defaultMods);

// AST and runtime constants - dependent Declarations
const dotBeforeDeclCode          = '.| : 0';
const dotAfterDeclCode           = '|. : 1';
const underscroreBetweenDeclCode = '|_| : 0';
const scientificNotationDeclCode = '|e| : 0';

const dotBeforeDecl          = mock.repr.ast.declarationFromCode(dotBeforeDeclCode, defaultMods);
const dotAfterDecl           = mock.repr.ast.declarationFromCode(dotAfterDeclCode, defaultMods);
const underscroreBetweenDecl = mock.repr.ast.declarationFromCode(underscroreBetweenDeclCode, defaultMods);
const scientificNotationDecl = mock.repr.ast.declarationFromCode(scientificNotationDeclCode, defaultMods);

const defaultDeclsCode = [
    dotBeforeDeclCode,
    dotAfterDeclCode,
    underscroreBetweenDeclCode,
    scientificNotationDeclCode
];

const defaultDecls = [
    dotBeforeDecl,
    dotAfterDecl,
    underscroreBetweenDecl,
    scientificNotationDecl
];

// Util to glue together Numbers and Declarations
// Assumes that declarations work
const rootBlock = (children, decls = null) => {
    if (decls == null) decls = [];
    if (children == null) children = [];
    if (!Array.isArray(decls)) decls = [decls];
    if (!Array.isArray(children)) children = [children];

    return mock.repr.ast.block(decls.concat(children), decls, []).with(defaultMods);
}

// Tests
runTestGroup({
    'basics': {
        'integers': [
            ['creates the number zero',      ['0'],       rootBlock(zeroAst), zero],
            ['creates an integer number',    ['1563'],    rootBlock(largeIntegerAst), largeInteger]
        ],
        'reals': [
            ['creates a real number (1dp)',  ['156.3'],   rootBlock(singleDpRealAst), singleDpReal],
            ['creates a real number (>1dp)', ['156.362'], rootBlock(multiDpRealAst), multiDpReal]
        ]
        // Negatives are not part of the 'number' feature, as negation is an operator, not a piece of syntax
    },

    'presence and omission': [
        // Integration: declaration, sentence
        // This integration is to test that these constructs are interpreted in the expected way,
        // not just to test that they fail.
        ['considers dot part of a sentence if whole part is omitted',               [...defaultDeclsCode, '.1563' ],
            rootBlock(mock.repr.ast.sentence(dotBeforeDecl, [largeIntegerAst]).with(defaultMods), defaultDecls), zero],

        ['considers dot part of a sentence if fractional part is omitted',          [...defaultDeclsCode,  '1563.'],
            rootBlock(mock.repr.ast.sentence(dotAfterDecl, [largeIntegerAst]).with(defaultMods), defaultDecls), one],

        ['considers dot part of two nested sentences with a dot at either side',    [...defaultDeclsCode, '.1563.'],
            rootBlock(
                mock.repr.ast.sentence(dotBeforeDecl, [
                    mock.repr.ast.sentence(dotAfterDecl, [largeIntegerAst]).with(defaultMods)
                ]).with(defaultMods),
                defaultDecls
            ),
            zero],

        ['considers underscores part of a sentence (not breaking up long numbers)', [...defaultDeclsCode, '1563_1'],
            rootBlock(
                mock.repr.ast.sentence(underscroreBetweenDecl, [largeIntegerAst, oneAst]).with(defaultMods),
                defaultDecls
            ),
            zero],

        ['considers scientific notation (eg. 1.7e-12) a sentence (not a number)',   [...defaultDeclsCode, '0.7e12'],
            rootBlock(
                mock.repr.ast.sentence(scientificNotationDecl, [smallRealAst, smallIntegerAst]).with(defaultMods),
                defaultDecls
            ),
            zero]
    ]
});
