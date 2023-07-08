import { Repr } from "../abstract/repr";

export class Message extends Repr {
    constructor(type, content) {
        super();
        this.type = type;
        this.content = content;
    }
}
