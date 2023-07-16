import mock from "./mock";
import MockError from "./mock-error";

export const BUILD_ERROR = Symbol('BUILD_ERROR');
export const COMPUTE_ERROR = Symbol('COMPUTE_ERROR');

export const pipeline = (state) => state == null ? pipeline({
    success: true
}) : ({
    // Build
    withConfig: (config) => {
        return pipeline(Object.assign({}, state, {config: config}))
    },
    build: (code) => {
        const config = mock.proto.config(state.config);
        const [ast, log] = mock.command.build(config, code);
        return pipeline(Object.assign({}, state, {
            success: log.success,
            ast: ast,
            buildLog: log
        }));
    },
    verifyBuild: (targetAst) => {
        if (typeof targetAst === 'function') targetAst = targetAst(state);

        if (Object.is(targetAst, BUILD_ERROR)) {
            expect(state.success).toBe(false);
            return pipeline(state);

        } else {
            expect(state.success).toBe(true);
            if (state.ast !== Object(state.ast)) {
                expect(state.ast).toBe(targetAst);
            } else {
                expect(state.ast).toMatchObject(targetAst);
            }

            return pipeline(Object.assign({}, state, {
                targetAst: targetAst
            }));
        }
    },

    // Run
    withInput: (input) => {
        // Job Dependencies
        if (state.ast == null) return pipeline(state);

        return pipeline(Object.assign({}, state, {input: input}))
    },
    run: () => {
        // Job Dependencies
        if (state.ast == null) return pipeline(state);

        const input = state.input != null ? state.input : "";
        const [result, log] = mock.command.run(state.ast, input);
        return pipeline(Object.assign({}, state, {
            success: log.success,
            result: result,
            runLog: log
        }))
    },
    verifyRun: (targetResult) => {
        // Job Dependencies
        if (state.ast == null) return pipeline(state);

        if (typeof targetResult === 'function') targetResult = targetResult(state);

        if (Object.is(targetResult, COMPUTE_ERROR)) {
            expect(state.success).toBe(false);
            return pipeline(state);

        } else {
            expect(state.success).toBe(true);
            if (state.result !== Object(state.result)) {
                expect(state.result).toBe(targetResult);
            } else {
                expect(state.result).toMatchObject(targetResult);
            }

            return pipeline(Object.assign({}, state, {
                targetResult: targetResult
            }));
        }
    },

    // Terminate test
    pass: () => undefined,
    fail: (reason) => { throw new MockError(reason) }
});
