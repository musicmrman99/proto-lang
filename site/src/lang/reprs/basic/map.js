import { Repr } from "../abstract/repr";

/* Build-Time Intermediate
-------------------- */

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

export class SeparatorOperator extends Repr {
    length = () => 1;
    toString = () => ","
}

/* Build-Time Final
-------------------- */

export class Map extends Repr {
    constructor() {
        super();
        this.parent = null;
        this.children = [];
        this.associations = [];
    }

    length = () => this.children.reduce((accum, child) => accum + child.length(), 0);
    toString = () => "["+this.children.map(child => child.toString()).join(", ")+"]";
}

/* Run-Time
-------------------- */

export class RuntimeMap extends Repr {
    constructor(astMap, children) {
        super();

        this.astMap = astMap;
        this.items = children;
    }

    /* Map interface methods
    -------------------- */

    //

    /* Utility methods
    -------------------- */

    toString = () => {
        return `{ MAP [ ${this.items.map((item) => item.toString()).join(", ")} ] }`;
    };
}
