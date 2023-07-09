import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it("creates a logical 'true' value", () => pipeline()
    .build(mock.proto.code("true"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.logical(true).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.logical(true).with(defaultMods)
    )
    .pass()
);

it("creates a logical 'false' value", () => pipeline()
    .build(mock.proto.code("false"))
    .verifyAst(
        mock.repr.ast.block([mock.repr.ast.logical(false).with(defaultMods)], [], []).with(defaultMods)
    )
    .run()
    .verifyResult(
        mock.repr.runtime.logical(false).with(defaultMods)
    )
    .pass()
);
