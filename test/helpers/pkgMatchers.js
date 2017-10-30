import semver from "semver";

const matchDependency = dependencyType => {
  return (manifest, pkg, range) => {
    const noDeps = typeof manifest[dependencyType] !== 'object';
    const id = [pkg, range].filter(Boolean).join('@');
    const verb = dependencyType === 'dependencies'
      ? 'depend'
      : 'dev-depend';

    const expectation = `expected ${manifest.name} to ${verb} on ${id}`;
    const json = JSON.stringify(manifest[dependencyType], null, '  ');

    if (noDeps) {
      return {
        message: `${expectation} but no .${dependencyType} specified`,
        pass: false
      }
    }

    const missingDep = !(pkg in manifest[dependencyType]);

    if (missingDep) {
      return {
        message: `${expectation} but it is missing from .${dependencyType}\n${json}`,
        pass: false
      };
    }

    const version = manifest[dependencyType][pkg];
    const mismatchedDep = range ? !semver.intersects(version, range) : false;

    if (mismatchedDep) {
      return {
        message: `${expectation} but ${version} does not satisfy ${range}\n${json}`,
        pass: false
      };
    }

    return {
      message: expectation,
      pass: true
    };
  }
};

export default {
  toDependOn: matchDependency('dependencies'),
  toDevDependOn: matchDependency('devDependencies')
}
