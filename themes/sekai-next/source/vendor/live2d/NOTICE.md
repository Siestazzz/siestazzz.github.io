# Live2D runtime notices

- PixiJS 7.4.3: MIT; see PIXI-LICENSE.txt.
- @sekai-world/pixi-live2d-display-mulmotion 0.5.1: MIT; see MULMOTION-LICENSE.txt. Upstream: https://github.com/Sekai-World/pixi-live2d-display . Bundled Cubism Framework notices in the distributed JavaScript remain intact.
- Cubism Core: © Live2D Inc., proprietary runtime, **not MIT**. Retrieved from the official Cubism 5.2 hosting endpoint; see provenance.json for exact source and SHA256. License: https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html . SDK release terms must be reviewed before public distribution.
- No GPL Sekai Viewer application files were copied into this theme. The theme's loading, layout and interaction adapter was written locally.
- Game character assets are separate from these code licenses. This notice does not grant rights to distribute Project Sekai models, textures, motions or dialogue.

Reproduce vendor files: `npm install --prefix tools/live2d-deps --ignore-scripts --no-audit --no-fund`, then `node tools/prepare-live2d.cjs`. Commit/release should pin and review provenance hashes; the upstream Core URL can change in future.
