# Standalone examples

These folders preserve the standalone demo copies originally supplied at the project root:

- [Red sour soup](hongsuantang-demo/index.html)
- [Long-table feast](miao-feast-demo-centered-video/index.html)

Both folders were moved intact on 2026-09-08. Their files matched the corresponding `public/games/hongsuantang/` and `public/games/miao-feast/` files by SHA-256 before the move.

The application loads the copies in `public/games/`. Make production game changes there; treat these examples as reference snapshots. These examples are outside Vite's production asset directory and are not included in the production build.

To preview locally, run `python -m http.server 8001 --directory examples` from the project root and open the appropriate folder on `http://127.0.0.1:8001/`.
