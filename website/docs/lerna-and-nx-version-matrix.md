---
id: lerna-and-nx-version-matrix
title: Lerna and Nx Version Matrix
type: explainer
---

# Lerna and Nx Versions

The latest version of Lerna is kept up to date with the latest major version of Nx in order to support the latest features. If you have an older version of Lerna or Nx, you can use the table below to ensure compatibility between the two.

## Lerna and Nx Version Compatibility Matrix

Below is a reference table that matches versions of Lerna to the version of Nx that is compatible with it.

We provide a recommended version, and it is usually the latest minor version of Nx in the range provided because there will have been bug fixes added since the first release in the range.

| Lerna Version       | **Nx Version _(recommended)_** | Nx Version _(range)_ |
| ------------------- | ------------------------------ | -------------------- |
| `>=8.0.0 <= latest` | **latest**                     | `>=17.1.2 < 20`      |
| `>=7.1.4 < 8.0.0`   | `16.10.0`                      | `>=16.5.1 < 17`      |
| `>= 7.0.0 < 7.1.4`  | `16.10.0`                      | `>=16.3.1 < 17`      |
| `>= 6.5.0 < 7.0.0`  | `15.9.4`                       | `>=15.5.2 < 16`      |
| `>= 6.4.0 < 6.5.0`  | `15.9.4`                       | `>=15.4.2 < 16`      |
| `>= 6.0.1 < 6.4.0`  | `15.9.4`                       | `>=14.8.6 < 16`      |
| `>= 5.6.0 < 6.0.1`  | `15.9.4`                       | `>=14.8.1 < 16`      |
| `>=5.5.0 < 5.6.0`   | `15.9.4`                       | `>=14.6.1 < 16`      |
| `>=5.4.0 < 5.5.0`   | `15.9.4`                       | `>=14.5.4 < 16`      |
| `>= 5.2.0 < 5.4.0`  | `15.9.4`                       | `>=14.4.3 < 16`      |
| `< 5.2.0`           | N/A\*                          | N/A\*                |

\*Lerna does not depend on Nx before version 5.2.0
