import commands from "../../lang/commands";
import { configDefault } from "../../lang/config";
import repr from "../../lang/reprs/all";

import MockError from "./mock-error";

import { Trees, Selectors, TraversalConflictPriority } from "../../utils/trees";

const requireArg = (action, mockType, argName, value) => {
    if (value == null) throw new MockError(`'${argName}' must be given when ${action} '${mockType}'`);
}

const requireProtoArg = (inputType, argName, value) => requireArg("mocking an input of type", inputType, argName, value);
const requireCommandArg = (commandName, argName, value) => requireArg("running test command", commandName, argName, value);
const requireMockArg = (mockType, argName, value) => requireArg("mocking a proto item of type", mockType, argName, value);

const mock = Object.freeze({
    proto: Object.freeze({
        code: (...lines) => lines.join("\n"),

        config: (configOverride) => configOverride == null ?
            configDefault :
            Trees.translate(
                [configOverride, configDefault],
                null, // no filter
                Selectors.first,
                {},
                {
                    // Always use the tree with the longest path for each item
                    // (ie. ignore omitted items in earlier trees)
                    conflictPriority: TraversalConflictPriority.NON_LEAF
                }
            )
    }),

    command: Object.freeze({
        build: (config, code) => {
            requireCommandArg("build", "config", config);
            requireCommandArg("build", "code", code);

            return commands.build(config, code);
        },
        run: (ast, input) => {
            requireCommandArg("run", "ast", ast);
            requireCommandArg("run", "input", input);

            return commands.run(ast, input);
        }
    }),

    repr: Object.freeze({
        modifiers: Object.freeze({
            wrap: (repr) => ({
                with: (modifiers) => modifiers.reduce(
                    (accum, modifier) => modifier(accum),
                    repr
                ),
                only: () => repr
            }),

            dataOnly: (repr) => {
                // Methods are not important in most (all?) tests
                return JSON.parse(JSON.stringify(repr));
            },
            noIdentity: (repr) => {
                delete repr.id; // IDs are not important in some tests
                return repr;
            }
        }),

        ast: Object.freeze({
            number: (value) => {
                requireMockArg("Number", "value", value);
                return mock.repr.modifiers.wrap(new repr.Number(value));
            },
            text: (value) => {
                requireMockArg("Text", "value", value);
                return mock.repr.modifiers.wrap(new repr.Text(value));
            },
            logical: (value) => {
                requireMockArg("Logical", "value", value);
                return mock.repr.modifiers.wrap(new repr.Logical(value));
            },
            map: (children, associations) => {
                requireMockArg("Map", "children", children);
                requireMockArg("Map", "associations", associations);

                const node = new repr.Map();
                node.children = children;
                if (node.children == null) node.children = [];
                node.children.forEach((child) => {
                    if (repr.Repr.is(repr.Nestable, child)) {
                        child.parent = node
                    }
                });
                node.associations = associations;
                return mock.repr.modifiers.wrap(node);
            },
            block: (children, decls, reqEncDecls) => {
                requireMockArg("Block", "children", children);
                requireMockArg("Block", "decls", decls);
                requireMockArg("Block", "reqEncDecls", reqEncDecls);

                const node = new repr.Block();
                node.children = children;
                if (node.children == null) node.children = [];
                node.children.forEach((child) => {
                    if (repr.Repr.is(repr.Nestable, child)) {
                        child.parent = node
                    }
                });
                node.decls = decls;
                node.reqEncDecls = reqEncDecls;
                return mock.repr.modifiers.wrap(node);
            },

            sentenceFragment: (content) => {
                requireMockArg("SentenceFragment", "content", content);
                return mock.repr.modifiers.wrap(new repr.SentenceFragment(content));
            },
            placeholder: () => {
                return mock.repr.modifiers.wrap(new repr.PlaceholderOperator());
            },
            declaration: (template, value) => {
                requireMockArg("Declaration", "template", template);
                requireMockArg("Declaration", "value", value);

                return mock.repr.modifiers.wrap(new repr.Declaration(template, value));
            },
            sentence: (decl, params) => {
                requireMockArg("Sentence", "decl", decl);
                requireMockArg("Sentence", "params", params);

                return mock.repr.modifiers.wrap(new repr.Sentence(decl, params));
            },

            common: Object.freeze({
                blockWithInitialDecls: (children, decls, reqEncDecls) => {
                    requireMockArg("Block", "children", children);
                    requireMockArg("Block", "decls", decls);
                    requireMockArg("Block", "reqEncDecls", reqEncDecls);
    
                    return mock.repr.ast.block(decls.concat(children), decls, reqEncDecls);
                },

                sentenceTemplate: (templateStr, mods) => {
                    requireMockArg("SentenceTemplate", "templateStr", templateStr);
                    requireMockArg("SentenceTemplate", "mods", mods);
    
                    if (templateStr.length === 0) return [];
                    if (!templateStr.includes("|")) {
                        return [mock.repr.ast.sentenceFragment(templateStr).with(mods)];
                    }
                    return templateStr
                        .split("|")
                        .flatMap((fragment) =>
                            (fragment.length > 0 ?
                                [mock.repr.ast.sentenceFragment(fragment).with(mods)] :
                                []
                            )
                                .concat([mock.repr.ast.placeholder().with(mods)])
                        )
                        .slice(0, -1);
                },
                declarationFromCode: (declCode, mods) => {
                    requireMockArg("Declaration", "declCode", declCode);
                    requireMockArg("SentenceTemplate", "mods", mods);
    
                    const [templateStr, number] = declCode.split(' : ');
                    return mock.repr.ast.declaration(
                        mock.repr.ast.common.sentenceTemplate(templateStr, mods),
                        mock.repr.ast.number(parseFloat(number)).with(mods)
                    ).with(mods);
                }
            })
        }),

        runtime: {
            number: (number) => {
                requireMockArg("RuntimeNumber", "number", number);
                return mock.repr.modifiers.wrap(new repr.RuntimeNumber(new repr.Number(number)));
            },
            text: (text) => {
                requireMockArg("RuntimeText", "text", text);
                return mock.repr.modifiers.wrap(new repr.RuntimeText(new repr.Text(text)));
            },
            logical: (logical) => {
                requireMockArg("RuntimeLogical", "logical", logical);
                return mock.repr.modifiers.wrap(new repr.RuntimeLogical(new repr.Logical(logical)));
            }
        }
    })
});
export default mock;
