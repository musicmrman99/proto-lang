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
const declarationFromCode = (declCode, mods) => {
    const [templateStr, number] = declCode.split(' : ');
    return mock.repr.ast.declaration(
        mock.repr.ast.common.sentenceTemplate(templateStr, mods),
        mock.repr.ast.number(parseFloat(number)).with(mods)
    ).with(mods);
};

const dotBeforeDeclCode          = '.| : 0';
const dotAfterDeclCode           = '|. : 1';
const underscroreBetweenDeclCode = '|_| : 0';
const scientificNotationDeclCode = '|e| : 0';

const dotBeforeDecl          = declarationFromCode(dotBeforeDeclCode, defaultMods);
const dotAfterDecl           = declarationFromCode(dotAfterDeclCode, defaultMods);
const underscroreBetweenDecl = declarationFromCode(underscroreBetweenDeclCode, defaultMods);
const scientificNotationDecl = declarationFromCode(scientificNotationDeclCode, defaultMods);

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

// Tests
runTestGroup({
    'basics': {
        'integers': [
            ['creates the number zero',      ['0'],
                mock.repr.ast.block([zeroAst], [], []).with(defaultMods),
                zero],

            ['creates an integer number',    ['1563'],
                mock.repr.ast.block([largeIntegerAst], [], []).with(defaultMods),
                largeInteger]
        ],

        'reals': [
            ['creates a real number (1dp)',  ['156.3'],
                mock.repr.ast.block([singleDpRealAst], [], []).with(defaultMods),
                singleDpReal],

            ['creates a real number (>1dp)', ['156.362'],
                mock.repr.ast.block([multiDpRealAst], [], []).with(defaultMods),
                multiDpReal]
        ]

        // Negatives are not part of the 'number' feature, as negation is an operator, not a piece of syntax
    },

    'presence and omission': [
        // Integration: declaration, sentence
        // This integration is to test that these constructs are interpreted in the expected way,
        // not just to test that they fail.
        ['considers dot part of a sentence if whole part is omitted',               [...defaultDeclsCode, '.1563' ],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(dotBeforeDecl, [largeIntegerAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            zero],

        ['considers dot part of a sentence if fractional part is omitted',          [...defaultDeclsCode,  '1563.'],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(dotAfterDecl, [largeIntegerAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            one],

        ['considers dot part of two nested sentences with a dot at either side',    [...defaultDeclsCode, '.1563.'],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(dotBeforeDecl, [
                    mock.repr.ast.sentence(dotAfterDecl, [largeIntegerAst]).with(defaultMods)
                ]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            zero],

        ['considers underscores part of a sentence (not breaking up long numbers)', [...defaultDeclsCode, '1563_1'],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(underscroreBetweenDecl, [largeIntegerAst, oneAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            zero],

        ['considers scientific notation (eg. 1.7e-12) a sentence (not a number)',   [...defaultDeclsCode, '0.7e12'],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(scientificNotationDecl, [smallRealAst, smallIntegerAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            zero]
    ]
});
