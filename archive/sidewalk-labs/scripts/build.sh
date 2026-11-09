#!/usr/bin/env sh
# Assembles dist/ for the dtpr-archive Worker:
#   dist/            public/ (landing page)
#   dist/vision/     vision/ built with its own webpack 4 toolchain
#   dist/interaction/ and dist/chatbot/  copied as-is (plain static files)
set -eu
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp -R public/. dist/

(cd vision && pnpm install --frozen-lockfile && pnpm build)
cp -R vision/_build dist/vision

mkdir -p dist/interaction dist/chatbot
cp -R interaction/. dist/interaction/
cp -R chatbot/. dist/chatbot/

echo "dist/: $(find dist -type f | wc -l | tr -d ' ') files"
