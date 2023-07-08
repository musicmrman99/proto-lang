import { Repr } from "../abstract/repr";

export class ComputeError extends Repr {
    // Note: Deliberately doesn't extend Error - this isn't a JS error, it's a Proto error

    constructor(message) {
        super()

        this.message = message;
        this.name = "ComputeError";

        // Use V8's native method if available, otherwise fallback
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, ComputeError);
        } else {
            this.stack = (new Error()).stack;
        }
    }
}
