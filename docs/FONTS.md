# Fonts
Shipped in `public/fonts/` (Latin + Greek + math-symbol subset, `.woff`): Inter 400/500/600/700 + 600 italic, Inter Display 600/700 (headings), JetBrains Mono 400/700 (OFL, see JetBrainsMono-OFL.txt; Inter is OFL 1.1).
Not shipped (could not be downloaded in the build sandbox): Space Grotesk, DM Serif Display, Noto Sans Sinhala. Sinhala text falls back to the system Sinhala font.
To add Noto Sans Sinhala: download `noto-sans-sinhala-sinhala-400-normal.woff2` and `-600-` (e.g. `npm i @fontsource/noto-sans-sinhala`), copy to `public/fonts/`, and add `@font-face` rules next to the Inter ones in `index.html` plus `"Noto Sans Sinhala"` in `--f-ui` (already listed there).
