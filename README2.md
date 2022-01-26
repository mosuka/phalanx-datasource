Create index

curl -XPUT -H 'Content-type: application/json' http://localhost:8000/v1/indexes/logs --data-binary @./testdata/create_index_logs.json

Add documents
flog -f json | ./bin/phalanx_docs.sh | curl -XPUT -H 'Content-type: application/x-ndjson' http://localhost:8000/v1/indexes/logs/documents --data-binary @-

Search
curl -XPOST -H 'Content-type: text/plain' http://localhost:8000/v1/indexes/logs/_search --data-binary @./testdata/search_index_logs.json | jq .