import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onIndexNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, indexName: event.target.value });
    // executes the query
    onRunQuery();
  };

  onTimestampFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, timestampField: event.target.value });
    // executes the query
    onRunQuery();
  };

  onQueryStringChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryString: event.target.value });
    // executes the query
    onRunQuery();
  };

  onFieldListChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, fieldList: event.target.value });
    // executes the query
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { indexName, timestampField, queryString, fieldList } = query;

    return (
      <div className="gf-form">
        <FormField
          labelWidth={10}
          value={indexName || ''}
          onChange={this.onIndexNameChange}
          label="Index Name"
          tooltip="Index name to search for"
        />
        <FormField
          labelWidth={10}
          value={timestampField || ''}
          onChange={this.onTimestampFieldChange}
          label="Timestamp Field"
          tooltip="Timestamp field to use for the query"
        />
        <FormField
          labelWidth={10}
          value={queryString || ''}
          onChange={this.onQueryStringChange}
          label="Query Text"
          tooltip="Query string you wish to parse and use for search"
        />
        <FormField
          labelWidth={10}
          value={fieldList || ''}
          onChange={this.onFieldListChange}
          label="Field List"
          tooltip="Enter the field name to be retrieved, separated by commas"
        />
      </div>
    );
  }
}
