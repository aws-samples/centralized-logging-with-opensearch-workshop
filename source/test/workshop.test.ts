/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  App,
} from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import workshop = require('../lib/workshop-stack');

describe("MainStack", () => {


  test("Test main stack with default setting", () => {
    const app = new App();

    // WHEN
    const stack = new workshop.MainStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    // Mocker data API
    template.hasResourceProperties("AWS::Lambda::Function", {
      "Environment": {
        "Variables": {
          "DEFAULT_LOG_S3_BUCKET_NAME":  Match.anyValue(),
          "DEFAULT_LOG_S3_BUCKET_PREFIX": "distribution-access-logs/"
        }
      },
      MemorySize: 2048,
      Runtime: "python3.9",
      Timeout: 600

    });
  }
  )
}
)