# novanotation

Validator and reference for **Nova Notation**, a compact handwriting-first notation for the
dice state of the Nova card game. Paste a transcript, get every illegal move by turn, the final
board, and the computed winner.

The notation itself is specified in [`docs/notation.md`](docs/notation.md).

```
first: WE
1| A4 -A1
2| A'4
3| B4 -B2 (-A'2)
4| xB
```

## Layout

- `src/lib/` — pure core: `parse.ts` (tokens → turns), `rules.ts` (validate/apply a move),
  `game.ts` (turn order, instants, win detection), `state.ts`, `notation.ts`.
- `src/lib/examples.ts` — the canonical valid and invalid games used by tests and the UI.
- `src/routes/` — validator page (`/`) and reference page (`/about`).

## Scripts

```sh
pnpm dev        # dev server
pnpm test       # vitest, single run
pnpm examples   # trace the example games in the terminal
pnpm verify     # format, lint, check, test, build
```

Stack: SvelteKit 2, Svelte 5, Tailwind v4, TypeScript, Vitest, pnpm.
