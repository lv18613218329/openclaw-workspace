# Graphic Notebook

A powerful graphic design and drawing application built with Electron, Vue 3, TypeScript, and tldraw.

## Tech Stack

- **Electron 28+** - Desktop application framework
- **Vue 3.4+** - Progressive JavaScript framework
- **TypeScript 5.3+** - Typed superset of JavaScript
- **Vite 5.0+** - Next-generation frontend build tool
- **tldraw 2.0+** - Infinite canvas for collaborative whiteboarding
- **Pinia** - Intuitive, type-safe state management for Vue
- **Element Plus** - Vue 3 UI component library

## Features

- **Infinite Canvas** - Draw, sketch, and design without boundaries
- **Professional Tools** - Shape tools, drawing tools, text, and more
- **Layer Management** - Organize your designs with layers
- **Component Library** - Reusable design components
- **Real-time Collaboration** - Work together with others (coming soon)
- **Export Options** - Export your work in various formats

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run in development mode:

   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
graphic-notebook/
├── electron/                 # Electron main process
│   ├── main.ts              # Main process entry
│   └── preload.ts           # Preload script
├── src/                     # Vue 3 renderer process
│   ├── main.ts              # Vue entry
│   ├── App.vue              # Root component
│   ├── router/              # Router configuration
│   ├── views/               # Page views
│   ├── components/          # Components
│   ├── stores/              # Pinia stores
│   ├── composables/         # Composables
│   ├── utils/               # Utilities
│   ├── services/            # Services
│   ├── types/               # TypeScript types
│   └── assets/              # Static assets
├── package.json
├── vite.config.ts
├── electron-builder.json
└── tsconfig.json
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run electron:build` - Build Electron app
- `npm run typecheck` - Run TypeScript type checking

## Development

### Adding New Components

Create new components in the `src/components/` directory:

```vue
<template>
  <div class="custom-component">
    <!-- Your component template -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.custom-component {
  /* Your component styles */
}
</style>
```

### Adding New Views

Create new views in the `src/views/` directory and add routes in `src/router/index.ts`.

### State Management

Use Pinia stores in `src/stores/` for global state management.

## License

MIT
