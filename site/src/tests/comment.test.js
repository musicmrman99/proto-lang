import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it('produces a valid program with only an empty line comment', () => pipeline()
    .build(mock.proto.code("#"))
    .verifyAst(
        mock.repr.ast.block([], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        null
    )
    .pass()
);
