import Repository from "./Repository";

const repository = new Repository(process.cwd());

export default {
  version: repository.version,
};
