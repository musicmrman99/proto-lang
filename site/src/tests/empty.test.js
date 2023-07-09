import mock from "./utils/mock";
import pipeline from "./utils/pipeline";

it('creates the number zero', () => pipeline()
    .build(mock.proto.code(""))
    .verifyFailed()
    .pass()
);
