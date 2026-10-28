import fs from "fs";
import os from "os";
import path from "path";
import { getPnpmCatalogs, resolveCatalogSpec } from "./pnpm-catalogs";

describe("getPnpmCatalogs", () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "lerna-test-"));
  });

  afterEach(() => {
    fs.rmSync(rootPath, { recursive: true, force: true });
  });

  it("should read the default and named catalogs from pnpm-workspace.yaml", () => {
    fs.writeFileSync(
      path.join(rootPath, "pnpm-workspace.yaml"),
      "packages:\n  - packages/*\ncatalog:\n  react: ^18.2.0\ncatalogs:\n  react17:\n    react: ^17.0.2\n"
    );

    expect(getPnpmCatalogs(rootPath)).toEqual({
      defaultCatalog: { react: "^18.2.0" },
      namedCatalogs: { react17: { react: "^17.0.2" } },
    });
  });

  it("should use catalogs.default as the default catalog", () => {
    fs.writeFileSync(
      path.join(rootPath, "pnpm-workspace.yaml"),
      "catalogs:\n  default:\n    react: ^18.2.0\n"
    );

    expect(getPnpmCatalogs(rootPath).defaultCatalog).toEqual({ react: "^18.2.0" });
  });

  it("should return empty catalogs when there is no pnpm-workspace.yaml", () => {
    expect(getPnpmCatalogs(rootPath)).toEqual({ defaultCatalog: {}, namedCatalogs: {} });
  });
});

describe("resolveCatalogSpec", () => {
  const catalogs = {
    defaultCatalog: { react: "^18.2.0" },
    namedCatalogs: { react17: { react: "^17.0.2" } },
  };

  it.each([
    ["catalog:", "^18.2.0"],
    ["catalog:default", "^18.2.0"],
    ["catalog:react17", "^17.0.2"],
  ])("should resolve %s", (spec, expected) => {
    expect(resolveCatalogSpec("react", spec, catalogs)).toEqual(expected);
  });

  it("should throw when the catalog has no entry for the dependency", () => {
    expect(() => resolveCatalogSpec("react-dom", "catalog:", catalogs)).toThrow(
      'No version found for "react-dom" in the "default" catalog in pnpm-workspace.yaml'
    );
  });
});
