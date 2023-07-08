import { Repr } from "../abstract/repr";

/* Build-Time Intermediate
-------------------- */

export class UsingOperator extends Repr {
    length = () => 6;
    toString = () => "using "
}

/* Build-Time Final
-------------------- */

export class Using extends Repr {
    constructor(decl, params) {
        super();
        this.decl = decl;
        this.params = params;
    }

    length = () => this.parts.reduce((accum, part) => accum + part.length(), 0);
    toString = () => "{ SENTENCE (decl: "+this.decl.toString()+") }";
}
