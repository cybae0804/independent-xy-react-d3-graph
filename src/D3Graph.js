import React, { createRef } from 'react';
import * as d3 from 'd3';
import equal from 'fast-deep-equal/react';

const margins = {
  left: 30,
  right: 15,
  top: 15,
  bottom: 15,
};

const size = {
  width: 500,
  height: 500,
};

export default class D3Graph extends React.Component {
  state = {
    elements: null,
  };

  svgRef = createRef();
  xAxisRef = createRef();
  yAxisRef = createRef();
  dataRef = createRef();

  gx = () => d3.select(this.xAxisRef.current);
  gy = () => d3.select(this.yAxisRef.current);

  componentDidMount() {
    this.tx = () => d3.zoomTransform(this.gx().node());
    this.ty = () => d3.zoomTransform(this.gy().node());

    this.initScales();
    this.initAxes();
    this.initZoom();
    this.initData();

    this.redraw();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!equal(prevState.elements, this.state.elements)) {
      this.redraw();
    }
  }

  initScales() {
    this.x = d3.scaleLinear()
      .domain(this.props.xDomain)
      .range([margins.left, size.width - margins.right]);
    this.y = d3.scaleLinear()
      .domain(this.props.yDomain)
      .range([size.height - margins.bottom, margins.top]);
  }

  initAxes() {
    this.xAxis = (g, scale) => g
      .attr("transform", `translate(0,${this.y(0)})`)
      .call(d3.axisBottom(scale));

    this.yAxis = (g, scale) => g
      .attr("transform", `translate(${this.x(0)},0)`)
      .call(d3.axisLeft(scale));
  }

  initZoom() {
    this.z = d3.zoomIdentity;

    this.zoomX = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[margins.left, margins.top], [size.width - margins.right, size.height - margins.bottom]])
      .extent([[margins.left, margins.top], [size.width - margins.right, size.height - margins.bottom]]);
    this.zoomY = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[margins.left, margins.top], [size.width - margins.right, size.height - margins.bottom]])
      .extent([[margins.left, margins.top], [size.width - margins.right, size.height - margins.bottom]]);

    this.zoom = d3.zoom().on("zoom", (e) => {
      const t = e.transform;
      const k = t.k / this.z.k;
      const point = e.sourceEvent ? d3.pointer(e) : [size.width / 2, size.height / 2];

      // is it on an axis?
      const doX = point[0] > this.x.range()[0];
      const doY = point[1] < this.y.range()[0];

      if (k === 1) {
        // pure translation?
        doX && this.gx().call(this.zoomX.translateBy, (t.x - this.z.x) / this.tx().k, 0);
        doY && this.gy().call(this.zoomY.translateBy, 0, (t.y - this.z.y) / this.ty().k);
      } else {
        // if not, we're zooming on a fixed point
        doX && this.gx().call(this.zoomX.scaleBy, k, point);
        doY && this.gy().call(this.zoomY.scaleBy, k, point);
      }

      this.z = t;

      this.redraw();
    });

    this.gx().call(this.zoomX).attr("pointer-events", "none");
    this.gy().call(this.zoomY).attr("pointer-events", "none");

    d3.select(this.svgRef.current)
      .call(this.zoom)
      .call(this.zoom.transform, d3.zoomIdentity.scale(1));
  }

  initData() {
    this.setState({ elements: this.props.children(this.x, this.y) });
  }

  redraw() {
    const xr = this.tx().rescaleX(this.x);
    const yr = this.ty().rescaleY(this.y);

    this.gx().call(this.xAxis, xr);
    this.gy().call(this.yAxis, yr);

    this.setState({ elements: this.props.children(xr, yr) })
  }

  zoomToX(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.xDomain[0] ? this.props.xDomain[0] : domain[0],
      domain[1] > this.props.xDomain[1] ? this.props.xDomain[1] : domain[1],
    ];

    const scale = (size.width - margins.left - margins.right) / (this.x(d[1]) - this.x(d[0]))
    this.gx().call(this.zoomX)
      .call(this.zoomX.transform, d3.zoomIdentity
        .scale(scale)
        .translate(-this.x(d[0]) + (margins.left / scale), 0));

    this.redraw();
  }

  zoomToY(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.yDomain[0] ? this.props.yDomain[0] : domain[0],
      domain[1] > this.props.yDomain[1] ? this.props.yDomain[1] : domain[1],
    ];

    const scale = (size.height - margins.top - margins.bottom) / (this.y(d[1]) - this.y(d[0]))
    this.gx().call(this.zoomX)
      .call(this.zoomY.transform, d3.zoomIdentity
        .scale(scale)
        .translate(-this.y(d[0]) + (margins.left / scale), 0));

    this.redraw();
  }

  render() {
    return (
      <svg ref={this.svgRef} style={{ width: '100%', height: '100%' }}>
        <g ref={this.xAxisRef} />
        <g ref={this.yAxisRef} />
        <g ref={this.dataRef}>
          {this.state.elements}
        </g>
      </svg>
    );
  }
}
