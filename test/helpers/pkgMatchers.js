import semver from "semver";

const matchDependency = dependecyType => {
  return (manifest, pkg, range) => {
    const noDeps = typeof manifest[dependecyType] !== 'object';
    const id = [pkg, range].filter(Boolean).join('@');
    const verb = dependecyType === 'dependencies'
      ? 'depend'
      : 'dev-depend';

    const expectation = `expected ${manifest.name} to ${verb} on ${id}`;
    const json = JSON.stringify(manifest[dependecyType], null, '  ');

    if (noDeps) {
      return {
        message: `${expectation} but no .${dependecyType} specified`,
        pass: false
      }
    }

    const missingDep = !(pkg in manifest[dependecyType]);

    if (missingDep) {
      return {
        message: `${expectation} but it is missing from .${dependecyType}\n${json}`,
        pass: false
      };
    }

    const version = manifest[dependecyType][pkg];
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
