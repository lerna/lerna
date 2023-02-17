import { NxJsonConfiguration, ProjectsConfigurations } from "@nrwl/devkit";
import {
  applyVerbosity,
  coerceTypesInOptions,
  convertAliases,
  convertSmartDefaultsIntoNamedParams,
  setDefaults,
  validateOptsAgainstSchema,
  warnDeprecations,
  getPromptsForSchema,
  Options,
  Schema,
} from "nx/src/utils/params";

function isTTY(): boolean {
  return !!process.stdout.isTTY && process.env["CI"] !== "true";
}

function getGeneratorDefaults(
  projectName: string | null,
  projectsConfigurations: ProjectsConfigurations,
  nxJsonConfiguration: NxJsonConfiguration,
  collectionName: string,
  generatorName: string
) {
  let defaults = {};
  if (nxJsonConfiguration?.generators) {
    if (nxJsonConfiguration.generators[collectionName]?.[generatorName]) {
      defaults = {
        ...defaults,
        ...nxJsonConfiguration.generators[collectionName][generatorName],
      };
    }
    if (nxJsonConfiguration.generators[`${collectionName}:${generatorName}`]) {
      defaults = {
        ...defaults,
        ...nxJsonConfiguration.generators[`${collectionName}:${generatorName}`],
      };
    }
  }
  if (projectName && projectsConfigurations?.projects[projectName]?.generators) {
    const g = projectsConfigurations.projects[projectName].generators;
    if (g[collectionName] && g[collectionName][generatorName]) {
      defaults = { ...defaults, ...g[collectionName][generatorName] };
    }
    if (g[`${collectionName}:${generatorName}`]) {
      defaults = {
        ...defaults,
        ...g[`${collectionName}:${generatorName}`],
      };
    }
  }
  return defaults;
}

async function promptForValues(
  opts: Options,
  schema: Schema,
  projectsConfigurations: ProjectsConfigurations
) {
  return await (
    await import("enquirer")
  )
    .prompt(getPromptsForSchema(opts, schema, projectsConfigurations))
    .then((values) => ({ ...opts, ...values }))
    .catch((e) => {
      console.error(e);
      process.exit(0);
    });
}

export async function combineOptionsForGenerator(
  commandLineOpts: Options,
  collectionName: string,
  generatorName: string,
  projectsConfigurations: ProjectsConfigurations,
  nxJsonConfiguration: NxJsonConfiguration,
  schema: Schema,
  isInteractive: boolean,
  defaultProjectName: string | null,
  relativeCwd: string | null,
  isVerbose = false
) {
  //   const generatorDefaults = projectsConfigurations
  //     ? getGeneratorDefaults(
  //         defaultProjectName,
  //         projectsConfigurations,
  //         nxJsonConfiguration,
  //         collectionName,
  //         generatorName
  //       )
  //     : {};
  const generatorDefaults = {};
  let combined = convertAliases(
    coerceTypesInOptions({ ...generatorDefaults, ...commandLineOpts }, schema),
    schema,
    false
  );
  console.log({ combined });
//   convertSmartDefaultsIntoNamedParams(combined, schema, defaultProjectName, relativeCwd);

//   if (isInteractive && isTTY()) {
//     combined = await promptForValues(combined, schema, projectsConfigurations);
//   }

//   warnDeprecations(combined, schema);
//   setDefaults(combined, schema);

//   validateOptsAgainstSchema(combined, schema);
//   applyVerbosity(combined, schema, isVerbose);
  return combined;
}
