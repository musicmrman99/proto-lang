import { Repr } from "../abstract/repr";

export class Stack extends Repr {
    constructor(head) {
        super();
        this.head = (head != null ? head : null);
    }

    /**
     * Return the value of the given declaration from the current head block or any
     * blocks below it on the stack.
     * 
     * This function is most commonly used to get the value of a required enclosing
     * declaration in the context of the creating block (which is on the stack) when
     * creating a new runtime block (which won't yet be on the stack).
     * 
     * @param {Declaration} decl The in-scope declaration to get the value for.
     * @returns The value of the given declaration in this block.
     */
    getDeclValue = (decl, block) => {
        if (block == null) block = this.head;
        if (block == null) return null;

        // Does this block have it?
        const value = block.decls.get(decl);
        if (value != null) return value;

        // Search parent (if exists), or return null
        return block.parent != null ? this.getDeclValue(decl, block.parent) : null;
    }

    /**
     * Return the stack trace of this block as an array of runtime blocks.
     * 
     * This will only contain this block if it's not on the stack.
     * 
     * @returns The stack trace of this block.
     */
    getTrace = (block) => {
        if (block == null) block = this.head;
        return [
            block,
            ...(block.parent != null ? this.getTrace(block.parent) : [])
        ];
    }

    /**
     * Return the stack trace of this block as a string.
     * 
     * This will only contain this block if it's not on the stack.
     * 
     * @returns The stack trace of this block as a string.
     */
    getTraceStr = (block) => {
        return this.getTrace(block)
            .map((runtimeBlock) => "-> "+runtimeBlock.astBlock.toString())
            .join("\n");
    }
}
