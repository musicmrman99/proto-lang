// From: https://stackoverflow.com/a/14706877
export default function isObject (obj) {
    return obj === Object(obj) && Object.prototype.toString.call(obj) !== '[object Array]';
};
