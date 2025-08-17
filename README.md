# 🧠 Pensieve

**Pensieve** is a framework for creating **self-describing, portable, and schema-linked Markdown notes**.
Each note carries its own “DNA” in the form of a reference to a schema, which defines its structure, styling, and machine-read/write behavior.

The goal is to make knowledge nuggets **shareable, editable, and interpretable** across tools, from Obsidian to web viewers to AI agents.

---

## ✨ Core Idea

A Pensieve note is just Markdown with YAML frontmatter.
In its frontmatter, it points to a **type schema**:

```yaml
---
type: recipe
pensive_schema: https://raw.githubusercontent.com/YourOrg/pensieve/main/schema/recipe/1.0.0.json
title: Carrot Cake
date: 2025-08-16
tags: [dessert, cake, carrot]
# … other fields required by the recipe schema …
---
```

That schema file tells any Pensieve-aware tool:

* **Frontmatter schema** → what fields exist and how to validate them.
* **Body rules** → what sections the Markdown should contain (e.g. `## Ingredients` as a bullet list).
* **Styling** → how to render the note in a viewer, via CSS tokens and type-specific themes.
* **MCP/LLM definitions** → how to read, edit, and search this note type programmatically.
* **Render hints** → optional suggestions for layout (TOC, galleries, callouts, etc.).

---

## 🧩 How it works

### 1. Core schema (`pensieve-core`)

* Defines what every type schema must include.
* Versioned (starting with `0.1.0`).
* Enforces consistency across all types (recipes, workouts, gardening, to-dos, etc.).

### 2. Type schemas (e.g., `recipe/1.0.0.json`)

* Conform to `pensieve-core`.
* Define frontmatter fields, body rules, styling, and actions for one content type.
* Are versioned independently.

### 3. Notes

* Markdown files that point to a schema via `pensive_schema`.
* Portable, human-readable, and machine-interpretable.
* Work in layers:

  * **Best case** → viewed in a Pensieve-aware app (styled, validated, searchable).
  * **Medium case** → opened in Obsidian/VSCode (still readable, schema can be used by a plugin).
  * **Worst case** → still just Markdown, readable by any text editor.

### 4. Tools

* **Web viewer** → fetches schema, validates, and renders notes with styling.
* **MCP server** → exposes schema-driven actions (e.g. “add ingredient” to a recipe).
* **Obsidian plugin** → auto-renders and validates Pensieve notes inside Obsidian.
* **Standalone app** → future full environment for Pensieve knowledge bases.

---

## 🚀 Work Plan

1. **Create the Pensieve core schema**

   * Define the “schema of schemas” (`pensieve-core/0.1.0.json`).
   * Establish versioning rules.

2. **Create the first type schema (Recipe)**

   * Complex enough to be useful, structured enough to prove the model.
   * Define frontmatter (title, tags, times, servings), body rules (ingredients, directions), styling, and MCP actions.

3. **Web viewer**

   * Lightweight HTML+JS that can read a note, fetch its schema, validate, and render it with styling.
   * Provide light/dark themes and pluggable tokens.

4. **MCP server**

   * Implements schema-defined actions for LLMs and clients.
   * Example: `add_ingredient`, `add_step`, `search by tag`.
   * Handles Git storage, validation, and versioning.

5. **Obsidian plugin**

   * Auto-detect `pensive_schema` in frontmatter.
   * Fetch schema, apply styling, validate, and provide editing helpers.

6. **Define more types**

   * To-do / task
   * Gardening note
   * Workout log
   * Journal entry
   * Any domain-specific structure

7. **Standalone app**

   * A desktop/mobile app designed around Pensieve notes.
   * Decentralized, local-first, schema-aware.

---

## 📦 Design Principles

* **Self-contained** → every note carries its schema pointer.
* **Versioned** → schemas are semantic-versioned; notes pin to exact schema versions.
* **Layered portability** → usable from plain text → Obsidian → web → AI.
* **Open and decentralized** → schemas published openly (e.g., on GitHub), notes live anywhere (Git, iCloud, Dropbox).
* **Composable styling** → schemas define CSS tokens and classnames so themes can be swapped without breaking layout.
* **AI-friendly** → MCP/LLM definitions inside schemas let tools know how to parse, edit, and query.

---

## 🔮 Roadmap & Ideas

* Schema registry → central index of all available types and versions.
* Theming system → global tokens + per-type themes.
* Schema evolution → migration tools between versions.
* Sharing → publish curated schema-linked notes as “knowledge packs.”
* Collaboration → sync or Git workflows with schema-aware merge.

---

## 📖 Example

A recipe note referencing the schema:

```yaml
---
type: recipe
pensive_schema: https://raw.githubusercontent.com/YourOrg/pensieve/main/schema/recipe/1.0.0.json
title: Banana Oatmeal Muffins
date: 2025-08-15
tags: [dessert, muffins, banana]
servings: 12 muffins
prep_time: 10 min
cook_time: 20 min
total_time: 30 min
---
```

```markdown
## Ingredients
- 2 ripe bananas
- 1 cup rolled oats
- 1/2 cup sugar

## Directions
1. Mash bananas.
2. Mix in oats and sugar.
3. Bake at 180°C for 20 min.
```

Viewed in Pensieve: nicely styled, searchable, and editable by MCP actions.
Viewed in plain Markdown: still clear and human-readable.

---

## ⚖️ License

TBD (MIT recommended for maximum openness).
