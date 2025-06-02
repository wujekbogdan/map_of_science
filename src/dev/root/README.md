# A dummy package to hold the changelog of the monorepo root package.

The Changesets tool is only able to version workspace packages - it's not able to version the root-directory package.
This package is a workaround - a bucket to hold the changelog of the root package.

I tried including the root package in the pnpm workspace (as `.`) - it did work with Changesets, but didn't work with Turbo,
since Turbo has its own handling of the root package, so turning it into a "regular" package made Turbo fail to run,
as it was expecting the root package's `turbo.json` to extend the true root `turbo.json` file.

I gave up trying to make it work and created this dummy package.
