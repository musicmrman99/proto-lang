import mock from "./mock";
import MockError from "./mock-error";

const pipeline = (state) => state == null ? pipeline({}) : ({
    // Build
    withConfig: (config) => pipeline(Object.assign({}, state, {
        config: config
    })),
    build: (code) => {
        const config = mock.proto.config(state.config);
        const [ast, log] = mock.command.build(config, code);
        return pipeline(Object.assign({}, state, {
            success: log.success,
            ast: ast,
            buildLog: log
        }));
    },
    verifyAst: (targetAst) => {
        if (typeof targetAst === 'function') targetAst = targetAst(state);
        expect(state.success).toBe(true);
        expect(state.ast).toMatchObject(targetAst);
        return pipeline(Object.assign({}, state, {
            targetAst: targetAst
        }));
    },

    // Run
    withInput: (input) => pipeline(Object.assign({}, state, {
        input: input
    })),
    run: () => {
        const input = state.input != null ? state.input : "";
        const [result, log] = mock.command.run(state.ast, input);
        return pipeline(Object.assign({}, state, {
            success: log.success,
            result: result,
            runLog: log
        }))
    },
    verifyResult: (targetResult) => {
        if (typeof targetResult === 'function') targetResult = targetResult(state);
        expect(state.success).toBe(true);
        expect(state.result).toMatchObject(targetResult);
        return pipeline(Object.assign({}, state, {
            targetResult: targetResult
        }));
    },

    // Can be used after either .build() or .run()
    // .verifyAst() and .verifyResult() verify success for you
    verifyFailed: () => {
        expect(state.success).toBe(false);
        return pipeline(state);
    },

    // Terminate test
    pass: () => undefined,
    fail: (reason) => { throw new MockError(reason) }
});
export default pipeline;
