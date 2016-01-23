var child       = require("child_process");
var progressBar = require("../progress-bar");

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

exports.description = "Creates a basic changelog categorized by designated github labels";

function getLastTag() {
  return execSync("git describe --abbrev=0 --tags");
}

exports.githubAPIrequest = function (url) {
  return execSync("curl -H 'Authorization: token " + process.env.GITHUB_AUTH + "' --silent " + url);
}

exports.getIssueData = function(issue) {
  var url  = "https://api.github.com/repos/" + org + "/" + repo + "/issues/" + issue;

  return exports.githubAPIrequest(url);
}

exports.getListOfCommits = function (config) {
  var lastTag = getLastTag(config);
  // console.log("Last tag: ", lastTag);

  var commits = execSync("git log --first-parent --oneline " + lastTag + "..").split("\n");
  return commits;
}

exports.getCommitInfo = function(commits) {
  var tick = progressBar(commits.length);

  var logs = commits.map(function(commit) {

    var sha = commit.slice(0,7);
    var message = commit.slice(8);
    var response;
    tick(sha);

    if (message.indexOf("Merge pull request ") === 0) {
      var start = message.indexOf("#") + 1;
      var end = message.slice(start).indexOf(" ");
      var issueNumber = message.slice(start, start + end);

      response = JSON.parse(exports.getIssueData(issueNumber));
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

exports.getCommitsByCategory = function(logs) {
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
};

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(text){
      return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
    });
}

function normalizeTag(tag) {
  return toTitleCase(tag.slice(5));
}

exports.createMarkdown = function(commitsByCategory) {
  var date = new Date().toISOString();
  date = date.slice(0, date.indexOf("T"));

  var markdown = "\n";

  markdown += "## Unreleased (" + date + ")";

  var tick = progressBar(commitsByCategory.length);

  commitsByCategory.filter(function(category) {
    return category.commits.length > 0;
  }).forEach(function(category) {
    tick(category.tag);

    markdown += "\n";
    markdown += "\n";
    markdown += "* **" + normalizeTag(category.tag) + "**";

    category.commits.forEach(function(commit) {
      markdown += "\n";

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

      var spaces = 2;

      if (changedPackages.length > 0) {
        markdown += repeat(" ", spaces) + "* ";

        changedPackages.forEach(function(package, i) {
          markdown += (i === 0 ? "" : ",") + "`" + package + "`";
        });

        markdown += "\n";

        // indent more?
        // spaces = 4;
      }

      if (commit.number) {
        var prUrl = "https://github.com/" + org + "/" + repo + "/pull/" + commit.number;
        markdown += repeat(" ", spaces) + "* ";
        markdown += "[#" + commit.number + "](" + prUrl + ")";
      }

      markdown += " " + commit.title + "." + " ([@" + commit.user.login + "](" + commit.user.html_url + "))";
    });
  });

  return markdown;
}

function repeat(str, times) {
  return Array(times + 1).join(str);
}

exports.execute = function (config) {
  var commits = exports.getListOfCommits(config);
  // console.log(commits);

  var commitInfo = exports.getCommitInfo(commits);
  // console.log(commitInfo);

  var commitsByCategory = exports.getCommitsByCategory(commitInfo);
  // console.log(commitsByCategory);

  var changelog = exports.createMarkdown(commitsByCategory);
  console.log(changelog);
};

function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
}
