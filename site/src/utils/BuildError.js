// Build error. From: https://stackoverflow.com/a/27724419
export default function BuildError(message) {
    this.message = message;

    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, BuildError);
    else
        this.stack = (new Error()).stack;
}
BuildError.prototype = Object.create(Error.prototype);
BuildError.prototype.name = "BuildError";
BuildError.prototype.constructor = BuildError;
