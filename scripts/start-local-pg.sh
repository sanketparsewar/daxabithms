#!/usr/bin/env bash
set -e
PG_DIR="$HOME/.nodedr-pg"
if ! LD_LIBRARY_PATH="$PG_DIR/usr/lib/x86_64-linux-gnu" "$PG_DIR/usr/lib/postgresql/16/bin/pg_isready" -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  echo "Starting local PostgreSQL server..."
  LD_LIBRARY_PATH="$PG_DIR/usr/lib/x86_64-linux-gnu" "$PG_DIR/usr/lib/postgresql/16/bin/pg_ctl" \
    -D "$PG_DIR/data" \
    -o "-p 5432 -k $PG_DIR/data" \
    -l "$PG_DIR/postgres.log" start
fi
