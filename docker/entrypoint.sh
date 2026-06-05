#!/bin/sh
set -e

: "${PAGE_TITLE:=}"
: "${KROKI_ENDPOINT:=https://kroki.io}"
: "${EXAMPLE_KROKI_ENDPOINT:=}"
: "${ENABLED_DIAGRAMS:=}"
: "${DEFAULT_DIAGRAM:=plantuml}"
: "${MERMAID_CLIENT_SIDE:=false}"
: "${EXAMPLE_PLANTUML:=}"
: "${EXAMPLE_MERMAID:=}"
: "${EXAMPLE_GRAPHVIZ:=}"
: "${EXAMPLE_D2:=}"

envsubst '$PAGE_TITLE $KROKI_ENDPOINT $EXAMPLE_KROKI_ENDPOINT $ENABLED_DIAGRAMS $DEFAULT_DIAGRAM $MERMAID_CLIENT_SIDE $EXAMPLE_PLANTUML $EXAMPLE_MERMAID $EXAMPLE_GRAPHVIZ $EXAMPLE_D2' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
