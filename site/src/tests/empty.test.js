import mock from "./utils/mock";
import { BUILD_ERROR, pipeline } from "./utils/pipeline";

it('fails when it has no code to build', () => pipeline()
    .build(mock.proto.code(""))
    .verifyBuild(BUILD_ERROR)
    .pass()
);
