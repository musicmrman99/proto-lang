import mock from "./utils/mock";
import { BUILD_ERROR } from "./utils/pipeline";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

const nullAst = mock.repr.ast.block([], [], []).with(defaultMods);
const oneAst = mock.repr.ast.block([mock.repr.ast.number(1).with(defaultMods)], [], []).with(defaultMods);
const one = mock.repr.runtime.number(1).with(defaultMods);

runTestGroup({
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
            'recursive parse': [
                ['ignores open-block-comment tokens inside of block comments', ['#{#{}#}#'], BUILD_ERROR]
            ],

            'literals': [
                ['ignores number literals in a block comment',         ['#{ hi 5, we like you }#'],        nullAst, null],
                ['ignores decimal number literals in a block comment', ['#{ hi, 5.4 you, we like you }#'], nullAst, null],
                ['ignores text literals in a block comment',           ['#{ hi "friend", we like you }#'], nullAst, null],
                ['ignores logical literals in a block comment',        ['#{ hi true and false, yo }#'],    nullAst, null],
                ['ignores map literals in a block comment',            ['#{ hi [5], we like you }#'],      nullAst, null],
                ['ignores block literals in a block comment',          ['#{ hi {5}, we like you }#'],      nullAst, null],
                ['ignores line comments in a block comment',           ['#{ hi #friend, we like you }#'],  nullAst, null]
            ]
        }

        // TODO: Spacing of block comments. These will require either negative tests, or integration with declarations
        //       to know how many spaces were meaningful, and how many were ignored. This will also interact with space
        //       squashing.
    }
});
