# Using OIDC trusted publishing with Lerna

In v9.0.0, Lerna added support for OIDC trusted publishing, which is a solution developed by npm to secure the publishing process and not use traditional tokens or other fixed credentials.

The key idea is that your package(s) can be configured on the npm side to be required to be published from within a specific trusted environment such as GitHub Actions or GitLab CI.

Within these supported environments, the OIDC token is retrieved and used to publish the package instead of a user or automation token.

If you follow the official guidance from npm on how to configure your pipelines, then it will also just work for Lerna (v9 and later), no additional configuration is needed.

https://docs.npmjs.com/trusted-publishers

You can see a fully working example repo here: https://github.com/JamesHenry/lerna-v9-oidc-publishing-example
