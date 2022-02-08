import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

const MAX_INT32 = 2147483647;

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';

export function wildcardMatch(str: string, pattern: string) {
  if (pattern === '*') {
    return true;
  }

  if (pattern.indexOf('*') === -1) {
    return str === pattern;
  }

  const regex = new RegExp(
    pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\\/g, '\\\\')
  );

  return regex.test(str);
}

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  endpoint: string | undefined;
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.endpoint = instanceSettings.jsonData.endpoint;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.toISOString();
    const to = range!.to.toISOString();
    const endpoint = this.endpoint;

    // Return a constant for each query.
    var data: Array<MutableDataFrame<any>> = [];

    // Get cluster information
    var clusterUrl = `${endpoint}/cluster`;
    const clusterResp = await fetch(clusterUrl, {
      method: 'GET',
    });
    var clusterJson = await clusterResp.json();

    // Make index mapping map
    let indexMappings = new Map<string, any>();
    for (const indexName of Object.keys(clusterJson.indexes)) {
      indexMappings.set(indexName, clusterJson.indexes[indexName].index_mapping);
    }

    for (var i = 0; i < options.targets.length; i++) {
      var target = options.targets[i];

      const query = defaults(target, defaultQuery);
      const indexName = target.indexName;
      var url = `${endpoint}/v1/indexes/${indexName}/_search`;
      let headers = {
        'Content-Type': 'application/json',
      };
      var fields = query.fieldList.split(',').map(function(item) {
        return item.trim();
      });

      let requestBody = {
        query: {
          type: 'boolean',
          options: {
            must: [
              {
                type: 'query_string',
                options: {
                  query: `${query.queryString}`,
                },
              },
              {
                type: 'date_range',
                options: {
                  start: `${from}`,
                  end: `${to}`,
                  inclusive_start: true,
                  inclusive_end: true,
                  field: `${query.timestampField}`,
                  boost: 0.0,
                },
              },
            ],
          },
        },
        start: 0,
        num: MAX_INT32,
        sort_by: `-${query.timestampField}`,
        fields: fields,
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      var searchResp = await resp.json();

      var dataFrameFields = [];

      const indexMapping = indexMappings.get(indexName);
      for (const mappingField of Object.keys(indexMapping)) {
        for (const filterField of fields) {
          if (wildcardMatch(mappingField, filterField)) {
            switch (indexMapping[mappingField].type) {
              case 'datetime':
                dataFrameFields.push({
                  name: mappingField,
                  type: FieldType.time,
                });
                break;
              case 'geo_point':
                dataFrameFields.push({
                  name: mappingField,
                  type: FieldType.number,
                });
                break;
              case 'numeric':
                dataFrameFields.push({
                  name: mappingField,
                  type: FieldType.number,
                });
                break;
              case 'text':
                dataFrameFields.push({
                  name: mappingField,
                  type: FieldType.string,
                });
                break;
              default:
                dataFrameFields.push({
                  name: mappingField,
                  type: FieldType.string,
                });
                break;
            }
            continue;
          }
        }
      }

      var dataFrame = new MutableDataFrame({
        refId: query.refId,
        fields: dataFrameFields,
        meta: {
          preferredVisualisationType: 'logs',
        },
      });

      var docs = searchResp.documents;
      docs.forEach((doc: any) => {
        for (const fieldName of Object.keys(doc.fields)) {
          switch (indexMapping[fieldName].type) {
            case 'datetime':
              doc.fields[fieldName] = new Date(doc.fields[fieldName]).getTime();
              break;
          }
        }
        dataFrame.add(doc.fields);
      });

      data.push(dataFrame);
    }

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    if (!this.endpoint) {
      return {
        status: 'failure',
        message: 'Missing endpoint',
      };
    }

    var url = `${this.endpoint}/readyz`;

    let headers = {
      'Content-Type': 'application/json',
    };

    console.log('url', url);
    console.log('headers', headers);

    const resp = await fetch(url, {
      method: 'GET',
      headers: headers,
    })
      .then(response => {
        if (response.status === 200) {
          return {
            status: 'success',
            message: 'Success',
          };
        } else {
          return {
            status: 'failure',
            message: `Failure to connect. Status code: ${response.status}`,
          };
        }
      })
      .catch(error => {
        return {
          status: 'failure',
          message: 'Failure to connect. Error: ' + error.message,
        };
      });

    console.log('message', resp.message);

    return resp;
  }
}
