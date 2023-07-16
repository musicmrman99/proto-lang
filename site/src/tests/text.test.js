import mock from "./utils/mock";
import { runTestGroup } from "./utils/group";

const defaultMods = [
    mock.repr.modifiers.noIdentity,
    mock.repr.modifiers.dataOnly
];

const emptyTextAst = mock.repr.ast.block([mock.repr.ast.text("").with(defaultMods)], [], []).with(defaultMods);
const nonEmptyTextAst = mock.repr.ast.block([mock.repr.ast.text("hello").with(defaultMods)], [], []).with(defaultMods);

const emptyText = mock.repr.runtime.text("").with(defaultMods);
const nonEmptyText = mock.repr.runtime.text("hello").with(defaultMods);

runTestGroup([
    ['creates some empty text',     ['""'],      emptyTextAst, emptyText],
    ['creates some non-empty text', ['"hello"'], nonEmptyTextAst, nonEmptyText]
]);

/*
 * Test:
 * - Numeric characters (and dot/underscore/'e')
 * - Control characters (ascii 0-31)
 * - Unicode characters (unicode 128-255 + other unicode)
 */
