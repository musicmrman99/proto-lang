import { v4 as uuidv4 } from 'uuid';
import { isPredicate, predicate } from './predicate';

export class Repr {
    static Error = class extends Repr {
        // Note: Deliberately doesn't extend Error - this isn't a JS error, it's a Proto error.
        // Note: This is inside of Repr, unlike the other error types, as Repr and its Error type
        //       are mutually dependent, and would otherwise cause an import cycle.

        constructor(message) {
            super()

            this.message = message;
            this.name = "ReprError";

            // Use V8's native method if available, otherwise fallback
            if ("captureStackTrace" in Error) {
                Error.captureStackTrace(this, Repr.Error);
            } else {
                this.stack = (new Error()).stack;
            }
        }
    }

    static Index = class {
        constructor(type) {
            this.index = {};
            this.type = type;
        }

        get = (id) => this.index[id];

        set = (repr) => {
            if (repr == null || (this.type != null && !this.type(repr))) {
                const reprStr = repr == null ? "NULL" : repr.toString();
                throw new Repr.Error("Type error: Repr '"+reprStr+"' cannot be stored in this index");
            }
            this.index[repr.id] = repr;
        }
        unset = (repr) => delete this.index[repr.id];

        has = (repr) => this.index[repr.id] != null;

        keys = () => Object.keys(this.index);
        values = () => Object.values(this.index);
    }

    static Mapping = class {
        constructor(keyType, valueType) {
            this.mapping = {};
            this.keyType = keyType;
            this.valueType = valueType;
        }

        get = (keyRepr) => Repr.get(this.mapping[keyRepr.id]);

        set = (keyRepr, valueRepr) => {
            if (keyRepr == null || (this.keyType != null && !this.keyType(keyRepr))) {
                const keyReprStr = keyRepr == null ? "NULL" : keyRepr.toString();
                throw new Repr.Error("Type error: Repr '"+keyReprStr+"' cannot be stored as a key in this mapping");
            }
            if (valueRepr == null || (this.valueType != null && !this.valueType(valueRepr))) {
                const valueReprStr = valueRepr == null ? "NULL" : valueRepr.toString();
                throw new Repr.Error("Type error: Repr '"+valueReprStr+"' cannot be stored as a value in this mapping");
            }
            this.mapping[keyRepr.id] = valueRepr.id;
        }
        setAll = (entries) => entries.forEach(([keyRepr, valueRepr]) => this.set(keyRepr, valueRepr));
        mergeIn = (mapping) => Object.assign(this.mapping, mapping.mapping);

        unset = (keyRepr) => delete this.index[keyRepr.id];
        unsetAll = (keyReprs) => keyReprs.forEach((keyRepr) => this.unset(keyRepr));

        hasKey = (keyRepr) => this.index[keyRepr.id] != null;
        hasValue = (valueRepr) => this.values().includes(valueRepr.id);

        keys = () => Object.keys(this.mapping).map(Repr.get);
        values = () => Object.values(this.mapping).map(Repr.get);
        entries = () => Object.entries(this.mapping).map(([key, value]) => [Repr.get(key), Repr.get(value)]);
    }

    static all = new Repr.Index();
    static get = (id) => Repr.all.get(id);

    static is(type, node) {
        // Repr.is(type) -> (node) -> boolean
        if (node === undefined) {
            return predicate((_node) => Repr.is(type, _node));

        // Repr.is(type, node) -> boolean
        } else if (isPredicate(type)) {
            return type(node);

        } else if (type === Repr) {
            return node != null && Repr.get(node.id) != null;

        } else {
            return node != null && node.constructor === type;
        }
    }

    constructor() {
        this.id = uuidv4();
        Repr.all.set(this);
    }
}
