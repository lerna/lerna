import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";
import { ValidationError } from "./validation-error";

export interface PnpmCatalogs {
  defaultCatalog: Record<string, string>;
  namedCatalogs: Record<string, Record<string, string>>;
}

interface PnpmWorkspaceCatalogsConfig {
  catalog?: Record<string, string>;
  catalogs?: Record<string, Record<string, string>>;
}

/**
 * Read the catalogs defined in the pnpm-workspace.yaml at the root of the workspace, if any.
 * @see https://pnpm.io/catalogs
 */
export function getPnpmCatalogs(rootPath: string): PnpmCatalogs {
  const workspaceConfigPath = path.join(rootPath, "pnpm-workspace.yaml");
  const workspaceConfig: PnpmWorkspaceCatalogsConfig = fs.existsSync(workspaceConfigPath)
    ? (load(fs.readFileSync(workspaceConfigPath, "utf8")) as PnpmWorkspaceCatalogsConfig | undefined) || {}
    : {};

  return {
    // the default catalog can be defined either as "catalog" or as "catalogs.default"
    defaultCatalog: workspaceConfig.catalog ?? workspaceConfig.catalogs?.["default"] ?? {},
    namedCatalogs: workspaceConfig.catalogs ?? {},
  };
}

/**
 * Resolve a "catalog:" or "catalog:<name>" spec to the version range defined for the dependency in that catalog.
 */
export function resolveCatalogSpec(depName: string, spec: string, catalogs: PnpmCatalogs): string {
  const catalogName = spec.replace(/^catalog:/, "") || "default";
  const catalogVersion =
    catalogName === "default"
      ? catalogs.defaultCatalog[depName]
      : catalogs.namedCatalogs[catalogName]?.[depName];

  if (!catalogVersion) {
    throw new ValidationError(
      "ECATALOG",
      `No version found for "${depName}" in the "${catalogName}" catalog in pnpm-workspace.yaml (from "${depName}": "${spec}"). See https://pnpm.io/catalogs`
    );
  }

  return catalogVersion;
}
