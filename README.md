# JSON Beautifier

A single-page JSON viewer with tree view, expand/collapse, and array key filter.

## Features

- **Parse / Beautify** — Paste JSON and view as a collapsible tree
- **Left/right layout** — Input on the left, tree on the right
- **Hide JSON** — Toggle to show only the tree (full width)
- **Expand All / Collapse All** — Global expand or collapse
- **Per-array** — Expand all / Collapse all for each array
- **Array index** — Array items show `[0]`, `[1]`, etc.
- **Array key filter** — For arrays of objects: pick a key to show only that key’s value in each object; other keys are hidden

## Usage

Open `index.html` in a browser, paste JSON into the textarea, and click **Parse / Beautify** (or press Ctrl/Cmd + Enter).

## Deploy (GitHub Pages)

The repo includes a GitHub Action that deploys to GitHub Pages on every push to `main`.

1. In the repo: **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or run the workflow manually from the **Actions** tab)

The site will be available at `https://<username>.github.io/JsonBeautifier/`.

## License

MIT
