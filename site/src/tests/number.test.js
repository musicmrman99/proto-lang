import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it('creates the number zero', () => pipeline()
    .build(mock.proto.code("0"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.number(0).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.number(0).with(defaultMods)
    )
    .pass()
);

it('creates an integer number', () => pipeline()
    .build(mock.proto.code("1563"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.number(1563).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.number(1563).with(defaultMods)
    )
    .pass()
);

it('creates a real number (1dp)', () => pipeline()
    .build(mock.proto.code("156.3"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.number(156.3).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.number(156.3).with(defaultMods)
    )
    .pass()
);

it('creates a real number (>1dp)', () => pipeline()
    .build(mock.proto.code("156.3623"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.number(156.3623).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.number(156.3623).with(defaultMods)
    )
    .pass()
);

/*
 * Test:
 * - Non-normative encodings, eg. exponents, omitting the whole part of a real number, etc.
 */
