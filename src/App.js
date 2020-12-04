import React, { createRef } from 'react';
import * as d3 from 'd3';

import './App.css';
import D3Graph from './D3Graph';

export default class App extends React.Component {
  graphRef = createRef();

  render() {
    return (
      <div className="App">
        <D3Graph
          ref={this.graphRef}
          xDomain={[0, 100]}
          yDomain={[0, 100]}
        >
          {(xScale, yScale) => { 
            const line = d3.line()
              .x((d) => xScale?.(d.lap))
              .y((d) => yScale?.(d.value));

            return (
              <path
                d={line([
                  { lap: 1, value: 10 },
                  { lap: 30, value: 50 },
                  { lap: 50, value: 36 },
                  { lap: 60, value: 23 },
                  { lap: 80, value: 56 },
                  { lap: 90, value: 67 },
                ])}
                stroke="black"
                fill="none"
                strokeWidth={1}
              />
            );
          }}
        </D3Graph>

        <button
          onClick={() => this.graphRef.current?.zoomToX([30, 50])}
        > TEXT </button>
      </div>
    );
  }
}
