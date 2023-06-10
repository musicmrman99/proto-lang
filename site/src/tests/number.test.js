import { expect } from '@jest/globals';
import mock from './utils/mock';

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

it('creates a number', () => {
    const ast = mock.command.build(
        mock.proto.config(),
        mock.proto.code(
            "0"
        )
    );

    const targetAst = mock.repr.ast.block([mock.repr.ast.number(0).with(defaultMods)], [], []).with(defaultMods);
    expect(ast).toMatchObject(targetAst);
    
    const targetValue = mock.repr.runtime.number(targetAst.children[0]).with(defaultMods);
    expect(mock.command.run(ast, "")).toMatchObject(targetValue);
});
