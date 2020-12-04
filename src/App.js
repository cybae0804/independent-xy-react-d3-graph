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
          {({ xScale, yScale, size, margins }) => { 
            const line = d3.line()
              .x((d) => xScale?.(d.lap))
              .y((d) => yScale?.(d.value));

            return (
              [
                {
                  key: 'bound',
                  type: 'clipPath',
                  attr: {
                    id: 'clip-path-id'
                  },
                  children: [
                    {
                      key: 'rect',
                      type: 'rect',
                      attr: {
                        width: size.width - margins.left - margins.right,
                        height: size.height - margins.top - margins.bottom,
                        transform: `translate(${margins.left},${margins.top})`,
                      }
                    }
                  ]
                },
                {
                  key: 'test',
                  type: 'path',
                  attr: {
                    'clip-path': "url(#clip-path-id)",
                    d: line([
                      { lap: 1, value: 10 },
                      { lap: 30, value: 50 },
                      { lap: 50, value: 36 },
                      { lap: 60, value: 23 },
                      { lap: 80, value: 56 },
                      { lap: 90, value: 67 },
                    ]),
                    stroke: "black",
                    fill: "none",
                    'stroke-width': 1,
                  },
                  listeners: {
                    mouseover: console.log,
                  },
                },
            ]);
          }}
        </D3Graph>

        <button
          onClick={() => this.graphRef.current?.zoomToX([30, 50])}
        > TEXT </button>
      </div>
    );
  }
}
