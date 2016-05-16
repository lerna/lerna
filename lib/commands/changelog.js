var progressBar = require("../progress-bar");
var chalk       = require("chalk");
var child       = require("child_process");

function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
}

var org  = process.env.GITHUB_ORG;
var repo = process.env.GITHUB_REPO;

var tags = [
  "tag: breaking change",
  "tag: spec compliancy",
  "tag: new feature",
  "tag: bug fix",
  "tag: documentation",
  "tag: internal",
  "tag: polish"
];

var baseIssueUrl = "https://phabricator.babeljs.io/";

function getLastTag() {
  return execSync("git describe --abbrev=0 --tags");
}

function githubAPIrequest(url) {
  return execSync("curl -H 'Authorization: token " + process.env.GITHUB_AUTH + "' --silent " + url);
}

function getIssueData(issue) {
  var url  = "https://api.github.com/repos/" + org + "/" + repo + "/issues/" + issue;
  return githubAPIrequest(url);
}

function getListOfCommits(config) {
  var lastTag = getLastTag(config);
  var commits = execSync("git log --first-parent --oneline " + lastTag + "..").split("\n");
  return commits;
}

function getCommiters(commits) {
  var committers = commits.map(function(commit) {
    return commit.user && commit.user.login;
  });

  return committers.filter(function(item, pos) {
    return item && committers.indexOf(item) === pos;
  });
}

function getCommitInfo(commits) {
  var tick = progressBar(commits.length);

  var logs = commits.map(function(commit) {

    var sha = commit.slice(0, 7);
    var message = commit.slice(8);
    var response;
    tick(sha);

    var mergeCommit = message.match(/\(#\d{4}\)$/);

    if (message.indexOf("Merge pull request ") === 0) {
      var start = message.indexOf("#") + 1;
      var end = message.slice(start).indexOf(" ");
      var issueNumber = message.slice(start, start + end);

      response = JSON.parse(getIssueData(issueNumber));
      response.commitSHA = sha;
      response.mergeMessage = message;
      return response;
    } else if (mergeCommit) {
      var issueNumber = mergeCommit[0].slice(2, 6);
      response = JSON.parse(getIssueData(issueNumber));
      response.commitSHA = sha;
      response.mergeMessage = message;
      return response;
    }

    return {
      commitSHA: sha,
      message: message,
      labels: []
    };
  });

  return logs;
}

function getCommitsByCategory(logs) {
  var categories = tags.map(function(tag) {
    var commits = [];

    logs.forEach(function(log) {
      var labels = log.labels.map(function(label) {
        return label.name;
      });

      if (labels.indexOf(tag.toLowerCase()) >= 0) {
        commits.push(log);
      }
    });

    return {
      tag: tag,
      commits: commits
    };
  });

  return categories;
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(text){
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
    });
}

function normalizeTag(tag) {
  return toTitleCase(tag.slice(5));
}

function createMarkdown(commitsByCategory) {
  var date = new Date().toISOString();
  date = date.slice(0, date.indexOf("T"));

  var fixesRegex = /Fix(es)? ([T#]\d+)/i;

  var markdown = "\n";

  markdown += "## Unreleased (" + date + ")";

  var tick = progressBar(commitsByCategory.length);

  commitsByCategory.filter(function(category) {
    return category.commits.length > 0;
  }).forEach(function(category) {
    tick(category.tag);

    markdown += "\n";
    markdown += "\n";
    markdown += "#### " + normalizeTag(category.tag);

    category.commits.forEach(function(commit) {
      markdown += "\n";

      console.log(commit);

      var changedPackages =
      execSync("git log -m --name-only --pretty='format:' " + commit.commitSHA)
      // not sure why it's including extra files
      .split("\n\n")[0]
      // turn into an array
      .split("\n")
      // remove files that aren't in packages/
      .filter(function(files) {
        return files.indexOf("packages/") >= 0;
      })
      // extract base package name
      .map(function(files) {
        files = files.slice(9);
        return files.slice(0, files.indexOf("/"));
      })
      // unique packages
      .filter(function(value, index, self) {
        return self.indexOf(value) === index;
      });

      var spaces = 0;

      console.log(changedPackages);

      if (changedPackages.length > 0) {
        markdown += repeat(" ", spaces) + "* ";

        changedPackages.forEach(function(package, i) {
          markdown += (i === 0 ? "" : ", ") + "`" + package + "`";
        });

        markdown += "\n";

        // indent more?
        spaces = 2;
      }

      if (commit.number) {
        var prUrl = "https://github.com/" + org + "/" + repo + "/pull/" + commit.number;
        markdown += repeat(" ", spaces) + "* ";
        markdown += "[#" + commit.number + "](" + prUrl + ")";
      }


      if (commit.title.match(fixesRegex)) {
        commit.title = commit.title.replace(fixesRegex, "Fixes [$2](" + baseIssueUrl + "$2)");
      }

      markdown += " " + commit.title + "." + " ([@" + commit.user.login + "](" + commit.user.html_url + "))";
    });
  });

  return markdown;
}

function repeat(str, times) {
  return Array(times + 1).join(str);
}

exports.description = "Create a changelog";


exports.execute = function (config) {
  if (!process.env.GITHUB_AUTH) {
    console.log(chalk.red("Must provide GITHUB_AUTH"));
    process.exit(1);
  }

  var commits = getListOfCommits(config);
  var commitInfo = getCommitInfo(commits);

  console.log(commitInfo);

  var committers = getCommiters(commitInfo);
  var commitsByCategory = getCommitsByCategory(commitInfo);
  var changelog = createMarkdown(commitsByCategory);

  console.log(changelog);

  console.log("");
  console.log("#### Commiters: " + committers.length);
  console.log(committers.sort().map(function(commiter) {
    return "- " + commiter;
  }).join("\n"));
  console.log("");

  process.exit();
};
