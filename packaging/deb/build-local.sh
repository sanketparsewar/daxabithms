#!/usr/bin/env bash
# Build an installable .deb with the backend, web and PostgreSQL images bundled.
# Usage: packaging/deb/build-local.sh [version] [amd64|arm64]
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
version="${1:-$(node -p "require('$root/package.json').version")}"
version="${version#v}"
arch="${2:-$(dpkg --print-architecture)}"
image_prefix="ghcr.io/sanketparsewar/daxabithms"
bundle=$(mktemp "${TMPDIR:-/tmp}/daxabithms-images.XXXXXX.tar.gz")
trap 'rm -f "$bundle"' EXIT

command -v docker >/dev/null 2>&1 || {
  echo 'Docker is required to build the bundled Linux package.' >&2
  exit 1
}
docker buildx version >/dev/null 2>&1 || {
  echo 'Docker Buildx is required to build the bundled Linux package.' >&2
  exit 1
}
case "$arch" in
  amd64|arm64) ;;
  *) echo "Unsupported architecture: $arch (expected amd64 or arm64)." >&2; exit 1 ;;
esac

echo "Building DaxabitHMS $version images for linux/$arch"
docker buildx build --load --platform "linux/$arch" \
  --build-arg "APP_VERSION=$version" \
  -f "$root/apps/backend/Dockerfile" \
  -t "$image_prefix-backend:$version" "$root"
docker buildx build --load --platform "linux/$arch" \
  --build-arg "APP_VERSION=$version" \
  --build-arg BACKEND_URL=http://backend:4000 \
  -f "$root/apps/web/Dockerfile" \
  -t "$image_prefix-web:$version" "$root"
docker pull --platform "linux/$arch" postgres:16-alpine
docker save \
  "$image_prefix-backend:$version" \
  "$image_prefix-web:$version" \
  postgres:16-alpine | gzip -1 > "$bundle"

OUT_DIR="$root/dist" IMAGE_BUNDLE="$bundle" \
  bash "$here/build.sh" "$version" "$arch"
cp "$root/dist/daxabithms_${version}_${arch}.deb" \
  "$root/dist/daxabithms-latest-${arch}.deb"
echo "Complete package ready: $root/dist/daxabithms-latest-${arch}.deb"
