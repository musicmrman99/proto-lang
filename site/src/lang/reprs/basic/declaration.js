import { Repr } from "../abstract/repr";

/* Build-Time Intermediate
-------------------- */

export class DeclarationOperator extends Repr {
    length = () => 1;
    toString = () => " : "
}

export class PlaceholderOperator extends Repr {
    length = () => 1;
    toString = () => "|"
}

/* Build-Time Final
-------------------- */

export class Declaration extends Repr {
    constructor(template, sentence) {
        super();
        this.template = template;
        this.sentence = sentence;
    }

    length = () => this.template.map(item => item.length()).reduce((accum, len) => accum + len, 0) + this.sentence.length();
    toString = () => "{ DECLARATION: "+this.template.map(item => item.toString()).join("")+" }";
}
