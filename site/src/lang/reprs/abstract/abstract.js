import { Repr } from "./repr";
import { predicate } from "./predicate";

import { Number, Text, Logical, RuntimeNumber, RuntimeText, RuntimeLogical } from "../basic/primitive";
import { Map, AssociationOperator, SeparatorOperator, RuntimeMap } from "../basic/map";
import { Block, Parameter, ProtoRuntimeBlock, NativeBlock, NativeRuntimeBlock } from "../basic/block";
import { ExplicitSoftTerminator, ExplicitHardTerminator } from "../basic/sentence";

/* Build-Time Abstract
-------------------- */

/**
 * Type for nodes that represent literals.
 */
export const Literal = predicate(
    (node) => node != null && (
        [
            Number,
            Text,
            Logical,
            Map,
            Block,
            NativeBlock
        ].includes(node.constructor)
    )
);

/**
 * Type for runtime blocks.
 */
export const AbstractBlock = predicate((node) =>
    Repr.is(Block, node) ||
    Repr.is(NativeBlock, node)
);

/**
 * Type for nodes that represent (rather than compute to) values.
 */
export const Value = predicate((node) =>
    Repr.is(Literal, node) ||
    Repr.is(Parameter, node)
);

/**
 * Type for nodes that create a new top-level parsing context,
 * and so can contain other nodes.
 */
export const Nestable = predicate((node) =>
    Repr.is(Map, node) ||
    Repr.is(Block, node) ||
    Repr.is(Parameter, node)
);

/**
 * Type for nodes that can contain declarations.
 * 
 * Note: All nodes that can contain declarations are nestable. See `isNestable()`.
 */
export const DeclarationContext = predicate((node) =>
    // Make sure that blocks are nestable, or this abstract type is meaningless
    Repr.is(Block, node) && Repr.is(Nestable, node)
);

/**
 * Type for nodes that are explicit terminators (ie. nodes whose
 * only function is to terminate sentences).
 */
export const ExplicitTerminator = predicate((node) =>
    Repr.is(ExplicitSoftTerminator, node) ||
    Repr.is(ExplicitHardTerminator, node)
);

/**
 * Type for nodes that are implicit terminators (ie. nodes whose
 * function is primarily something other than terminating sentences,
 * but either may or must terminate sentences).
 */
export const ImplicitTerminator = predicate((node) =>
    Repr.is(AssociationOperator, node) ||
    Repr.is(SeparatorOperator, node)
);

/**
 * Type for nodes that can optionally terminate a sentence
 * (including the value of a declaration).
 */
export const SoftTerminator = predicate((node) =>
    Repr.is(ExplicitSoftTerminator, node)
);

/**
 * Type for nodes that must terminate a sentence (including the
 * value of a declaration).
 */
export const HardTerminator = predicate((node) =>
    Repr.is(ExplicitHardTerminator, node) ||
    Repr.is(AssociationOperator, node) ||
    Repr.is(SeparatorOperator, node)
);

/**
 * Type for nodes that can terminate a sentence (including the
 * value of a declaration).
 */
export const Terminator = predicate((node) =>
    Repr.is(SoftTerminator, node) ||
    Repr.is(HardTerminator, node)
);

/* Run-Time Abstract
-------------------- */

/**
 * Type for proto runtime values.
 */
export const RuntimeRepr = predicate(
    (node) => node != null && (
        [
            RuntimeNumber,
            RuntimeText,
            RuntimeLogical,
            RuntimeMap,
            ProtoRuntimeBlock,
            NativeRuntimeBlock
        ].includes(node.constructor)
    )
);

/**
 * Type for runtime blocks.
 */
export const RuntimeBlock = predicate((node) =>
    Repr.is(ProtoRuntimeBlock, node) ||
    Repr.is(NativeRuntimeBlock, node)
);
