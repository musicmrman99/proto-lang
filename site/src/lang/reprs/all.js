import { Repr } from "./abstract/repr";
import { Message } from "./general/message";

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
    RuntimeBlock
} from "./basic/block";

import {
    Map,
    SeparatorOperator,
    AssociationOperator,
    RuntimeMap
} from "./basic/map";

import {
    MapInterface
} from "./abstract/map-interface";

import {
    Literal,
    Value,
    Nestable,
    DeclarationContext,
    ExplicitTerminator,
    ImplicitTerminator,
    SoftTerminator,
    HardTerminator,
    Terminator
} from "./abstract/abstract";

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
    Block, Parameter,

    // Build-Time Abstract
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
    MapInterface,

    RuntimeNumber,
    RuntimeText,
    RuntimeLogical,
    RuntimeMap,
    RuntimeBlock
});
export default repr;
