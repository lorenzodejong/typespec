import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { deepStrictEqual } from "assert";
import { getExtensions } from "../src/decorators.js";
import { createOpenAPITestRunner } from "./test-host.js";

describe("openapi: decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createOpenAPITestRunner();
  });

  describe("@operationId", () => {
    it("emit diagnostic if use on non operation", async () => {
      const diagnostics = await runner.diagnose(`
        @operationId("foo")
        model Foo {
          
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/openapi/decorator-wrong-type",
        message: "Cannot use @operationId on a Model",
      });
    });
  });

  describe("@extension", () => {
    it("apply extension on model", async () => {
      const { Foo } = await runner.compile(`
        @extension("x-custom", "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      deepStrictEqual(Object.fromEntries(getExtensions(runner.program, Foo)), {
        "x-custom": "Bar",
      });
    });

    it("emit diagnostics when passing non string extension key", async () => {
      const diagnostics = await runner.diagnose(`
        @extension(123, "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "invalid-argument",
        message:
          "Argument '(unnamed type)' of type 'number' is not assignable to parameter of type 'string'",
      });
    });

    it("emit diagnostics when passing extension key not starting with `x-`", async () => {
      const diagnostics = await runner.diagnose(`
        @extension("foo", "Bar")
        @test
        model Foo {
          prop: string
        }
      `);

      expectDiagnostics(diagnostics, {
        code: "@cadl-lang/openapi/invalid-extension-key",
        message: `OpenAPI extension must start with 'x-' but was 'foo'`,
      });
    });
  });
});