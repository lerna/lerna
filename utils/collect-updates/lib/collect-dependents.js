"use strict";

module.exports = collectDependents;

function collectDependents(nodes) {
  const collected = new Set();

  nodes.forEach(currentNode => {
    if (currentNode.localDependents.size === 0) {
      // no point diving into a non-existent tree
      return;
    }

    // depth-first search
    const seen = new Set();
    const visit = (dependentNode, dependentName, siblingDependents) => {
      if (seen.has(dependentNode)) {
        return;
      }

      seen.add(dependentNode);

      if (dependentNode === currentNode || siblingDependents.has(currentNode.name)) {
        // a direct or transitive cycle, skip it
        return;
      }

      collected.add(dependentNode);

      dependentNode.localDependents.forEach(visit);
    };

    currentNode.localDependents.forEach(visit);
  });

  return collected;
}
