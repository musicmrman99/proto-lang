import { v4 as uuidv4 } from 'uuid';
import BuildError from '../utils/BuildError';
import RuntimeError from '../utils/RuntimeError';

/* Util
-------------------------------------------------- */

const _nodesStr = (nodes, join) => {
    if (nodes == null) return "[]";
    return "["+nodes.map(child => {
        if (child == null) return "NULL_NODE";
        return child.toString();
    }).join(join)+"]";
}
export const nodesStr = (nodes) => _nodesStr(nodes, "");
export const nodesStrList = (nodes) => _nodesStr(nodes, ", ");

export const nodeListToString = (nodes) => "NODE_LIST" + nodesStrList(nodes);

/* Representations
-------------------------------------------------- */

export class Repr {
    static Index = class {
        constructor(type) {
            this.index = {};
            this.type = type;
        }

        get = (id) => this.index[id];

        set = (repr) => {
            if (this.type != null && !this.type(repr)) {
                throw new BuildError("Type error: Repr '"+repr.toString()+"' cannot be stored in this index");
            }
            this.index[repr.id] = repr;
        }
        unset = (repr) => delete this.index[repr.id];

        has = (repr) => this.index[repr.id] != null;

        keys = () => Object.keys(this.index);
        values = () => Object.values(this.index);
    }

    static Mapping = class {
        constructor(keyType, valueType) {
            this.mapping = {};
            this.keyType = keyType;
            this.valueType = valueType;
        }

        get = (keyRepr) => Repr.get(this.mapping[keyRepr.id]);

        set = (keyRepr, valueRepr) => {
            if (this.keyType != null && !this.keyType(keyRepr)) {
                throw new BuildError("Type error: Repr '"+keyRepr.toString()+"' cannot be stored as a key in this mapping");
            }
            if (this.valueType != null && !this.valueType(valueRepr)) {
                throw new BuildError("Type error: Repr '"+valueRepr.toString()+"' cannot be stored as a value in this mapping");
            }
            this.mapping[keyRepr.id] = valueRepr.id;
        }
        setAll = (entries) => entries.forEach(([keyRepr, valueRepr]) => this.set(keyRepr, valueRepr));
        mergeIn = (mapping) => Object.assign(this.mapping, mapping.mapping);

        unset = (keyRepr) => delete this.index[keyRepr.id];
        unsetAll = (keyReprs) => keyReprs.forEach((keyRepr) => this.unset(keyRepr));

        hasKey = (keyRepr) => this.index[keyRepr.id] != null;
        hasValue = (valueRepr) => this.values().includes(valueRepr.id);

        keys = () => Object.keys(this.mapping).map(Repr.get);
        values = () => Object.values(this.mapping).map(Repr.get);
        entries = () => Object.entries(this.mapping).map(([key, value]) => [Repr.get(key), Repr.get(value)]);
    }

    static all = new Repr.Index();
    static get = (id) => Repr.all.get(id);

    constructor() {
        this.id = uuidv4();
        Repr.all.set(this);
    }
}
export const isRepr = (node) => node != null && Repr.get(node.id) != null;

/* Intermediate Representations
-------------------- */

export class SentenceFragment extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }

    length = () => this.content.length;
    toString = () => this.content;
}
export const isSentenceFragment = (node) => node != null && node.constructor === SentenceFragment;

export class ExplicitSoftTerminator extends Repr {
    length = () => 0;
    toString = () => "¶";
}
export const isExplicitSoftTerminator = (node) => node != null && node.constructor === ExplicitSoftTerminator;

export class ExplicitHardTerminator extends Repr {
    length = () => 0;
    toString = () => "█";
}
export const isExplicitHardTerminator = (node) => node != null && node.constructor === ExplicitHardTerminator;

export class AssociationOperator extends Repr {
    constructor(relation) {
        super();
        this.relation = relation;
    }

    length = () => 2;
    toString = () => (
        (this.relation.left ? "<" : "-") +
        (this.relation.right ? ">" : "-")
    )

    isDirectedLeft = () => this.relation.left
    isDirectedRight = () => this.relation.right
    isDirected = () => this.isDirectedLeft() || this.isDirectedRight()
    isBidirectional = () => this.isDirectedLeft() && this.isDirectedRight()
    isUnidirectional = () => this.isDirected() && !this.isBidirectional()
    isUndirected = () => !this.isDirected()
}
export const isAssociationOp = (node) => node != null && node.constructor === AssociationOperator;

