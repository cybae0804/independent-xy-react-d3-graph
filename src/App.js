import React, { createRef } from 'react';
import * as d3 from 'd3';

import './App.css';
import D3Graph from './D3Graph';

export default class App extends React.Component {
  state = {
    data: [
      { lap: 1, value: 10 },
      { lap: 30, value: 50 },
      { lap: 50, value: 36 },
      { lap: 60, value: 23 },
      { lap: 80, value: 56 },
      { lap: 90, value: 67 },
    ],
  };

  graphRef = createRef();

  newData = () => {
    this.setState({ data: [
      { lap: 1, value: 10 },
      { lap: 50, value: 36 },
      { lap: 30, value: 50 },
      { lap: 90, value: 67 },
      { lap: 80, value: 56 },
      { lap: 60, value: 23 },
      { lap: 0, value: 100 }
    ] });
  }

  noData = () => {
    this.setState({ data: null });
  }

  render() {
    return (
      <div className="App" style={{ position: 'relative', top: 50, left: 50}}>
        <D3Graph
          ref={this.graphRef}
          xDomain={[0, 100]}
          yDomain={[0, 100]}
        >
          {({ xScale, yScale, size, defaultClipPathId }) => { 
            const line = d3.line()
              .x((d) => xScale?.(d.lap))
              .y((d) => yScale?.(d.value));

            return (
              <path
                fill="none"
                d={line(this.state.data)}
                stroke="black"
                clipPath={`url(#${defaultClipPathId})`}
                onMouseMove={e => console.log(e.clientX - e.currentTarget.getBoundingClientRect().left, e.clientY - e.currentTarget.getBoundingClientRect().top)}
            />  
            );
          }}
        </D3Graph>

        <button onClick={this.newData}>newData </button>
        <button onClick={this.noData}>newData </button>
      </div>
    );
  }
}
