import mock from "./utils/mock";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

// AST and runtime constants - Text
const emptyTextAst = mock.repr.ast.text("").with(defaultMods);
const nonEmptyTextAst = mock.repr.ast.text("hello").with(defaultMods);
const newlineTextAst = mock.repr.ast.text("\n").with(defaultMods);
const noEscapesTextAst = mock.repr.ast.text("Insert a \\n here").with(defaultMods);

const numberLiteralTextAst = mock.repr.ast.text("hi 5, we like you").with(defaultMods);
const realNumberLiteralTextAst = mock.repr.ast.text("hi 5.4 you, we like you").with(defaultMods);
const logicalLiteralTextAst = mock.repr.ast.text("hi true and false, yo").with(defaultMods);
const mapLiteralTextAst = mock.repr.ast.text("hi [5], we like you").with(defaultMods);
const blockLiteralTextAst = mock.repr.ast.text("hi {5}, we like you").with(defaultMods);
const lineCommentTextAst = mock.repr.ast.text("hi #friend, we like you").with(defaultMods);
const blockCommentTextAst = mock.repr.ast.text("hi #{friend}#, we like you").with(defaultMods);

const emptyText = mock.repr.runtime.text("").with(defaultMods);
const nonEmptyText = mock.repr.runtime.text("hello").with(defaultMods);
const newlineText = mock.repr.runtime.text("\n").with(defaultMods);
const noEscapesText = mock.repr.runtime.text("Insert a \\n here").with(defaultMods);
const successText = mock.repr.runtime.text("success").with(defaultMods);
const successLeftText = mock.repr.runtime.text("success-left").with(defaultMods);
const successRightText = mock.repr.runtime.text("success-right").with(defaultMods);

const numberLiteralText = mock.repr.runtime.text("hi 5, we like you").with(defaultMods);
const realNumberLiteralText = mock.repr.runtime.text("hi 5.4 you, we like you").with(defaultMods);
const logicalLiteralText = mock.repr.runtime.text("hi true and false, yo").with(defaultMods);
const mapLiteralText = mock.repr.runtime.text("hi [5], we like you").with(defaultMods);
const blockLiteralText = mock.repr.runtime.text("hi {5}, we like you").with(defaultMods);
const lineCommentText = mock.repr.runtime.text("hi #friend, we like you").with(defaultMods);
const blockCommentText = mock.repr.runtime.text("hi #{friend}#, we like you").with(defaultMods);

// AST and runtime constants - dependent Declarations
const declarationFromCode = (declCode, mods) => {
    const [templateStr, text] = declCode.split(' : ');
    return mock.repr.ast.declaration(
        mock.repr.ast.common.sentenceTemplate(templateStr, mods),
        mock.repr.ast.text(text.slice(1, -1)).with(mods)
    ).with(mods);
};

const adjacentLeftDeclCode = 'adjacent| : "success-left"';
const adjacentRightDeclCode = '|adjacent : "success-right"';
const adjacentDeclCode = '|adjacent| : "success"';

const adjacentLeftDecl = declarationFromCode(adjacentLeftDeclCode, defaultMods);
const adjacentRightDecl = declarationFromCode(adjacentRightDeclCode, defaultMods);
const adjacentDecl = declarationFromCode(adjacentDeclCode, defaultMods);

const defaultDeclsCode = [
    adjacentLeftDeclCode,
    adjacentRightDeclCode,
    adjacentDeclCode
];

const defaultDecls = [
    adjacentLeftDecl,
    adjacentRightDecl,
    adjacentDecl
];

// Util
const block = (child) => mock.repr.ast.block([child], [], []).with(defaultMods);

runTestGroup({
    'basics': [
        ['creates some empty text',     ['""'],      block(emptyTextAst), emptyText],
        ['creates some non-empty text', ['"hello"'], block(nonEmptyTextAst), nonEmptyText]
    ],

    'scope': [
        ['has no effect before the text', [...defaultDeclsCode,   'adjacent""'],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(adjacentLeftDecl, [emptyTextAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            successLeftText],

        ['has no effect after the text',  [...defaultDeclsCode, '""adjacent'  ],
            mock.repr.ast.common.blockWithInitialDecls(
                mock.repr.ast.sentence(adjacentRightDecl, [emptyTextAst]).with(defaultMods),
                defaultDecls, []
            ).with(defaultMods),
            successRightText],

        ['lasts across multiple lines', ['"', '"'], block(newlineTextAst), newlineText],
    ],

    'allowed content': {
        'recursive parse': [
            ['creates two adjacent strings (rather than nesting them)', [...defaultDeclsCode, '"hello"adjacent"hello"'],
                mock.repr.ast.common.blockWithInitialDecls(
                    mock.repr.ast.sentence(adjacentDecl, [nonEmptyTextAst, nonEmptyTextAst]).with(defaultMods),
                    defaultDecls, []
                ).with(defaultMods),
                successText],

            ['ignores backslashes in text (they are not escape sequences)', ['"Insert a \\n here"'],
                mock.repr.ast.block([noEscapesTextAst], [], []).with(defaultMods),
                noEscapesText]
        ],

        'literals': [
            ['includes number literals in text',      ['"hi 5, we like you"'],          block(numberLiteralTextAst), numberLiteralText],
            ['includes real number literals in text', ['"hi 5.4 you, we like you"'],    block(realNumberLiteralTextAst), realNumberLiteralText],
            ['includes logical literals in text',     ['"hi true and false, yo"'],      block(logicalLiteralTextAst), logicalLiteralText],
            ['includes map literals in text',         ['"hi [5], we like you"'],        block(mapLiteralTextAst), mapLiteralText],
            ['includes block literals in text',       ['"hi {5}, we like you"'],        block(blockLiteralTextAst), blockLiteralText],
            ['includes line comments in text',        ['"hi #friend, we like you"'],    block(lineCommentTextAst), lineCommentText],
            ['includes block comments in text',       ['"hi #{friend}#, we like you"'], block(blockCommentTextAst), blockCommentText]
        ]
    }
});

/*
 * Test:
 * - Control characters (ascii 0-31)
 * - Unicode characters (unicode 128-255 + other unicode)
 */
