```js
{
  "lerna": "<%= version %>",
  "version": "1.1.3",
  "commands": {
    "publish": {
      "ignore": [
        "ignored-file",
        "*.md"
      ]
    },
    "bootstrap": {
      "ignore": "component-*"
    }
  },
  "packages": ["packages/*"]
}
```
