import { applyFixtureToTree } from "@lerna/test-helpers";
import { Tree, readJson } from "@nrwl/devkit";
import { createTree } from "@nrwl/devkit/testing";
import path from "path";

import { CreateGeneratorOptions, generatorImplementation } from "./default-generator";

describe("lerna create default-generator", () => {
  let tree: Tree;

  describe("basic", () => {
    const options: CreateGeneratorOptions = {
      project: {
        rootPath: "/virtual",
        manifest: {
          get(key: string) {
            return this[key];
          },
        },
      } as any,
      name: "foo",
      loc: "packages",
      private: false,
      description: "My package",
      license: "MIT",
      bin: false,
      esModule: false,
    };

    beforeEach(() => {
      tree = createTree();
      applyFixtureToTree(tree, path.join(__dirname, "__fixtures__", "basic"));
    });

    // it("should work", async () => {
    //   // const name = "something-casey";
    //   // await generatorImplementation(tree, {
    //   //   loc: "packages",
    //   // });
    //   // expect(readJson(tree, `packages/package.json`)).toMatchInlineSnapshot(`
    //   //   Object {
    //   //     "name": "ehllo",
    //   //     "version": "0.0.1",
    //   //   }
    //   // `);
    //   console.log(tree.children(""));
    //   expect(true).toBe(true);
    // });

    it("creates a stub package with a scoped name", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "@my-org/my-pkg",
      });

      expect(tree.exists("packages/my-pkg/lib/my-pkg.js")).toBeTruthy();
    });

    it("overrides init-license with --license", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "license-override",
        license: "MIT",
      });

      expect(readJson(tree, "packages/license-override/package.json")).toHaveProperty("license", "MIT");
    });

    it("sets private:true with --private", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "private-pkg",
        private: true,
      });

      expect(readJson(tree, "packages/private-pkg/package.json")).toHaveProperty("private", true);
    });

    it("does not mutate explicit --homepage pathname", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "foo-pkg",
        homepage: "http://google.com/",
      });

      expect(readJson(tree, "packages/foo-pkg/package.json")).toHaveProperty(
        "homepage",
        "http://google.com/"
      );
    });

    it("defaults schemeless homepage to http://", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "foo-pkg",
        homepage: "google.com",
      });

      expect(readJson(tree, "packages/foo-pkg/package.json")).toHaveProperty(
        "homepage",
        "http://google.com/"
      );
    });

    it("overrides default publishConfig.access with --access=restricted", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "@foo/pkg",
        access: "restricted",
      });

      expect(readJson(tree, "packages/pkg/package.json")).toHaveProperty("publishConfig", {
        access: "restricted",
      });
    });

    it("sets non-public publishConfig.registry with --registry", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "@foo/pkg",
        registry: "http://my-private-registry.com/",
      });

      expect(readJson(tree, "packages/pkg/package.json")).toHaveProperty("publishConfig", {
        registry: "http://my-private-registry.com/",
      });
    });

    it("sets publishConfig.tag with --tag", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "@foo/pkg",
        tag: "next",
      });

      expect(readJson(tree, "packages/pkg/package.json")).toHaveProperty("publishConfig", {
        access: "public",
        tag: "next",
      });
    });

    it("skips repository field when git remote is missing", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "a-pkg",
      });

      expect(readJson(tree, "packages/a-pkg/package.json")).not.toHaveProperty("repository");
    });

    it("adds type field when using esModule", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "a-pkg",
        esModule: true,
      });

      expect(readJson(tree, "packages/a-pkg/package.json")).toHaveProperty("type", "module");
    });

    it("skips type field when not using esModule", async () => {
      await generatorImplementation(tree, {
        ...options,
        name: "a-pkg",
        esModule: false,
      });

      expect(readJson(tree, "packages/a-pkg/package.json")).not.toHaveProperty("type");
    });
  });
});
