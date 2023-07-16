import { BUILD_ERROR } from "./utils/pipeline";
import { runTestGroup } from "./utils/group";

runTestGroup([
    ['fails when it has no code to build', [""], BUILD_ERROR]
]);
