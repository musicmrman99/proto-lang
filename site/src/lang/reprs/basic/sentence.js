import { Repr } from "../abstract/repr";
import format from "../format";

/* Build-Time Intermediate
-------------------- */

export class SentenceFragment extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }

    length = () => this.content.length;
    toString = () => this.content;
}

export class ExplicitSoftTerminator extends Repr {
    length = () => 0;
    toString = () => "¶";
}

export class ExplicitHardTerminator extends Repr {
    length = () => 0;
    toString = () => "█";
}

// Used to represent the unparsed arguments (values or sub-sentences)
// that fill in placeholders duing sentence parsing until the sentence
// is finalised.
export class Argument extends Repr {
    constructor(children = []) {
        super();
        this.children = children;
    }

    length = () => this.children.length;
    toString = () => (
        "{ ARGUMENT: content: "+format.nodesStr(this.children)+" }"
    )
}

/* Build-Time Final
-------------------- */

export class Sentence extends Repr {
    constructor(decl, params) {
        super();
        this.decl = decl;
        this.params = params;
    }

    length = () => this.parts.reduce((accum, part) => accum + part.length(), 0);
    toString = () => "{ SENTENCE (decl: "+this.decl.toString()+") }";
}
