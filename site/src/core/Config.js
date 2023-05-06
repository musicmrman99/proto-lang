export const configSchema = {
  title: "Proto Config",
  description: "Configuration data for the Proto programming language",

  definitions: {
    specialEscapeSequenceCategory: {
      type: "string",
      enum: [
        // Value             // Example         | Description
        // ------------------------------------------------------------------------------------------------------------------------------
        "keep",              // "\n" -> "\n"    | Keep the entire escape sequence.
        "translate-literal", // "\n" -> "n"     | Remove the backslash.
        "translate-special", // "\n" -> newline | Remove the entire escape sequence and replace with the corresponding special character.
        "drop",              // "\n" -> ""      | Remove the entire escape sequence.
        "error"              // "\n" -> ERROR   | Throw an error when any escape sequence in this category is found.
      ]
    },

    literalEscapeSequenceCategory: {
      type: "string",
      enum: [
        // Value             // Example       | Description
        // ------------------------------------------------------------------------------------------------------------------------------
        "keep",              // "\n" -> "\n"  | Keep the entire escape sequence.
        "translate-literal", // "\n" -> "n"   | Remove the backslash.
        "drop",              // "\n" -> ""    | Remove the entire escape sequence.
        "error"              // "\n" -> ERROR | Throw an error when any escape sequence in this category is found.
      ]
    }
  },

  type: "object",
  properties: {
    string: {
      description: "String (\"...\") handling settings",

      type: "object",
      properties: {
        escapeSequence: {
          description: "Escape sequence (\\...) handling settings",

          type: "object",
          properties: {
            special: {
              description: "The policies to apply for all special escape sequences (ie. those which could translate to a different character)",

              type: "object",
              properties: {
                default: {
                  description: "The default policy to apply for all special escape sequences (ie. those which could translate to a different character)",
                  "$ref": "#/definitions/specialEscapeSequenceCategory"
                }
              }
            },

            literal: {
              description: "The policies to apply for all non-special escape sequences (ie. those which translate to the literal character after the backslash)",

              type: "object",
              properties: {
                default: {
                  description: "The default policy to apply for all non-special escape sequences (ie. those which translate to the literal character after the backslash)",
                  "$ref": "#/definitions/literalEscapeSequenceCategory"
                },
                openCloseString: {
                  description: "The policy to apply for escaped \" (double-quote)",
                  "$ref": "#/definitions/literalEscapeSequenceCategory"
                },
                openEscapeSequence: {
                  description: "The policy to apply for escaped \\ (backslash)",
                  "$ref": "#/definitions/literalEscapeSequenceCategory"
                }
              }
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

export const configDefault = {
  string: {
    escapeSequence: {
      special: {
        default: "translate-special"
      },
      literal: {
        default: "drop",
        openCloseString: "translate-literal",
        openEscapeSequence: "translate-literal"
      }
    }
  }
};
