# FlowCrystal

An AI-native workspace that combines real-time team communication, linked knowledge editing, and a personalized memory system in one desktop product.

FlowCrystal is built around a simple idea:

- `Flow` captures fast-moving conversation and intent.
- `Crystal` turns ideas into structured, durable knowledge.
- `Memory` continuously extracts, recalls, and evolves what matters across a user's workspace.

This repository contains the current desktop client, backend services, and design documentation for the platform.

## Why FlowCrystal

Most tools split the work into separate silos:

- chat lives in one place
- notes live in another
- long-term context lives nowhere

FlowCrystal is designed to close that loop.

It gives users:

- a real-time communication surface for team flow
- a rich crystal editor with wiki-style linking
- AI actions and inline continuation
- cross-crystal personalized memory recall
- a memory vault for inspecting, tuning, and deleting extracted memories

## Current Highlights

### Real-time Flow workspace

- Multi-channel real-time messaging over WebSocket
- Online user presence
- Chat messages can be crystallized into editable knowledge documents

### Crystal editor

- Rich document editing powered by Tiptap
- `[[wiki links]]` between crystals
- Backlinks and crystal preview on hover
- AI slash actions like summarize, improve, expand, and brief
- Ghost completion for inline continuation
- Auto-save and explicit sync state

### Personalized memory loop

- Automatic fact and style extraction when crystals are saved
- Cross-crystal recall based on the current user's full memory archive
- Memory injection into AI completion and AI action prompts
- Memory importance evolution through repeated recall
- Basic duplicate merging for recurring facts and style traces
- A dedicated `Memory Vault` UI for listing, filtering, adjusting, and deleting memories
- Source-aware memory browsing that can jump back to crystals

### Desktop-first product architecture

- Electron desktop shell
- React renderer for the main product UI
- Go backend for API, persistence, and WebSocket infrastructure
- MySQL for current structured persistence

## Screens and Modes

The product currently centers around three working modes:

- `Flow`: team communication and real-time chat
- `Crystals`: structured knowledge authoring and linked documents
- `Memory`: personal long-term memory inspection and tuning

## Tech Stack

### Frontend

- Electron
- React
- Vite
- Tailwind CSS
- Tiptap
- Lucide React
- Tippy.js

### Backend

- Go
- Gin
- GORM
- MySQL

### AI integration

- SiliconFlow-compatible chat completion endpoint

## Repository Structure

```text
.
├─ backend/
│  ├─ cmd/plate-server/        # Backend entrypoint
│  └─ internal/
│     ├─ db/                   # Database bootstrap and migrations
│     ├─ handlers/             # HTTP handlers, AI, memory, crystals
│     ├─ hub/                  # WebSocket hub
│     ├─ middleware/           # Auth middleware
│     ├─ models/               # GORM models
│     └─ router/               # API routes
├─ desktop-client/
│  ├─ src/main/                # Electron main process
│  ├─ src/preload/             # Electron preload bridge
│  └─ src/renderer/            # React application
├─ docs/                       # Product, architecture, and phase docs
└─ README.md
```

## Getting Started

### Prerequisites

- Go `1.20+`
- Node.js `18+`
- npm
- MySQL `8.0+`

### 1. Configure AI environment

Create `backend/.env`:

```env
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_MODEL=Qwen/Qwen2.5-72B-Instruct-Turbo
SILICONFLOW_ENDPOINT=https://api.siliconflow.cn/v1/chat/completions
```

### 2. Start the backend

```bash
cd backend
go run cmd/plate-server/main.go
```

The backend starts on `http://localhost:8080`.

### 3. Start the desktop client

```bash
cd desktop-client
npm install
npm run dev
```

## Build

### Backend

```bash
cd backend
go build ./...
```

### Desktop client

```bash
cd desktop-client
npm run build
```

## API Surface

The current backend includes APIs for:

- channels and message history
- WebSocket chat transport
- crystal CRUD
- crystal backlinks
- AI completion and AI actions
- memory recall
- memory listing, updating, and deletion

## Product Status

FlowCrystal is an actively evolving project.

The repository already contains working implementations for:

- Flow chat
- Crystal editing
- AI-assisted writing
- Phase 4 memory loop

The next major direction is Phase 5:

- unify the design language
- reduce UI heaviness and visual noise
- establish a more disciplined, premium desktop interface system
- refine the product around long-session use

## Design and Planning Docs

The `docs/` directory contains the working design record for the project, including:

- `Phase1_Design.md`
- `Phase2_Design.md`
- `Phase3_Design.md`
- `Phase4_Design.md`
- `UI_Style_Guide.md`
- `UI_Beautification_Direction.md`
- `Phase5_UI_Design_Language_Research.md`
- memory system architecture and final specs

## Important Notes

### Database configuration

The current MySQL bootstrap in `backend/internal/db/db.go` is still development-oriented and uses a local DSN directly in code.

For production or wider team use, this should be moved fully to environment variables before release.

### Scope of the current memory system

The current memory system is:

- user-scoped
- crystal-driven
- recall-based
- structured in MySQL

It is not yet a full vector retrieval or graph memory system.

That is an intentional staging choice for implementation speed and product iteration.

## Roadmap

- `Done`: real-time Flow chat foundation
- `Done`: crystal editor and wiki linking
- `Done`: AI actions and inline continuation
- `Done`: Phase 4 personalized memory loop
- `Next`: Phase 5 unified UI language and premium interaction polish
- `Later`: stronger semantic retrieval, richer source tracing, and expanded memory intelligence

## Contributing

This project is still evolving quickly, so the codebase is currently optimized more for product iteration than polished contributor onboarding.

If you want to contribute, start by reading:

- `README.md`
- `docs/Phase4_Design.md`
- `docs/Phase5_UI_Design_Language_Research.md`

## License

No license has been added yet.

If this repository is intended for broader public collaboration, adding an explicit license should be one of the next maintenance tasks.
