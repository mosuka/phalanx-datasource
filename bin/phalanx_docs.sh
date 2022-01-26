#!/bin/bash

# Show help
usage() {
  cat << EOS >&2
phalanx_docs.sh
  Generate documents for Phalanx indexing from flat JSONL(NDJSON).

USAGE:
  phalanx_docs.sh [options] <input_file>

OPTIONS:
  -i, --id-field        Specify the unique ID field name in the input data.
  -h, --help            Show this help message.

ARGS:
  <input_file>          Input file path.
EOS
}

# Show error message
invalid() {
  usage 1>&2
  echo "$@" 1>&2
  exit 1
}

# Parse command line options
ARGS=()
while (( $# > 0 ))
do
  case $1 in
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      invalid "Illegal option -- '$(echo $1 | sed 's/^-*//')'."
      exit 1
      ;;
    *)
      ARGS=("${ARGS[@]}" "$1")
      ;;
  esac
  shift
done

# Set input file name
FILENAME=${ARGS[0]}

if  [ -p /dev/stdin ]; then
    cat -
else
    cat ${FILENAME}
fi | while read LINE
do
  UUID=$(uuidgen)
  # DATETIME=$(date +%Y-%m-%dT%H:%M:%S%Z)
  DATETIME=$(TZ=UTC date +%Y-%m-%dT%H:%M:%S%Z | sed 's/UTC/Z/')
  # DATETIME=$(date +%Y-%m-%dT%H:%M:%S%z)
  # DATETIME=$(date --rfc-3339=seconds)
  # DATETIME=$(date --rfc-3339=seconds | sed 's/ /T/')
  echo ${LINE} | jq --arg uuid "${UUID}" --arg datetime "${DATETIME}" -r -c '. |= . + { "_id": $uuid, "datetime": $datetime }'
done
