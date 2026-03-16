"use strict";

module.exports = {
  transform: (commit, context) => {
    let discard = true;
    const issues = [];
    const result = { ...commit, notes: [...commit.notes], references: [...commit.references] };

    result.notes.forEach((note, i) => {
      result.notes[i] = { ...note, title: `BREAKING CHANGES` };
      discard = false;
    });

    if (result.type === `feat`) {
      result.type = `Features`;
    } else if (result.type === `fix`) {
      result.type = `Bug Fixes`;
    } else if (result.type === `perf`) {
      result.type = `Performance Improvements`;
    } else if (result.type === `revert`) {
      result.type = `Reverts`;
    } else if (discard) {
      return;
    } else if (result.type === `docs`) {
      result.type = `Documentation`;
    } else if (result.type === `style`) {
      result.type = `Styles`;
    } else if (result.type === `refactor`) {
      result.type = `Code Refactoring`;
    } else if (result.type === `test`) {
      result.type = `Tests`;
    } else if (result.type === `build`) {
      result.type = `Build System`;
    } else if (result.type === `ci`) {
      result.type = `Continuous Integration`;
    }

    if (result.scope === `*`) {
      result.scope = ``;
    }

    if (typeof result.hash === `string`) {
      result.hash = result.hash.substring(0, 7);
    }

    if (typeof result.subject === `string`) {
      let url = context.repository
        ? `${context.host}/${context.owner}/${context.repository}`
        : context.repoUrl;
      if (url) {
        url = `${url}/issues/`;
        // Issue URLs.
        result.subject = result.subject.replace(/#([0-9]+)/g, (_, issue) => {
          issues.push(issue);
          return `[#${issue}](${url}${issue})`;
        });
      }
      if (context.host) {
        // User URLs.
        result.subject = result.subject.replace(
          /\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g,
          `[@$1](${context.host}/$1)`
        );
      }
    }

    // remove references that already appear in the subject
    result.references = result.references.filter((reference) => {
      if (issues.indexOf(reference.issue) === -1) {
        return true;
      }

      return false;
    });

    return result;
  },
  groupBy: `type`,
  commitGroupsSort: `title`,
  commitsSort: [`scope`, `subject`],
  noteGroupsSort: `title`,
  // notesSort: compareFunc,
  mainTemplate: [
    "{{> header}}",
    "",
    "{{#each commitGroups}}",
    "{{#each commits}}",
    "{{> commit root=@root}}",
    "{{/each}}",
    "{{/each}}",
    "",
    "{{> footer}}",
  ].join("\n"),
  headerPartial: [
    '<a name="{{version}}"></a>',
    "## {{#if isPatch~}} <small>",
    "{{~/if~}} {{version}}",
    '{{~#if title}} "{{title}}"',
    "{{~/if~}}",
    "{{~#if date}} ({{date}})",
    "{{~/if~}}",
    "{{~#if isPatch~}} </small>",
    "{{~/if}}",
    "",
  ].join("\n"),
  commitPartial: "* {{header}}",
  footerPartial: [
    "{{#if noteGroups}}",
    "{{#each noteGroups}}",
    "",
    "### {{title}}",
    "",
    "{{#each notes}}",
    "* {{text}}",
    "{{/each}}",
    "{{/each}}",
    "{{/if}}",
  ].join("\n"),
};
