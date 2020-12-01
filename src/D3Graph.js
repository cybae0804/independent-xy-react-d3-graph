import React, { useState } from 'react';
import * as d3 from 'd3';
import classnames from 'classnames';

import Axis from './Axis';

const margin = {
  left: 40,
  right: 15,
  top: 15,
  bottom: 15,
};

const clipPathId = 'hello';

export const D3Graph = (props) => {
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [trans, setTrans] = useState(null);

  let xScale = d3.scaleLinear().domain(props.lapsMinMax).range([margin.left, size.width - margin.right]);
  let yScale = d3.scaleLinear().domain(props.deltaMinMax).range([size.height - margin.bottom, margin.top]);

  if (trans) {
    xScale = trans.rescaleX(xScale.domain(props.lapsMinMax));
    yScale = trans.rescaleY(yScale.domain(props.deltaMinMax));
  }

  const line = d3.line()
    .defined((d: any) => d.value !== null)
    .x((d: any) => xScale(d.lap))
    .y((d: any) => yScale(d.value));

  const updateChart = (e) => {
    setTrans(e.transform);
  };

  const handleZoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[margin.left, margin.top], [size.width - margin.right, size.height - margin.bottom]])
    .extent([[margin.left, margin.top], [size.width - margin.right, size.height - margin.bottom]])
    .on('zoom', updateChart);

  const handleResize = (entries: IResizeEntry[]) => {
    const { width, height } = entries?.[0]?.contentRect;
    setSize({ width, height });
  };

  return (
    <svg
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
      ref={(ref: any) => {
        if (ref) handleZoom(d3.select(ref));
      }}
    >
      <Axis
        axisCreator={d3.axisBottom(xScale)}
        transform={`translate(0, ${size.height - margin.bottom})`}
      />

      <Axis
        axisCreator={d3.axisLeft(yScale)}
        transform={`translate(${margin.left}, 0)`}
      />

      <clipPath id={clipPathId}>
        <rect
          width={size.width - margin.left - margin.right}
          height={size.height - margin.top - margin.bottom}
          transform={`translate(${margin.left},${margin.top})`}
        />
      </clipPath>
    </svg>
  );
};

export default D3Graph;
