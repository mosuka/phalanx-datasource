import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
// import { MyDataSourceOptions, MySecureJsonData } from './types';
import { MyDataSourceOptions } from './types';

// const { SecretFormField, FormField } = LegacyForms;
const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onEndpointChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      endpoint: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiKey: event.target.value,
      },
    });
  };

  // onResetAPIKey = () => {
  //   const { onOptionsChange, options } = this.props;
  //   onOptionsChange({
  //     ...options,
  //     secureJsonFields: {
  //       ...options.secureJsonFields,
  //       apiKey: false,
  //     },
  //     secureJsonData: {
  //       ...options.secureJsonData,
  //       apiKey: '',
  //     },
  //   });
  // };

  render() {
    const { options } = this.props;
    const { jsonData } = options;
    // const { jsonData, secureJsonFields } = options;
    // const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="Endpoint"
            labelWidth={10}
            inputWidth={24}
            onChange={this.onEndpointChange}
            value={jsonData.endpoint || ''}
            placeholder="E.g. http://localhost:8000"
          />
        </div>

        {/* <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.apiKey) as boolean}
              value={secureJsonData.apiKey || ''}
              label="API Key"
              placeholder="secure json field (backend only)"
              labelWidth={6}
              inputWidth={20}
              onReset={this.onResetAPIKey}
              onChange={this.onAPIKeyChange}
            />
          </div>
        </div> */}
      </div>
    );
  }
}
