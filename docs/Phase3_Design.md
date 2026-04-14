# Phase 3 Design: Creative Pulse & Structural Logic

## 1. Goal: The "Creation First" Evolution
Following the connectivity established in Phase 2, Phase 3 transforms Plate into a powerhouse for **Creative Writing** and **Structured Knowledge Synthesis**. We will merge the fluid AI assistance of **Notion AI** (democratized via free API keys) with the local-first structural rigor of **Obsidian**, topped with two industry-first innovative features.

---

## 2. Core Pillars

### I. Copilot-X (The Notion AI Killer)
We will implement an inline AI command system that feels like magic.
- **Slash Commands (`/`)**: Trigger AI actions anywhere in the document.
  - `/summary`, `/continue`, `/improve`, `/brief`.
- **Selection Bubble Menu**: AI refinement options on selected text.
  - *Translate*, *Simplify*, *Change Tone*.

### II. Obsidian-Core (Structural Integrity)
Moving beyond flat crystals into a navigable library.
- **Folder Hierarchy**: Multi-level nesting (optional toggle) supported in the sidebar.
- **Tagging Engine**: Support `#tags` with a global tag clouds and auto-suggestion.
- **Block Reordering**: Smooth drag-and-drop for document sections.

### III. [INNOVATION 1] Aura Ghost Reconstruction (Time-Scrub)
*Inspired by Gaming "Ghost" replays.*
- **The Concept**: Traditional "Version History" is boring. Aura Ghost allows you to "scrub" a timeline at the bottom of the editor.
- **Visuals**: As you scrub back, deleted sentences appear as translucent, glowing "Ghosts" in their original positions.
- **Utility**: Instantly recover an "earlier vibe" of a paragraph without digging through diffs. You can click a ghost to "Exorcise" (restore) it back to reality.

### IV. [INNOVATION 2] Cognitive Gravity Engine (Dynamic Relevance)
*Inspired by Physics Simulation & Strategy Games.*
- **The Concept**: Your knowledge map isn't static. It has "Gravity".
- **Interaction**: The more you write about a specific topic (e.g., "AI Security"), the "Heavier" it becomes. Related crystals (via backlinks/keywords) will start to "pull" towards your current cursor.
- **Visuals**: Keywords in your current text will subtly glow with the color of the related crystal.
- **Action**: A "Gravity Pull" sidebar panel suggests content segments from other crystals that are "physically" closer to your current thought process, enabling "Near-Field Discovery".

---

## 3. Technical Implementation Plan

### A. Frontend: Tiptap V3 & Aura Physics
- **[NEW] Slash Command & Bubble Menu**: React portal-based floating menus.
- **[NEW] Ghost Timeline UI**: A performance-optimized canvas overlay for rendering deleted text ghosts.
- **[NEW] Gravity Middleware**: A background worker that calculates semantic similarity in real-time as you type.

### B. Backend: Metadata & Vectorization
- **Folder Support**: Update `crystals` table with `parent_id` for recursive nesting.
- **AI Action Hub**: Optimized prompt templates for SiliconFlow/DeepSeek.
- **Gravity Index**: A light embedding-based index for dynamic relevance (local or via API).

---

## 4. Proposed Timeline (Sprints)

| Sprint | Feature Area | Key Deliverables |
| :--- | :--- | :--- |
| **S1** | **Copilot-X & Structure** | Slash Menu UI, Folder/Tag logic |
| **S2** | **Aura Ghost Reconstruction** | Timeline UI, Diff-based Ghost rendering logic |
| **S3** | **Cognitive Gravity Engine** | Semantic relevance worker, Keyword Glow effects |
| **S4** | **Zen & Polish** | Zen Mode, Final performance tuning |

---

## 5. User Review Required

> [!IMPORTANT]
> **Ghost Engine Persistence**:
> To support Ghost Reconstruction, we need to save more frequent snapshots. This will increase database size. Is this acceptable for the sake of the "Ghost" experience?

---

## 6. Verification Plan
- **Innovation Check**: Verify "Ghost Scrub" doesn't lag the main editor (using a separate layer).
- **Gravity Accuracy**: Ensure suggested connections feel "relevant" and not random.
- **UI Harmony**: Ensure new floating elements don't clutter the Zen environment.
