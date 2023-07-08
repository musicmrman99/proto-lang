import { Repr } from "../abstract/repr";
import { MapInterface } from "../abstract/map-interface";

import { Sentence } from "./sentence";
import { Declaration } from "./declaration";

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

export class RuntimeBlock extends MapInterface {
    constructor(astBlock) {
        super();

        // Known when the block is created
        this.astBlock = astBlock;
        this.encDecls = new Repr.Mapping(Repr.is(Declaration), Repr.is(Repr));

        // Not known until the block is run (possibly more than once)
        this.parent = null;
        this.args = null;
        this.decls = null;
    }

    /* Block methods
    -------------------- */

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
