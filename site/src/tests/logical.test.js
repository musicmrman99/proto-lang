import mock from "./utils/mock";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

const trueAst = mock.repr.ast.block([mock.repr.ast.logical(true).with(defaultMods)], [], []).with(defaultMods);
const falseAst = mock.repr.ast.block([mock.repr.ast.logical(false).with(defaultMods)], [], []).with(defaultMods);
const trueValue = mock.repr.runtime.logical(true).with(defaultMods);
const falseValue = mock.repr.runtime.logical(false).with(defaultMods);

runTestGroup([
    ['creates a logical true value', ['true'], trueAst, trueValue],
    ['creates a logical false value', ['false'], falseAst, falseValue]
]);
