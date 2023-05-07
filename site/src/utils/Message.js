import { v4 as uuidv4 } from 'uuid';

export default class Message {
    constructor(type, content) {
        this.type = type;
        this.content = content;

        // Message keys must always be UUIDs
        // (see the docs for the Message react component)
        this.key = uuidv4();
    }
}
