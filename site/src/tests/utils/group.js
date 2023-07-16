import mock from "./mock";
import { pipeline } from "./pipeline";

import isObject from "../../utils/is-object";

export function flattenTests(tests, context='') {
    if (tests == null) tests = [];
    if (isObject(tests)) {
        return Object.entries(tests).flatMap(
            ([groupName, groupContent]) => flattenTests(groupContent, context+groupName+' / ')
        );
    } else {
        return tests.map(
            // Force it to have exactly 4 elements. For some reason, Jest hangs on a test if it doesn't have the same
            // number of values as the test's anonymous function has parameters. JS would usually pass `undefined` by
            // default.
            ([testName, code, expectedAst, expectedValue]) => [
                context+testName, code, expectedAst, expectedValue
            ]
        );
    }
}

export function runTestGroup(tests) {
    it.each(flattenTests(tests))('%s', (_, code, expectedAst, expectedValue) => pipeline()
        .build(mock.proto.code(...code))
        .verifyBuild(expectedAst)
        .run()
        .verifyRun(expectedValue)
        .pass()
    );
}
