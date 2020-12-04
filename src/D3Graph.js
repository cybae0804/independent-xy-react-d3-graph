import React, { createRef } from 'react';
import * as d3 from 'd3';
import equal from 'fast-deep-equal/react';
import ReactResizeDetector from 'react-resize-detector';

const margins = {
  left: 30,
  right: 30,
  top: 30,
  bottom: 30,
};

export default class D3Graph extends React.Component {
  state = {
    size: {
      width: 1,
      height: 1,
    },
  };

  svgRef = createRef();
  xAxisRef = createRef();
  yAxisRef = createRef();

  gx = () => d3.select(this.xAxisRef.current);
  gy = () => d3.select(this.yAxisRef.current);

  componentDidMount() {
    this.tx = () => d3.zoomTransform(this.gx().node());
    this.ty = () => d3.zoomTransform(this.gy().node());

    this.defaultClipPathId = `clip-path-${new Date().getTime()}`;

    this.initScales();
    this.initAxes();
    this.initZoom();
    this.initData();

    this.redraw();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!equal(prevState.size, this.state.size)) {
      this.initScales();
      this.initAxes();
      this.initZoom();
    }

    this.redraw();
  }

  initScales() {
    this.x = d3.scaleLinear()
      .domain(this.props.xDomain)
      .range([margins.left, this.state.size.width - margins.right]);
    this.y = d3.scaleLinear()
      .domain(this.props.yDomain)
      .range([this.state.size.height - margins.bottom, margins.top]);
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
      .translateExtent([[margins.left, margins.top], [this.state.size.width - margins.right, this.state.size.height - margins.bottom]])
      .extent([[margins.left, margins.top], [this.state.size.width - margins.right, this.state.size.height - margins.bottom]]);
    this.zoomY = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[margins.left, margins.top], [this.state.size.width - margins.right, this.state.size.height - margins.bottom]])
      .extent([[margins.left, margins.top], [this.state.size.width - margins.right, this.state.size.height - margins.bottom]]);

    this.zoom = d3.zoom().on("zoom", (e) => {
      const t = e.transform;
      const k = t.k / this.z.k;
      const point = e.sourceEvent ? d3.pointer(e) : [this.state.size.width / 2, this.state.size.height / 2];

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
    this.props.children({ xScale: this.x, yScale: this.y, size: this.state.size, margins, defaultClipPathId: this.defaultClipPathId })
      .forEach(({ key, type, children }) => {
        this[key] = d3.select(this.svgRef.current)
          .append(type);

        if (children) this.recursiveAppend(this[key], children);
      });
  }

  recursiveAppend(selection, children) {
    children.forEach(({ key, type, children }) => {
      this[key] = selection.append(type);

      if (children) this.recursiveAppend(this[key], children);
    });
  }

  redraw() {
    const xr = this.tx().rescaleX(this.x);
    const yr = this.ty().rescaleY(this.y);

    this.gx().call(this.xAxis, xr);
    this.gy().call(this.yAxis, yr);

    this.props.children({ xScale: xr, yScale: yr, size: this.state.size, margins, defaultClipPathId: this.defaultClipPathId })
      .forEach(({ attr, key, listeners, children }) => {
        if (this[key]) {
          if (attr) Object.entries(attr).forEach(([k, v]) => {
            this[key].attr(k, v);
          });

          if (listeners) Object.entries(listeners).forEach(([k, v]) => {
            this[key].on(k, e => v(e, xr.invert(e.clientX), yr.invert(e.clientY)));
          });

          if (children) this.recursiveAttr(children, xr, yr);
        }
      });
  }

  recursiveAttr(children, xr, yr) {
    children.forEach(({ key, listeners, attr, children }) => {
      const selection = this[key];
      if (selection) {
        if (attr) Object.entries(attr).forEach(([k, v]) => {
          selection.attr(k, v);
        });
        
        if (listeners) Object.entries(listeners).forEach(([k, v]) => {
          selection.on(k, e => v(e, xr.invert(e.clientX), yr.invert(e.clientY)));
        });
      }

      if (children) this.recursiveAttr(children, xr, yr);
    });
  }

  zoomToX(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.xDomain[0] ? this.props.xDomain[0] : domain[0],
      domain[1] > this.props.xDomain[1] ? this.props.xDomain[1] : domain[1],
    ];

    const scale = (this.state.size.width - margins.left - margins.right) / (this.x(d[1]) - this.x(d[0]))
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

    const scale = (this.state.size.height - margins.top - margins.bottom) / (this.y(d[1]) - this.y(d[0]))
    this.gx().call(this.zoomY)
      .call(this.zoomY.transform, d3.zoomIdentity
        .scale(scale)
        .translate(-this.y(d[0]) + (margins.left / scale), 0));

    this.redraw();
  }

  render() {
    const { children, ref, xDomain, yDomain, ...rest } = this.props;
    return (
      <ReactResizeDetector
        handleWidth
        handleHeight
        onResize={(width, height) => this.setState({ size: { width, height }})}
      >
        <div style={{
          width: '100%',
          height: '100%'
        }}>
          <svg
            ref={this.svgRef}
            style={{
              width: '100%',
              height: '100%',
            }}
            {...rest}
          >
            <g ref={this.xAxisRef} />
            <g ref={this.yAxisRef} />
            <clipPath id={this.defaultClipPathId}>
              <rect 
                width={this.state.size.width - margins.left - margins.right}
                height={this.state.size.height - margins.top - margins.bottom}
                transform={`translate(${margins.left},${margins.top})`}
              />
            </clipPath>
          </svg>
        </div>
      </ReactResizeDetector>
    );
  }
}
