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

import { App } from "aws-cdk-lib";
import "source-map-support/register";
import { MainStack } from "../lib/workshop-stack";
import { BootstraplessStackSynthesizer } from "cdk-bootstrapless-synthesizer";

const app = new App();

new MainStack(app, "CLWorkshopEC2", {
  runType: "EC2",
  synthesizer: newSynthesizer()
});
new MainStack(app, "CLWorkshopEKS", {
  runType: "EKS",
  synthesizer: newSynthesizer()
});
new MainStack(app, "CLWorkshopEC2AndEKS", {
  runType: "EC2_AND_EKS",
  synthesizer: newSynthesizer()
});

function newSynthesizer() {
  return process.env.USE_BSS ? new BootstraplessStackSynthesizer() : undefined;
}
