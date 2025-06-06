/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { Provider } from 'react-redux';
import { type EnhancedStore, configureStore } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { KbnPalettes } from '@kbn/palettes';
import { IFieldFormat } from '@kbn/field-formats-plugin/common';
import { SerializedValue } from '@kbn/data-plugin/common';
import { colorMappingReducer, updateModel } from './state/color_mapping';
import { Container } from './components/container/container';
import { ColorMapping } from './config';
import { uiReducer } from './state/ui';

export interface ColorMappingInputCategoricalData {
  type: 'categories';
  /**
   * An **ordered** array of serialized categories rendered in the visualization
   */
  categories: SerializedValue[];
}

export interface ColorMappingInputContinuousData {
  type: 'ranges';
  min: number;
  max: number;
  bins: number;
}

/**
 * A configuration object that is required to populate correctly the visible categories
 * or the ranges in the CategoricalColorMapping component
 */
export type ColorMappingInputData =
  | ColorMappingInputCategoricalData
  | ColorMappingInputContinuousData;

/**
 * The props of the CategoricalColorMapping component
 */
export interface ColorMappingProps {
  /**
   * The initial color mapping model, usually coming from a the visualization saved object
   */
  model: ColorMapping.Config;
  /**
   * A collection of palette configurations
   */
  palettes: KbnPalettes;
  /**
   * A data description of what needs to be colored
   */
  data: ColorMappingInputData;
  /**
   * Theme dark mode
   */
  isDarkMode: boolean;
  /**
   * A map between original and formatted tokens used to handle special cases, like the Other bucket and the empty bucket
   */
  specialTokens: Map<string, string>;
  /**
   * A function called at every change in the model
   */
  onModelUpdate: (model: ColorMapping.Config) => void;
  /**
   * Formatter for raw value assignments
   */
  formatter?: IFieldFormat;
  /**
   * Allow custom match rule when no other option is found
   */
  allowCustomMatch?: boolean;
}

/**
 * The React component for mapping categorical values to colors
 */
export class CategoricalColorMapping extends React.Component<ColorMappingProps> {
  store: EnhancedStore<{ colorMapping: ColorMapping.Config }>;
  unsubscribe: () => void;
  constructor(props: ColorMappingProps) {
    super(props);
    // configure the store at mount time
    this.store = configureStore({
      preloadedState: {
        colorMapping: props.model,
      },
      reducer: {
        colorMapping: colorMappingReducer,
        ui: uiReducer,
      },
    });
    // subscribe to store changes to update external tools
    this.unsubscribe = this.store.subscribe(() => {
      this.props.onModelUpdate(this.store.getState().colorMapping);
    });
  }
  componentWillUnmount() {
    this.unsubscribe();
  }
  componentDidUpdate(prevProps: Readonly<ColorMappingProps>) {
    if (!isEqual(prevProps.model, this.props.model)) {
      this.store.dispatch(updateModel(this.props.model));
    }
  }
  render() {
    const { palettes, data, isDarkMode, specialTokens, formatter, allowCustomMatch } = this.props;
    return (
      <Provider store={this.store}>
        <Container
          palettes={palettes}
          data={data}
          isDarkMode={isDarkMode}
          specialTokens={specialTokens}
          formatter={formatter}
          allowCustomMatch={allowCustomMatch}
        />
      </Provider>
    );
  }
}