export class SeparatorOperator extends Repr {
    length = () => 1;
    toString = () => ","
}
export const isSeparatorOp = (node) => node != null && node.constructor === SeparatorOperator;

export class DeclarationOperator extends Repr {
    length = () => 1;
    toString = () => " : "
}
export const isPlaceholderOp = (node) => node != null && node.constructor === PlaceholderOperator;

export class PlaceholderOperator extends Repr {
    length = () => 1;
    toString = () => "|"
}
export const isDeclarationOp = (node) => node != null && node.constructor === DeclarationOperator;

// Used to represent arguments to a sentence template, ie. the
// values (or possibly sub-sentences) that fill in placeholders.
export class Argument extends Repr {
    constructor(children = []) {
        super();
        this.children = children;
    }

    length = () => this.children.length;
    toString = () => (
        "{ ARGUMENT: content: "+nodesStr(this.children)+" }"
    )
}
export const isArgument = (node) => node != null && node.constructor === Argument;

/* Final Representations
-------------------- */

// Association - not needed, because they're put into the containing map

// Sentence + Declaration

export class Sentence extends Repr {
    constructor(decl, params) {
        super();
        this.decl = decl;
        this.params = params;
    }

    length = () => this.parts.reduce((accum, part) => accum + part.length(), 0);
    toString = () => "{ SENTENCE (decl: "+this.decl.toString()+") }";
}
export const isSentence = (node) => node != null && node.constructor === Sentence;

export class Declaration extends Repr {
    constructor(template, sentence) {
        super();
        this.template = template;
        this.sentence = sentence;
    }

    length = () => this.template.map(item => item.length()).reduce((accum, len) => accum + len, 0) + this.sentence.length();
    toString = () => "{ DECLARATION: "+this.template.map(item => item.toString()).join("")+" }";
}
export const isDeclaration = (node) => node != null && node.constructor === Declaration;

// Literals + Parameter

export class Number extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }

    length = () => this.value.toString().length;
    toString = () => this.value.toString();
}
export const isNumber = (node) => node != null && node.constructor === Number;

export class Text extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
    
    length = () => this.value.length + 2; // for the quotes
    toString = () => '"'+this.value.toString()+'"';
}
export const isText = (node) => node != null && node.constructor === Text;

export class Logical extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }

    length = () => this.value.toString().length;
    toString = () => this.value.toString();
}
export const isLogical = (node) => node != null && node.constructor === Logical;

export class Map extends Repr {
    constructor() {
        super();
        this.parent = null;
        this.children = [];
        this.associations = [];
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => "["+this.children.map(child => child.toString()).join(", ")+"]";
}
export const isMap = (node) => node != null && node.constructor === Map;

export class Block extends Repr {
    constructor() {
        super();
        this.parent = null;
        this.children = [];
        this.reqEncDecls = []; // Decls it requires from the enclosing context
        this.decls = [];       // Decls it declares
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => {
        const numDeclarations = this.decls.length;
        const numSentences = this.children.filter(isSentence).length;
        const declarations = numDeclarations === 1 ? numDeclarations+" declaration" : numDeclarations+" declarations";
        const sentences = numSentences === 1 ? numSentences+" sentence" : numSentences+" sentences";
        return `{ BLOCK (${declarations}, ${sentences}) }`;
    };
}
export const isBlock = (node) => node != null && node.constructor === Block;

export const isLiteral = (node) => node != null && (
    [
        Number,
        Text,
        Logical,
        Map,
        Block
    ].includes(node.constructor)
);

export class Parameter extends Repr {
    constructor(index, extraction) {
        super();
        this.index = index;
        this.extraction = extraction;
    }

    length = () => 1 + this.index.toString().length + this.extraction.length();
    toString = () => "@" + this.index.toString() + this.extraction.toString();
}
export const isParameter = (node) => node != null && node.constructor === Parameter;

/* Runtime Representations
-------------------- */

/**
 * The 'map interface' is the conceptual base type of all Proto runtime entities.
 * 
 * The map interface is defined in detail in the Proto spec.
 */
export class MapInterface extends Repr {
    //
}

export class RuntimeNumber extends MapInterface {
    constructor(astNumber) {
        super();
        this.value = astNumber.value;
    }

