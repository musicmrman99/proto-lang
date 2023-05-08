import { v4 as uuidv4 } from 'uuid';

export default class Message {
    constructor(type, content) {
        this.type = type;
        this.content = content;
        this.id = uuidv4();
    }
}
