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

export class Repr {}

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
    constructor(children, associations) {
        super();
        this.parent = null;
        this.children = children;
        this.associations = associations;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => "["+this.children.map(child => child.toString()).join(", ")+"]";
}
export const isMap = (node) => node != null && node.constructor === Map;

export class Block extends Repr {
    constructor(children) {
        super();
        this.parent = null;
        this.children = children;
        this.decls = [];
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

    SentenceFragment,
    ExplicitSoftTerminator: ExplicitSoftTerminator,
    ExplicitHardTerminator: ExplicitHardTerminator,
    SeparatorOperator,
    AssociationOperator,
    DeclarationOperator,
    PlaceholderOperator,
    Argument,

    Sentence,
    Declaration,
    Parameter,
    Number,
    Text,
    Logical,
    Map,
    Block
});

export const is = {
    sentenceFragment: isSentenceFragment,
    explicitSoftTerminator: isExplicitSoftTerminator,
    explicitHardTerminator: isExplicitHardTerminator,
    separatorOp: isSeparatorOp,
    associationOp: isAssociationOp,
    declarationOp: isDeclarationOp,
    placeholderOp: isPlaceholderOp,
    argument: isArgument,

    sentence: isSentence,
    declaration: isDeclaration,
    parameter: isParameter,
    map: isMap,
    block: isBlock,
    literal: isLiteral,

    value: isValue,
    nestable: isNestable,
    hasDeclarations: hasDeclarations, // Put it here anyway
    terminator: isTerminator,
    explicitTerminator: isExplicitTerminator,
    implicitTerminator: isImplicitTerminator,
    softTerminator: isSoftTerminator,
    hardTerminator: isHardTerminator
}

export const format = {
    nodesStr: nodesStr,
    nodesStrList: nodesStrList,
    nodeListToString: nodeListToString
}
