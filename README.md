# Obsidian - Keep YAML comments

This is not intended to be a production-ready plugin as it cannot handle inline comments,
but it should provide a jumping-off point for someone to improve from.

## How to install

1. Install the BRAT plugin from the Community Plugins.
2. Open the Settings page for BRAT.
3. Click "Add Beta Plugin".
4. Paste in this address: `https://github.com/alangrainger/obsidian-yaml-comments`
5. Click "Add Plugin".

NOTE: This works for full comment lines, but not inline comments. It could be done, but the regex was pointlessly tricky with hash symbols in quoted strings, so I’ll leave that for someone else to pick up and submit a PR.

e.g.:

```yaml
---
some_prop: Some value
# this comment will be kept
foo: bar
some_list:
  - item 1 # this comment won't be kept
  # But this comment will be kept
  - item 2
tada: Hooray!
---
```

I don’t use comments myself, but hopefully this helps someone.
