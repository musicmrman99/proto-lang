import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

it('fails when it has no code to build', () => pipeline()
    .build(mock.proto.code(""))
    .verifyFailed()
    .pass()
);
