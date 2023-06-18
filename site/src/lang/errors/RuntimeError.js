// Runtime error. From: https://stackoverflow.com/a/27724419
export default function RuntimeError(message) {
    this.message = message;

    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, RuntimeError);
    else
        this.stack = (new Error()).stack;
}
RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.name = "RuntimeError";
RuntimeError.prototype.constructor = RuntimeError;
