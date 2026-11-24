#!/bin/sh
#
# Build the GNS3 Web UI and deploy it into a running GNS3 docker node.
#
# The node's /srv/ui is a persistent volume (appliance extra_volumes): the
# build is uploaded as /srv/ui/<version>+<commit>/ and selected via the
# /srv/ui/current symlink — hot swap, no node restart, survives restarts
# and image rebuilds.
#
# Usage:
#   scripts/deploy-node.sh                # build + deploy, auto-detect node
#   scripts/deploy-node.sh --no-build     # redeploy newest existing artifact
#   scripts/deploy-node.sh --node NAME    # explicit node container name
#
# Assumes the GNS3 compute's docker daemon runs on this machine.
# Iterative flow: edit code -> run this -> hard-refresh the browser.
set -e

cd "$(dirname "$0")/.."

NO_BUILD=0
NODE=""
while [ $# -gt 0 ]; do
    case "$1" in
        --no-build) NO_BUILD=1 ;;
        --node) NODE="$2"; shift ;;
        *) echo "Unknown argument: $1" >&2; exit 1 ;;
    esac
    shift
done

if [ -z "$NODE" ]; then
    MATCHES=$(docker ps --format '{{.Names}}' | grep -i 'webui' || true)
    if [ -z "$MATCHES" ]; then
        echo "ERROR: no running GNS3 WebUI node found; start the node or pass --node <container-name>" >&2
        exit 1
    fi
    if [ "$(printf '%s\n' "$MATCHES" | wc -l)" -gt 1 ]; then
        echo "ERROR: multiple running WebUI nodes found — pass --node <container-name> explicitly:" >&2
        printf '%s\n' "$MATCHES" | sed 's/^/  /' >&2
        exit 1
    fi
    NODE=$MATCHES
fi

VERSION=$(node -p "require('./package.json').version")
SHA=$(git rev-parse --short HEAD)
VERDIR="$VERSION+$SHA"

DEPLOY_DIR="${GNS3_WEB_UI_DEPLOY_DIR:-../gns3-web-ui-deploy/ui-versions}"
ART="$DEPLOY_DIR/$VERDIR"

if [ "$NO_BUILD" != "1" ]; then
    echo "==> Building $VERDIR"
    yarn ng build
fi

if [ ! -d dist/browser ]; then
    echo "ERROR: dist/browser not found — run once without --no-build first" >&2
    exit 1
fi

echo "==> Assembling artifact $ART"
mkdir -p "$DEPLOY_DIR" "$ART"
cp -r dist/browser/. "$ART"/
echo "$VERDIR" > "$ART/VERSION.txt"

echo "==> Deploying to node $NODE"
# /srv/ui is a bind mount created INSIDE the container by init.sh
# (mount --bind /gns3volumes/srv/ui /srv/ui). `docker cp` extracts from the
# daemon's host-side view of the container filesystem and does NOT traverse
# container-namespace mounts — files would silently land in a shadowed
# overlay path and never reach the volume. Write into /gns3volumes/srv/ui
# (the volume backing directory, visible inside the container) instead, and
# verify afterwards that the files actually landed.
VOLDIR="/gns3volumes/srv/ui"
if docker exec "$NODE" test -d "$VOLDIR"; then
    DEST="$VOLDIR"
else
    DEST="/srv/ui"
fi
docker cp "$ART" "$NODE:$DEST/"

if ! docker exec "$NODE" test -f "/srv/ui/$VERDIR/VERSION.txt"; then
    echo "ERROR: deploy verification failed — /srv/ui/$VERDIR/VERSION.txt missing (files did not reach the volume)" >&2
    exit 1
fi
docker exec "$NODE" ln -snf "$VERDIR" /srv/ui/current

echo "==> Deployed $VERDIR"
echo "    current -> $(docker exec "$NODE" readlink /srv/ui/current)"
echo "    open http://<node-ip>/ (hard-refresh the first time)"
