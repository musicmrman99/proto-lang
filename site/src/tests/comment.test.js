import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

import isObject from "../utils/is-object";

function flattenTests(tests, context='') {
    if (isObject(tests)) {
        return Object.entries(tests).flatMap(
            ([groupName, groupContent]) => flattenTests(groupContent, context+groupName+' / ')
        );
    } else {
        return tests.map(
            ([testName, ...testArgs]) => [context+testName, ...testArgs]
        );
    }
}

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

const nullAst = mock.repr.ast.block([], [], []).with(defaultMods);
const oneAst = mock.repr.ast.block([mock.repr.runtime.number(1).with(defaultMods)], [], []).with(defaultMods);
const one = mock.repr.runtime.number(1).with(defaultMods);

const tests = {
    'line comment': {
        'basics': [
            ['works at all',     ["#"],   nullAst, null],
            ['can contain text', ["#hi"], nullAst, null]
        ],

        'scope': [
            // Integration: number
            ['has no effect before the comment character', ['1#'],     oneAst, one],
            ['has no effect after the end of the line',    ['#', '1'], oneAst, one]
        ],

        'allowed content': {
            'recursive parse': [
                ['ignores other line comment characters', ['#hi#there'], nullAst, null]
            ],

            'literals': [
                ['ignores number literals in a line comment',         ['# hi 5, we like you'],        nullAst, null],
                ['ignores decimal number literals in a line comment', ['# hi, 5.4 you, we like you'], nullAst, null],
                ['ignores text literals in a line comment',           ['# hi "friend", we like you'], nullAst, null],
                ['ignores logical literals in a line comment',        ['# hi true and false, yo'],    nullAst, null],
                ['ignores map literals in a line comment',            ['# hi [5], we like you'],      nullAst, null],
                ['ignores block literals in a line comment',          ['# hi {5}, we like you'],      nullAst, null]
            ]
        },

        'spacing': [
            [0, 0, 0, 0, 0, [   "#"   ]],
            [0, 0, 1, 0, 0, [   "# "  ]],
            [0, 1, 0, 0, 0, [  " #"   ]],
            [0, 1, 1, 0, 0, [  " # "  ]],
            [0, 1, 3, 0, 0, [  " #   "]],
            [0, 3, 1, 0, 0, ["   # "  ]],
            [0, 3, 3, 0, 0, ["   #   "]],

            [1, 0, 0, 0, 0, [   "#hi"   ]],
            [1, 0, 1, 0, 0, [  "# hi"   ]],
            [1, 0, 3, 0, 0, ["#   hi"   ]],
            [1, 0, 0, 1, 0, [   "#hi "  ]],
            [1, 0, 1, 1, 0, [  "# hi "  ]],
            [1, 0, 3, 1, 0, ["#   hi "  ]],
            [1, 0, 0, 3, 0, [   "#hi   "]],
            [1, 0, 1, 3, 0, [  "# hi   "]],
            [1, 0, 3, 3, 0, ["#   hi   "]],

            [2, 0, 0, 1, 0, [   "#hi there"   ]],
            [2, 0, 1, 1, 0, [  "# hi there"   ]],
            [2, 0, 3, 1, 0, ["#   hi there"   ]],
            [2, 0, 0, 1, 3, [   "#hi there   "]],
            [2, 0, 1, 1, 3, [  "# hi there   "]],
            [2, 0, 3, 1, 3, ["#   hi there   "]],
            [2, 0, 0, 3, 0, [   "#hi   there"   ]],
            [2, 0, 1, 3, 0, [  "# hi   there"   ]],
            [2, 0, 3, 3, 0, ["#   hi   there"   ]],
            [2, 0, 0, 3, 3, [   "#hi   there   "]],
            [2, 0, 1, 3, 3, [  "# hi   there   "]],
            [2, 0, 3, 3, 3, ["#   hi   there   "]]
        ].map(
            ([words, beforeComment, afterComment, betweenWords, afterWords, code]) => [
                `${words} words, space(s): `+
                `${beforeComment} before "#", ${afterComment} after "#", `+
                `${betweenWords} between words, ${afterWords} after words`,

                code,
                nullAst,
                null
            ]
        )
    },

    'block comment': {
        'basics': [
            ['works at all',     ["#{}#"],   nullAst, null],
            ['can contain text', ["#{hi}#"], nullAst, null]
        ],

        'scope': [
            // Integration: number
            ['has no effect before the comment',             ['1#{}#'],     oneAst, one],
            ['has no effect after the comment',              ['#{}#1'],     oneAst, one],
            ['has no effect on the line before the comment', ['1', '#{}#'], oneAst, one],
            ['has no effect on the line after the comment',  ['#{}#', '1'], oneAst, one],

            ['lasts across multiple lines', ['#{', '}#'], nullAst, null]
        ],

        'allowed content': {
            // Recursive parse is a negative test - see below

            'literals': [
                ['ignores number literals in a line comment',         ['#{ hi 5, we like you }#'],        nullAst, null],
                ['ignores decimal number literals in a line comment', ['#{ hi, 5.4 you, we like you }#'], nullAst, null],
                ['ignores text literals in a line comment',           ['#{ hi "friend", we like you }#'], nullAst, null],
                ['ignores logical literals in a line comment',        ['#{ hi true and false, yo }#'],    nullAst, null],
                ['ignores map literals in a line comment',            ['#{ hi [5], we like you }#'],      nullAst, null],
                ['ignores block literals in a line comment',          ['#{ hi {5}, we like you }#'],      nullAst, null]
            ]
        }

        // TODO: Spacing of block comments. These will require either negative tests, or integration with declarations
        //       to know how many spaces were meaningful, and how many were ignored. This will also interact with space
        //       squashing.
    }
};

it.each(flattenTests(tests))('%s', (_, code, expectedAst, expectedValue) => pipeline()
    .build(mock.proto.code(...code))
    .verifyAst(expectedAst)
    .run()
    .verifyResult(expectedValue)
    .pass()
);

/* Negative tests
-------------------- */

it('ignores open-block-comment tokens inside of block comments', () => pipeline()
    .build(mock.proto.code('#{#{}#}#'))
    .verifyFailed()
    .pass()
)
