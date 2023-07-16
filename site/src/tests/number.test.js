import mock from "./utils/mock";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

const zeroAst             = mock.repr.ast.block([mock.repr.ast.number(0).with(defaultMods)], [], []).with(defaultMods);
const multiDigitNumberAst = mock.repr.ast.block([mock.repr.ast.number(1563).with(defaultMods)], [], []).with(defaultMods);
const oneDpNumberAst      = mock.repr.ast.block([mock.repr.ast.number(156.3).with(defaultMods)], [], []).with(defaultMods);
const multiDpNumberAst    = mock.repr.ast.block([mock.repr.ast.number(156.3623).with(defaultMods)], [], []).with(defaultMods);

const zero             = mock.repr.runtime.number(0).with(defaultMods);
const multiDigitNumber = mock.repr.runtime.number(1563).with(defaultMods);
const oneDpNumber      = mock.repr.runtime.number(156.3).with(defaultMods);
const multiDpNumber    = mock.repr.runtime.number(156.3623).with(defaultMods);

runTestGroup([
    ['creates the number zero',      ['0'],        zeroAst, zero],
    ['creates an integer number',    ['1563'],     multiDigitNumberAst, multiDigitNumber],
    ['creates a real number (1dp)',  ['156.3'],    oneDpNumberAst, oneDpNumber],
    ['creates a real number (>1dp)', ['156.3623'], multiDpNumberAst, multiDpNumber]
]);

/*
 * Test:
 * - Non-normative encodings, eg. exponents, omitting the whole part of a real number, etc.
 */
