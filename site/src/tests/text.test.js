import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it('creates some empty text', () => pipeline()
    .build(mock.proto.code("\"\""))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.text("").with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(({targetAst}) =>
        mock.repr.runtime.text(targetAst.children[0]).with(defaultMods)
    )
    .pass()
);

it('creates some non-empty text', () => pipeline()
    .build(mock.proto.code("\"hello\""))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.text("hello").with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(({targetAst}) =>
        mock.repr.runtime.text(targetAst.children[0]).with(defaultMods)
    )
    .pass()
);

/*
 * Test:
 * - Numeric characters (and dot/underscore/'e')
 * - Control characters
 * - Unicode characters
 */
