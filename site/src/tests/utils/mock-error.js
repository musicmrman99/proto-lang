// Mock error. From: https://stackoverflow.com/a/27724419
export default function MockError(message) {
    this.message = message;

    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, MockError);
    else
        this.stack = (new Error()).stack;
}
MockError.prototype = Object.create(Error.prototype);
MockError.prototype.name = "MockError";
MockError.prototype.constructor = MockError;
