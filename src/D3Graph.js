/* eslint-disable no-unused-expressions */
import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import equal from 'fast-deep-equal';
import ReactResizeDetector from 'react-resize-detector';
import './index.css';

export default class D3Graph extends React.Component {
  state = {
    size: {
      width: 100,
      height: 100,
    },
  };

  svgRef = createRef();
  xAxisRef = createRef();
  yAxisRef = createRef();

  componentDidMount() {
    this.defaultClipPathId = `clip-path-${new Date().getTime()}`;

    this.initScales();
    this.initAxes();
    this.initZoom();

    this.redraw();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!equal(prevState.size, this.state.size)) {
      this.initScales();
      this.initAxes();
      this.initZoom();
    }

    if (!equal(prevProps.xDomain, this.props.xDomain) || !equal(prevProps.yDomain, this.props.yDomain)) {
      this.initScales();
      this.initAxes();
      this.initZoom();
    }

    this.redraw();
  }

  gx = () => d3.select(this.xAxisRef.current);
  gy = () => d3.select(this.yAxisRef.current);
  tx = () => d3.zoomTransform(this.gx().node());
  ty = () => d3.zoomTransform(this.gy().node());

  initScales() {
    this.x = d3.scaleLinear()
      .domain(this.props.xDomain)
      .range([this.props.margins.left, this.state.size.width - this.props.margins.right]);
    this.y = d3.scaleLinear()
      .domain(this.props.yDomain)
      .range([this.state.size.height - this.props.margins.bottom, this.props.margins.top]);
  }

  initAxes() {
    this.xAxis = (g, scale) => g
      .attr('transform', `translate(0,${this.y(this.props.yDomain[0])})`)
      .call(d3.axisBottom(scale));

    this.yAxis = (g, scale) => g
      .attr('transform', `translate(${this.x(this.props.xDomain[0])},0)`)
      .call(d3.axisLeft(scale));
  }

  initZoom() {
    this.z = d3.zoomIdentity;

    this.zoomX = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]])
      .extent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]]);
    this.zoomY = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]])
      .extent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]]);

    this.zoom = d3.zoom().on('zoom', (e) => {
      const t = e.transform;
      const k = t.k / this.z.k;
      const point = e.sourceEvent ? d3.pointer(e) : [this.state.size.width / 2, this.state.size.height / 2];

      // is it on an axis?
      const doX = point[0] > this.x.range()[0];
      const doY = point[1] < this.y.range()[0];

      if (k === 1) {
        // pure translation?
        if (doX) this.gx().call(this.zoomX.translateBy, (t.x - this.z.x) / this.tx().k, 0);
        if (doY) this.gy().call(this.zoomY.translateBy, 0, (t.y - this.z.y) / this.ty().k);
      } else {
        // if not, we're zooming on a fixed point
        if (doX) this.gx().call(this.zoomX.scaleBy, k, point);
        if (doY) this.gy().call(this.zoomY.scaleBy, k, point);
      }

      this.z = t;

      this.redraw();

      this.forceUpdate();
    });

    this.gx().call(this.zoomX);
    this.gy().call(this.zoomY);

    d3.select(this.svgRef.current)
      .call(this.zoom)
      .call(this.zoom.transform, d3.zoomIdentity.scale(1));
  }

  redraw() {
    this.xr = this.tx().rescaleX(this.x);
    this.yr = this.ty().rescaleY(this.y);

    this.gx().call(this.xAxis, this.xr);
    this.gy().call(this.yAxis, this.yr);
  }

  zoomToX(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.xDomain[0] ? this.props.xDomain[0] : domain[0],
      domain[1] > this.props.xDomain[1] ? this.props.xDomain[1] : domain[1],
    ];

    const scale = (this.state.size.width - this.props.margins.left - this.props.margins.right) / (this.x(d[1]) - this.x(d[0]));
    this.gx().call(this.zoomX)
      .call(this.zoomX.transform, d3.zoomIdentity
        .scale(scale)
        .translate(-this.x(d[0]) + (this.props.margins.left / scale), 0));

    this.redraw();
  }

  zoomToY(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.yDomain[0] ? this.props.yDomain[0] : domain[0],
      domain[1] > this.props.yDomain[1] ? this.props.yDomain[1] : domain[1],
    ];

    const scale = (this.state.size.height - this.props.margins.top - this.props.margins.bottom) / (this.y(d[1]) - this.y(d[0]));
    this.gx().call(this.zoomY)
      .call(this.zoomY.transform, d3.zoomIdentity
        .scale(scale)
        .translate(-this.y(d[0]) + (this.props.margins.left / scale), 0));

    this.redraw();
  }

  render() {
    const { children, ref, xDomain, yDomain, ...rest } = this.props;

    return (
      <ReactResizeDetector
        handleWidth
        handleHeight
        onResize={(width, height) => this.setState({ size: { width, height } })}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <svg
            ref={this.svgRef}
            style={{
              width: '100%',
              height: '100%',
            }}
            {...rest}
          >
            <g
              ref={this.xAxisRef}
              pointerEvents="none"
            />
            <g
              ref={this.yAxisRef}
              pointerEvents="none"
            />
            <clipPath id={this.defaultClipPathId}>
              <rect
                width={this.state.size.width - this.props.margins.left - this.props.margins.right}
                height={this.state.size.height - this.props.margins.top - this.props.margins.bottom}
                transform={`translate(${this.props.margins.left},${this.props.margins.top})`}
              />
            </clipPath>

            {this.props.children({
              xScale: this.xr || this.x || d3.scaleLinear()
                .domain(this.props.xDomain)
                .range([this.props.margins.left, this.state.size.width - this.props.margins.right]),
              yScale: this.yr || this.y || d3.scaleLinear()
                .domain(this.props.yDomain)
                .range([this.state.size.height - this.props.margins.bottom, this.props.margins.top]),
              size: this.state.size,
              defaultClipPathId: this.defaultClipPathId,
            })}
          </svg>
        </div>
      </ReactResizeDetector>
    );
  }
}

D3Graph.propTypes = {
  xDomain: PropTypes.arrayOf(PropTypes.number).isRequired,
  yDomain: PropTypes.arrayOf(PropTypes.number).isRequired,
  onZoomXModified: PropTypes.func,
  onZoomYModified: PropTypes.func,
  children: PropTypes.func,
  margins: PropTypes.shape({
    top: PropTypes.number,
    bottm: PropTypes.number,
    left: PropTypes.number,
    right: PropTypes.number,
  })
}

D3Graph.defaultProps = {
  onZoomXModified: () => {},
  onZoomYModified: () => {},
  children: () => { return []},
  margins: {
    top: 30,
    bottm: 30,
    left: 30,
    right: 30,
  },
}