    // Fake an AST node
    static fromRaw = (number) => new RuntimeNumber({value: +number});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return this.value.toString();
    };
}
export const isRuntimeNumber = (node) => node != null && node.constructor === RuntimeNumber;

export class RuntimeText extends MapInterface {
    constructor(astText) {
        super();
        this.value = astText.value;
    }

    // Fake an AST node
    static fromRaw = (string) => new RuntimeText({value: string.toString()});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `"${this.value}"`;
    };
}
export const isRuntimeText = (node) => node != null && node.constructor === RuntimeText;

export class RuntimeLogical extends MapInterface {
    constructor(astLogical) {
        super();
        this.value = astLogical.value;
    }

    // Fake an AST node
    static fromRaw = (boolean) => new RuntimeNumber({value: !!boolean});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return this.value.toString();
    };
}
export const isRuntimeLogical = (node) => node != null && node.constructor === RuntimeLogical;

export class RuntimeMap extends MapInterface {
    constructor(astMap, children) {
        super();

        this.astMap = astMap;
        this.items = children;
    }

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `{ MAP [ ${this.items.map((item) => item.toString()).join(", ")} ] }`;
    };
}
export const isRuntimeMap = (node) => node != null && node.constructor === RuntimeMap;

export class RuntimeBlock extends MapInterface {
    constructor(astBlock, context) {
        super();

        // Known when the block is created
        this.astBlock = astBlock;
        this.encDecls = new Repr.Mapping(isDeclaration, isRepr);
        if (context != null) { // If not the root of the stack
            astBlock.reqEncDecls.forEach((reqEncDecl) => {
                const value = context.getStackDeclValue(reqEncDecl);
                if (value == null) {
                    // Should never happen, as it should throw a build-time error,
                    // but it may happen in the future if reflection is ever introduced.
                    throw new RuntimeError(
                        `Required enclosing declaration '${reqEncDecl.toString()}' not found in:`+
                        this.getStackTraceStr()
                    );
                }
                this.encDecls.set(reqEncDecl, value);
            });
        }

        // Not known until the block is run (possibly more than once)
        this.parent = null;
        this.args = null;
        this.decls = null;
    }

    /* Block methods
    -------------------- */

    /**
     * Set the runtime block up for execution.
     * 
     * @param {Array<Repr>} args An array of runtime representations to be used as arguments
     *   for this execution of this block.
     */
    setupRun = (parent, args) => {
        this.parent = parent;
        this.args = args;
        this.decls = (new Repr.Mapping(isDeclaration, isRepr));
        this.decls.mergeIn(this.encDecls);
    }

    /**
     * Teardown the execution setup of the block (see setupBlockRun()) after the execution of
     * the block has completed (successfully or otherwise).
     */
    teardownRun = () => {
        this.parent = null;
        this.args = null;
        this.decls = null;
    }

    /**
     * Return the value of the given declaration in all blocks above this block on
     * the stack.
     * 
     * This function is only useful while the block is running (ie. on the stack).
     * 
     * It is most commonly used to get the value of a required enclosing declaration
     * in the context of the creating block (on the stack) when creating a new runtime
     * block (which won't yet be on the stack).
     * 
     * @param {Declaration} decl The declaration to get the value in this block for.
     * @returns The value of the given declaration in this block.
     */
    getStackDeclValue = (decl) => {
        // Base case - search this block's decls, return if found
        const value = this.decls.get(decl);
        if (value != null) return value;

        // Base-case - root block or not running, so nothing left to search
        if (this.parent == null) return null;

        // Recursive case - check parent
        return this.parent.getStackDeclValue(decl);
    }

    /**
     * Return the stack trace of this block as an array of runtime blocks.
     * 
     * This will only contain this block if it's not on the stack.
     * 
     * @returns The stack trace of this block.
     */
    getStackTrace = () => {
        return [
            this,
            ...(this.parent != null ? this.parent.getStackTrace() : [])
        ];
    }

    /**
     * Return the stack trace of this block as a string.
     * 
     * This will only contain this block if it's not on the stack.
     * 
     * @returns The stack trace of this block as a string.
     */
    getStackTraceStr = () => {
        return this.getStackTrace()
            .map((runtimeBlock) => "-> "+runtimeBlock.astBlock.toString())
            .join("\n");
    }

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `{ BLOCK { decls: ${this.decls} } from ${this.astBlock.toString()} }`;
    };
}
export const isRuntimeBlock = (node) => node != null && node.constructor === RuntimeBlock;

