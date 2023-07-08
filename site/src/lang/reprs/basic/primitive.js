import { Repr } from "../abstract/repr";

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

export class RuntimeNumber extends Repr {
    constructor(astNumber) {
        super();
        this.value = astNumber.value;
    }

    static fromNative = (number) => new RuntimeNumber({value: +number});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return this.value.toString();
    };
}

export class RuntimeText extends Repr {
    constructor(astText) {
        super();
        this.value = astText.value;
    }

    static fromNative = (string) => new RuntimeText({value: string.toString()});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `"${this.value}"`;
    };
}

export class RuntimeLogical extends Repr {
    constructor(astLogical) {
        super();
        this.value = astLogical.value;
    }

    static fromNative = (boolean) => new RuntimeLogical({value: !!boolean});

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return this.value.toString();
    };
}
