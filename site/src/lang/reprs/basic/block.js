import { Repr } from "../abstract/repr";

import { RuntimeRepr } from "../abstract/abstract";
import { SentenceFragment, Sentence } from "./sentence";
import { PlaceholderOperator, Declaration } from "./declaration";

/* Build-Time Final
-------------------- */

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
        const numSentences = this.children.filter(Repr.is(Sentence)).length;
        const declarations = numDeclarations === 1 ? numDeclarations+" declaration" : numDeclarations+" declarations";
        const sentences = numSentences === 1 ? numSentences+" sentence" : numSentences+" sentences";
        return `{ BLOCK (${declarations}, ${sentences}) }`;
    };
}

export class NativeBlock extends Repr {
    constructor() {
        super();
        this.function_ = () => {};
        this.docs = "An empty block";
        this.reqEncDecls = [];
    }

    length = () => 1; // Non-empty, but not relative to its source code
    toString = () => {
        const docsMaxLen = 30;
        return `{ NATIVE BLOCK "${
            this.docs.length > docsMaxLen ?
                this.docs.slice(0, docsMaxLen - 3)+"..." :
                this.docs
        }" }`;
    };
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

/* Run-Time
-------------------- */

export class ProtoRuntimeBlock extends Repr {
    constructor(astBlock) {
        super();

        // Known when the block is created
        this.astBlock = astBlock;
        this.encDecls = new Repr.Mapping(Repr.is(Declaration), Repr.is(RuntimeRepr));

        // Not known until the block is run (possibly more than once)
        this.parent = null;
        this.args = null;
        this.decls = null;
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

/* Run-Time (Unavailable From Parser/Runtime)
-------------------- */

export class NativeRuntimeBlock extends Repr {
    constructor(astNativeBlock) {
        super();

        // Known when the block is created
        this.astNativeBlock = astNativeBlock;
        this.encDecls = new Repr.Mapping(Repr.is(Declaration), Repr.is(RuntimeRepr));

        // Not known until the block is run (possibly more than once)
        this.parent = null;
        this.args = null;
        this.decls = null;
    }

    /* Helpers for other representation types
    -------------------- */

    nativeTemplate() {
        return [
            "__"+this.function_.name+"(",
            ...(
                new Array(this.function_.length)
                .fill()
                .flatMap(() => [new PlaceholderOperator(), new SentenceFragment(", ")])
                .slice(0, -1)
            ),
            ")"
        ];
    }

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `{ NATIVE BLOCK { decls: ${this.decls} } from ${this.astNativeBlock.toString()} }`;
    };
}
