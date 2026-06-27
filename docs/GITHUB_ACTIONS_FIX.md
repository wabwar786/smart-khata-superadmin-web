# GitHub Actions Fix

The previous workflow used `cache: npm` in `actions/setup-node`, but the repository does not include a `package-lock.json`. GitHub Actions requires a lock file when npm caching is enabled.

Fixed changes:

- Removed `cache: npm`
- Changed Node version to 24
- Added `vite.config.js` with `base: './'` so GitHub Pages loads assets correctly from a project subpath

After replacing files, push to GitHub and run the workflow again.
