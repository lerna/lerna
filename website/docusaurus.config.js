// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Lerna",
  tagline: "Original Monorepo Tool",
  url: "https://lerna.js.org",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "images/favicon.ico",
  organizationName: "lerna",
  projectName: "website",
  deploymentBranch: "master",
  trailingSlash: false,
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
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/lerna/lerna/tree/main/website/",
          sidebarCollapsed: false,
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
      algolia: {
        appId: "W7AFDUEIGE",
        apiKey: "95785b7a78017aade2bc8b82ca965e24",
        indexName: "lerna",
        contextualSearch: false,
        searchPagePath: false,
      },
      // announcementBar: {
      //   id: "lerna-talks",
      //   content:
      //     'State of JS survey: <a target="_blank" style="font-weight: bolder" rel="noopener noreferrer" href="https://stateofjs.com/en-us/">Give Nx & Lerna a thumbs up</a> <span aria-hidden="true">&rarr;</span>',
      //   backgroundColor: "#9333EA",
      //   textColor: "#FFFFFF",
      //   isCloseable: false,
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
        { name: "og:image", content: "https://lerna.js.org/images/og-image-lerna.png" },
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
            docId: "introduction",
            position: "left",
            label: "Docs",
          },
          {
            type: "doc",
            docId: "getting-started",
            position: "left",
            label: "Get Started",
          },
          { to: "/upgrade", label: "Upgrade", position: "left" },
          {
            href: "https://www.youtube.com/watch?v=ASCSTKX21jE",
            "aria-label": "What's New in Lerna 6.5",
            position: "left",
            title: "What's New in Lerna 6.5",
            label: `🎥 Lerna 6.5`,
          },
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
                href: "https://youtube.com/@nxdevtools?utm_source=lerna.js.org",
              },
            ],
          },
          {
            title: "Help",
            items: [
              {
                label: "Troubleshooting",
                to: "/docs/troubleshooting",
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
                href: "https://twitter.com/lernajs",
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
                href: "https://github.com/lerna/lerna/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3Acommunity",
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
