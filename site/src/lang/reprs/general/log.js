import { Repr } from "../abstract/repr";

export class Log extends Repr {
    constructor(success, output, errors) {
        super();
        this.success = success != null ? success : true;
        this.output = output != null ? output : [];
        this.errors = errors != null ? errors : [];
    }
}
