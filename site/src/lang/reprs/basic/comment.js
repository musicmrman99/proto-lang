import { Repr } from "../abstract/repr";

export class LineComment extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }

    length = () => this.toString().length;
    toString = () => `# ${this.content}`;
}

export class BlockComment extends Repr {
    constructor(content) {
        super();
        this.content = content;
    }

    length = () => this.toString().length;
    toString = () => `#{ ${this.content} }#`;
}
