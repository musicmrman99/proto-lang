import { Repr } from "../abstract/repr";
import { MapInterface } from "../abstract/map-interface";

/* Build-Time Final
-------------------- */

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

/* Run-Time
-------------------- */

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
