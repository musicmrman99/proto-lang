import mock from "./mock";

const pipeline = (state) => state == null ? pipeline({}) : ({
    // Build
    withConfig: (config) => pipeline(Object.assign({}, state, {
        config: config
    })),
    build: (code) => pipeline(Object.assign({}, state, {
        ast: mock.command.build(state.config != null ? state.config : mock.proto.config(), code)
    })),
    verifyAst: (targetAst) => {
        if (typeof targetAst === 'function') targetAst = targetAst(state);
        expect(state.ast).toMatchObject(targetAst);
        return pipeline(Object.assign({}, state, {
            targetAst: targetAst
        }));
    },

    // Run
    withInput: (input) => pipeline(Object.assign({}, state, {
        input: input
    })),
    run: () => pipeline(Object.assign({}, state, {
        result: mock.command.run(state.ast, state.input != null ? state.input : "")
    })),
    verifyResult: (targetResult) => {
        if (typeof targetResult === 'function') targetResult = targetResult(state);
        expect(state.result).toMatchObject(targetResult);
        return pipeline(Object.assign({}, state, {
            targetResult: targetResult
        }));
    },

    // Terminate test
    success: () => undefined
});
export default pipeline;
