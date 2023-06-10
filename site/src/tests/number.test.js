import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it('creates a number', () => pipeline()
    .build(mock.proto.code("0"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.number(0).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(({targetAst}) =>
        mock.repr.runtime.number(targetAst.children[0]).with(defaultMods)
    )
    .success()
);
