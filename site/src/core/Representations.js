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

export class SoftTerminator extends Repr {
    length = () => 0;
    toString = () => "¶";
}
export const isSoftTerminator = (node) => node != null && node.constructor === SoftTerminator;

export class AssociationOperator extends Repr {
    constructor(relation, remove) {
        super();
        this.relation = relation;
        this.remove = remove;
    }

    length = () => 3;
    toString = () => (
        (this.relation.leftDir ? "<" : "-") +
        (this.remove ? "/" : "-") +
        (this.relation.right ? ">" : "-")
    )
}
export const isAssociationOp = (node) => node != null && node.constructor === AssociationOperator;

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
    constructor(ref, params) {
        super();
        this.ref = ref;
        this.params = params;
    }

    length = () => this.parts.reduce((accum, part) => accum + part.length(), 0);
    toString = () => [
        "{ SENTENCE (ref: ",
        this.ref.toString(),
        ") }"
    ].join("");
}
export const isSentence = (node) => node != null && node.constructor === Sentence;

export class Declaration extends Repr {
    constructor(template, ref) {
        super();
        this.template = template;
        this.ref = ref;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => "{ DECLARE: "+this.template.map(item => item.toString()).join("")+" }";
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

export class Text extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }
    
    length = () => this.value.length + 2; // for the quotes
    toString = () => '"'+this.value.toString()+'"';
}

export class Logical extends Repr {
    constructor(value) {
        super();
        this.value = value;
    }

    length = () => this.value.toString().length;
    toString = () => this.value.toString();
}

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

export class Map extends Repr {
    constructor(children) {
        super();
        this.parent = null;
        this.children = children;
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => "["+this.children.map(child => child.toString()).join("")+"]";
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

/* Composite Utils
-------------------- */

export const isValue = (node) => isLiteral(node) || isParameter(node);
export const isNestable = (node) => isMap(node) || isBlock(node) || isParameter(node);
export const isTerminator = (node) => isSoftTerminator(node) || isAssociationOp(node);
export const hasDeclarations = (node) => isBlock(node);

/* Export Default
-------------------- */

export const repr = Object.freeze({
    Repr,

    SentenceFragment,
    SoftTerminator,
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
    softTerminator: isSoftTerminator,
    associationOperator: isAssociationOp,
    declarationOp: isDeclarationOp,
    placeholderOp: isPlaceholderOp,
    associationOp: isAssociationOp,
    argument: isArgument,

    sentence: isSentence,
    declaration: isDeclaration,
    parameter: isParameter,
    map: isMap,
    block: isBlock,
    literal: isLiteral,

    value: isValue,
    nestable: isNestable,
    terminator: isTerminator,
    hasDeclarations: hasDeclarations // Put it here anyway
}

export const format = {
    nodesStr: nodesStr,
    nodesStrList: nodesStrList,
    nodeListToString: nodeListToString
}
