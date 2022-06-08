// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Lerna",
  tagline: "The Original Tool For Javascript Monorepos",
  url: "https://lerna-docs.netlify.app",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "images/favicon.ico",
  organizationName: "lerna",
  projectName: "lerna",
  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  plugins: [],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        theme: {
          customCss: [require.resolve("./src/css/custom.css"), require.resolve("./src/css/helpers.css")],
        },
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
          ignorePatterns: ["/tags/**"],
          filename: "sitemap.xml",
        },
        gtag: {
          trackingID: "G-1LKTTC3R7Q",
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // algolia: {
      //   appId: "xxx",
      //   apiKey: "xxxx",
      //   indexName: "lerna",
      // },
      colorMode: {
        defaultMode: "light",
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      metadata: [
        { name: "keywords", content: "monorepo, javascript, typescript, lerna, nx, nrwl" },
        {
          name: "description",
          content:
            "Lerna is the standard tool for managing and publishing versioned Javascript packages from a same repository.",
        },
        { name: "og:image", content: "/images/media-lerna.png" },
      ],
      navbar: {
        title: "Lerna",
        logo: {
          alt: "Lerna Logo",
          src: "images/lerna-logo-dark.svg",
          srcDark: "images/lerna-logo-light.svg",
        },
        items: [
          {
            type: "doc",
            docId: "guides",
            position: "left",
            label: "Guides",
          },
          // { to: "/blog", label: "Blog", position: "left" },
          // {
          //   href: "https://nx.dev",
          //   className: "header-nxdev-link",
          //   "aria-label": "Nx documentation",
          //   position: "right",
          //   title: "Check Nx",
          //   label: "Nx",
          // },
          // {
          //   href: "https://nx.app",
          //   className: "header-nxdev-link",
          //   "aria-label": "Nx Cloud",
          //   position: "right",
          //   title: "Check Nx Cloud",
          //   label: "Nx Cloud",
          // },
          // {
          //   href: "https://nrwl.io",
          //   className: "header-nrwlio-link",
          //   "aria-label": "Nrwl consulting",
          //   position: "right",
          //   title: "Check Nrwl",
          //   label: "Nrwl",
          // },
          {
            href: "https://github.com/lerna/lerna",
            className: "header-github-link",
            "aria-label": "GitHub repository",
            position: "right",
            title: "Lerna on Github",
          },
        ],
        hideOnScroll: true,
      },
      footer: {
        links: [
          {
            title: "Resources",
            items: [
              {
                label: "Blog",
                href: "https://blog.nrwl.io/?utm_source=lerna.js.org",
              },
              {
                label: "Youtube Channel",
                href: "https://youtube.com/nrwl_io?utm_source=lerna.js.org",
              },
            ],
          },
          {
            title: "Help",
            items: [
              {
                label: "Guides",
                to: "/docs/guides",
              },
              {
                label: "Stack Overflow",
                href: "https://stackoverflow.com/questions/tagged/lerna",
              },
              {
                label: "Report Issues",
                href: "https://github.com/lerna/lerna/issues?q=is%3Aopen+is%3Aissue",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Twitter",
                href: "https://twitter.com/lerna",
              },
              {
                label: "GitHub",
                href: "https://github.com/lerna/lerna",
              },
              {
                label: "Newsletter",
                href: "https://go.nrwl.io/nx-newsletter?utm_source=lerna.js.org",
              },
              {
                label: "Slack",
                href: "https://go.nrwl.io/join-slack?utm_source=lerna.js.org",
              },
              {
                label: "Help Us",
                href:
                  "https://github.com/lerna/lerna/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Acommunity",
              },
            ],
          },
          {
            title: "Solutions",
            items: [
              {
                label: "Nx",
                href: "https://nx.dev/?utm_source=lerna.js.org",
              },
              {
                label: "NxCloud",
                href: "https://nx.app/?utm_source=lerna.js.org",
              },
              {
                label: "Nrwl",
                href: "https://nrwl.io/?utm_source=lerna.js.org",
              },
            ],
          },
        ],
        copyright: `Released under the MIT License. <br /> &copy; ${new Date().getFullYear()} Copyright Nrwl.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
