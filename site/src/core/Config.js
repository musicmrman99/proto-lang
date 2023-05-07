export const configSchema = {
  title: "Proto Config",
  description: "Configuration data for the Proto programming language interpreter",

  definitions: {},

  type: "object",
  properties: {
    core: {
      description: "Settings for Proto itself",

      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  additionalProperties: false
};

export const configDefault = {
  core: {}
};
