# Project Crystal: Personalized Memory System (PMS) Architecture

## 1. Introduction & Philosophy

The **Personalized Memory System (PMS)** is the "long-term memory" of the Crystal writing environment. Unlike traditional note-taking apps that require manual tagging and organization, Crystal's PMS is **proactive, automatic, and multi-dimensional**.

### 1.1 Core Principles
- **Effortless Capture**: Memory is extracted automatically upon saving documents; the user never has to "organize" or "tag."
- **Dual-Dimension Recall**: The system remembers not just facts (The "What"), but also writing patterns (The "How").
- **Privacy First**: All memories are stored in the local environment (MySQL), ensuring sensitive data remains under user control.

---

## 2. Reference Analysis

### 2.1 Memos (Lightweight & Atomic)
*Ref: Use-Memos (GitHub)*
- **Strength**: Memos excels at capturing atomic snippets ("flashes of inspiration").
- **Crystal Integration**: We adopt Memos' **atomic storage** philosophy. Memories are stored as independent "nodes" rather than large files, allowing for granular retrieval.

### 2.2 Mem.ai (AI-Native Graph)
*Ref: Mem.ai*
- **Strength**: Uses AI to build a graph of information that surfaces contextually.
- **Crystal Integration**: We implement the **Proactive Recall** mechanism. When you start writing, the system identifies the "contextual intent" and injects relevant memories directly into the AI's prompt.

### 2.3 Obsidian (Structure & Links)
*Ref: Obsidian.md*
- **Strength**: Bidirectional linking and local-first data.
- **Crystal Integration**: We use **Source Attribution**: Every memory is linked back to its source Crystal document, allowing the user to verify facts.

---

## 3. The Extraction Layer (The "Ingestion")

Every time a Crystal is created or updated, a background Goroutine triggers the **Memory Extraction Engine**.

### 3.1 Fact Dimension (Knowledge)
- **Goal**: Extract specific data points.
- **Target Entities**: Project names, people, deadlines, technical definitions, goals.
- **Processing**: SiliconFlow analyzes the text and produces a JSON list of key entities.

### 3.2 Style Dimension (Voice)
- **Goal**: Extract the "User's Identity."
- **Target Markers**: Vocabulary complexity, sentence length preference, tone (academic/casual), formatting habits (bullet points vs. long prose).
- **Processing**: SiliconFlow creates a "Style Profile" snippet.

---

## 4. The Storage Layer (MySQL & Future Graph)

### 4.1 Current Phase: MySQL
We use a structured table `memories` in MySQL for speed and reliability.
- **Schema**: `id`, `category`, `content`, `entity`, `source_id`, `importance`.
- **Indexing**: Optimized for temporal and relevance-based queries.

### 4.2 Future Phase: Graph Database
As relationships grow complex, we will migrate to a **Graph DB (e.g., Neo4j/EdgeDB)**.
- **Node**: Memory Item.
- **Edge**: `MENTIONS`, `RELATED_TO`, `WRITTEN_IN_STYLE_OF`.
- **Benefit**: Allows the AI to navigate "Degrees of Separation" (e.g., finding the manager of a project mentioned in a related document).

---

## 5. The Retrieval & Injection Layer (The "Recall")

This is where the memory becomes useful. When the user triggers an AI action:

1.  **Context Analysis**: The system analyzes the current cursor position and surrounding text.
2.  **Vector/Keyword Retrieval**: It fetches the Top-5 related **Facts** and the Top-3 **Style Markers**.
3.  **Prompt Enrichment**:
    ```text
    User Memory Context:
    - [Project X] is using React 19 and is launching in May.
    - User prefers professional, bulleted summaries.
    ```
4.  **AI Response**: The completion or summary is generated using this context, making it feel hyper-personalized.

---

## 6. Security & Ethics

- **Local Storage**: All memory processing happens through the local backend.
- **Anonymization**: Style patterns are stored as generalized rules, not raw PII.
- **User Control**: Users can "flush" the memory or delete specific items via a future Settings panel.
