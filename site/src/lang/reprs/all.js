import { Repr } from "./abstract/repr";
import { Message } from "./general/message";

import {
    LineComment,
    BlockComment
} from './basic/comment'

import {
    SentenceFragment,
    ExplicitSoftTerminator,
    ExplicitHardTerminator,
    Argument,
    Sentence
} from "./basic/sentence";

import {
    UsingOperator,
    Using
} from "./basic/using";

import {
    DeclarationOperator,
    PlaceholderOperator,
    Declaration
} from "./basic/declaration";

import {
    Number,
    Text,
    Logical,
    RuntimeNumber,
    RuntimeText,
    RuntimeLogical
} from "./basic/primitive";

import {
    Block,
    Parameter,
    ProtoRuntimeBlock,
    NativeBlock,
    NativeRuntimeBlock
} from "./basic/block";

import {
    Map,
    SeparatorOperator,
    AssociationOperator,
    RuntimeMap
} from "./basic/map";

import {
    AbstractBlock,
    Literal,
    Value,
    Nestable,
    DeclarationContext,
    ExplicitTerminator,
    ImplicitTerminator,
    SoftTerminator,
    HardTerminator,
    Terminator,
    RuntimeRepr,
    RuntimeBlock
} from "./abstract/abstract";

import { Stack } from "./basic/stack";

import { BuildError } from "./errors/build-error";
import { ComputeError } from "./errors/compute-error";

const repr = Object.freeze({
    // Base
    Repr,

    // General
    Message,

    // Build-Time Intermediate
    SentenceFragment,
    UsingOperator,
    ExplicitSoftTerminator,
    ExplicitHardTerminator,
    SeparatorOperator,
    AssociationOperator,
    DeclarationOperator,
    PlaceholderOperator,
    Argument,

    // Build-Time Final
    Sentence,
    Using,
    Declaration,

    Number,
    Text,
    Logical,
    Map,
    Block,
    Parameter,

    BuildError,

    // Build-Time Final (Unavailable From Parser/Runtime)
    LineComment,
    BlockComment,
    NativeBlock,

    // Build-Time Abstract
    AbstractBlock,
    Literal,
    Value,
    Nestable,
    DeclarationContext,

    ExplicitTerminator,
    ImplicitTerminator,
    SoftTerminator,
    HardTerminator,
    Terminator,

    // Run-Time
    RuntimeNumber,
    RuntimeText,
    RuntimeLogical,
    RuntimeMap,
    ProtoRuntimeBlock,

    Stack,

    ComputeError,

    // Run-Time (Unavailable From Parser/Runtime)
    NativeRuntimeBlock,

    // Run-Time Abstract
    RuntimeRepr,
    RuntimeBlock
});
export default repr;