/* Composite Utils
-------------------------------------------------- */

/**
 * Checks for nodes that represent value literals.
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is a value node.
 */
export const isValue = (node) => isLiteral(node) || isParameter(node);

/**
 * Checks for nodes that create a new top-level parsing context,
 * and so can contain other nodes.
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node can have other nodes nested in it.
 */
export const isNestable = (node) => isMap(node) || isBlock(node) || isParameter(node);

/**
 * Checks for nodes that can contain declarations.
 * 
 * Note: All nodes that can contain declarations are nestable.
 *       See `isNestable()`.
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node can contain `Declaration` nodes.
 */
export const hasDeclarations = (node) => isNestable(node) && isBlock(node);

/**
 * Checks for nodes that are explicit terminators (ie. nodes whose
 * only function is to terminate sentences).
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is an explicit terminator.
 */
export const isExplicitTerminator = (node) => isExplicitSoftTerminator(node) || isExplicitHardTerminator(node);

/**
 * Checks for nodes that are implicit terminators (ie. nodes whose
 * function is primarily something other than terminating sentences,
 * but either may or must terminate sentences).
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is an implicit terminator.
 */
export const isImplicitTerminator = (node) => isAssociationOp(node) || isSeparatorOp(node);

/**
 * Checks for nodes that can optionally terminate a sentence
 * (including the value of a declaration).
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is a node that must terminate
 *   a sentence.
 */
export const isSoftTerminator = (node) => isExplicitSoftTerminator(node);

/**
 * Checks for nodes that must terminate a sentence (including the
 * value of a declaration).
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is a node that must terminate
 *   a sentence.
 */
export const isHardTerminator = (node) => isExplicitHardTerminator(node) || isAssociationOp(node) || isSeparatorOp(node);

/**
 * Checks for nodes that can terminate a sentence (including the
 * value of a declaration).
 * 
 * @param {Repr} node The node to check.
 * @returns Whether the given node is a sentence-terminating node.
 */
export const isTerminator = (node) => isSoftTerminator(node) || isHardTerminator(node);

/* Exports
-------------------------------------------------- */

export const repr = Object.freeze({
    Repr,

    // Intermediate Build-Time AST Node Types
    SentenceFragment,
    ExplicitSoftTerminator: ExplicitSoftTerminator,
    ExplicitHardTerminator: ExplicitHardTerminator,
    SeparatorOperator,
    AssociationOperator,
    DeclarationOperator,
    PlaceholderOperator,
    Argument,

    // Final Build-Time AST Node Types
    Sentence,
    Declaration,
    Parameter,
    Number,
    Text,
    Logical,
    Map,
    Block,

    // Run-Time AST Node Types
    MapInterface,
    RuntimeNumber,
    RuntimeText,
    RuntimeLogical,
    RuntimeMap,
    RuntimeBlock
});

export const is = {
    // Intermediate Build-Time AST Node Types
    sentenceFragment: isSentenceFragment,
    explicitSoftTerminator: isExplicitSoftTerminator,
    explicitHardTerminator: isExplicitHardTerminator,
    separatorOp: isSeparatorOp,
    associationOp: isAssociationOp,
    declarationOp: isDeclarationOp,
    placeholderOp: isPlaceholderOp,
    argument: isArgument,

    // Final Build-Time AST Node Types
    sentence: isSentence,
    declaration: isDeclaration,
    parameter: isParameter,
    number: isNumber,
    text: isText,
    logical: isLogical,
    map: isMap,
    block: isBlock,

    // Abstract Build-Time AST Node Types
    value: isValue,
    literal: isLiteral,
    nestable: isNestable,
    hasDeclarations: hasDeclarations, // Put it here anyway
    terminator: isTerminator,
    explicitTerminator: isExplicitTerminator,
    implicitTerminator: isImplicitTerminator,
    softTerminator: isSoftTerminator,
    hardTerminator: isHardTerminator,

    // Run-Time AST Node Types
    runtimeNumber: isRuntimeNumber,
    runtimeText: isRuntimeText,
    runtimeLogical: isRuntimeLogical,
    runtimeMap: isRuntimeMap,
    runtimeBlock: isRuntimeBlock
}

export const format = {
    nodesStr: nodesStr,
    nodesStrList: nodesStrList,
    nodeListToString: nodeListToString
}
