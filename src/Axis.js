import React from 'react';
import * as d3 from 'd3';

// Fixes the bug with axis not rendering at first.
// Source: https://stackoverflow.com/a/56029853

export const Axis: React.FC<Props> = props => {
  const { axisCreator, ...other } = props;

  const axisRef = (ref) => {
    if (ref) axisCreator(d3.select(ref));
  };

  return <g ref={axisRef} {...other} />;
};

export default Axis;
