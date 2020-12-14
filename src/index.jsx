/* eslint-disable no-unused-expressions */
import React, { createRef } from 'react';
import { scaleLinear } from 'd3-scale';
import { select, pointer } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { axisBottom, axisLeft } from 'd3-axis';
import equal from 'fast-deep-equal';
import ReactResizeDetector from 'react-resize-detector';

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

  gx = () => select(this.xAxisRef.current);
  gy = () => select(this.yAxisRef.current);
  tx = () => zoomTransform(this.gx().node());
  ty = () => zoomTransform(this.gy().node());

  initScales() {
    this.x = scaleLinear()
      .domain(this.props.xDomain)
      .range([this.props.margins.left, this.state.size.width - this.props.margins.right]);
    this.y = scaleLinear()
      .domain(this.props.yDomain)
      .range([this.state.size.height - this.props.margins.bottom, this.props.margins.top]);
  }

  initAxes() {
    this.xAxis = (g, scale) => g
      .attr('transform', `translate(0,${this.y(this.props.yDomain[0])})`)
      .call(axisBottom(scale));

    this.yAxis = (g, scale) => g
      .attr('transform', `translate(${this.x(this.props.xDomain[0])},0)`)
      .call(axisLeft(scale));
  }

  initZoom() {
    this.z = zoomIdentity;

    this.zoomX = zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]])
      .extent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]]);
    this.zoomY = zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]])
      .extent([
        [this.props.margins.left, this.props.margins.top],
        [this.state.size.width - this.props.margins.right, this.state.size.height - this.props.margins.bottom]]);

    this.zoom = zoom().on('zoom', (e) => {
      const t = e.transform;
      const k = t.k / this.z.k;
      const point = e.sourceEvent ? pointer(e) : [this.state.size.width / 2, this.state.size.height / 2];

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

    select(this.svgRef.current)
      .call(this.zoom)
      .call(this.zoom.transform, zoomIdentity.scale(1));
  }

  redraw(isUserAction = true) {
    const oldXDomain = (this.xr ?? this.x).domain();
    const oldYDomain = (this.yr ?? this.y).domain();

    this.xr = this.tx().rescaleX(this.x);
    this.yr = this.ty().rescaleY(this.y);

    const newXDomain = this.xr.domain();
    const newYDomain = this.yr.domain();

    if (!equal(oldXDomain, newXDomain)) this.props.onXDomainModified?.(newXDomain, isUserAction);
    if (!equal(oldYDomain, newYDomain)) this.props.onYDomainModified?.(newXDomain, isUserAction);

    this.gx().call(this.xAxis, this.xr);
    this.gy().call(this.yAxis, this.yr);
  }

  zoomToX(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.xDomain[0] ? this.props.xDomain[0] : domain[0],
      domain[1] > this.props.xDomain[1] ? this.props.xDomain[1] : domain[1],
    ];

    const scale = (this.state.size.width - this.props.margins.left - this.props.margins.right)
      / (this.x(d[1]) - this.x(d[0]));
    this.gx().call(this.zoomX)
      .call(this.zoomX.transform, zoomIdentity
        .scale(scale)
        .translate(-this.x(d[0]) + (this.props.margins.left / scale), 0));

    this.redraw(false);

    this.forceUpdate();
  }

  zoomToY(domain) {
    if (domain[1] < domain[0]) return;
    const d = [
      domain[0] < this.props.yDomain[0] ? this.props.yDomain[0] : domain[0],
      domain[1] > this.props.yDomain[1] ? this.props.yDomain[1] : domain[1],
    ];

    const scale = (this.state.size.height - this.props.margins.top - this.props.margins.bottom)
      / (this.y(d[1]) - this.y(d[0]));
    this.gx().call(this.zoomY)
      .call(this.zoomY.transform, zoomIdentity
        .scale(scale)
        .translate(-this.y(d[0]) + (this.props.margins.left / scale), 0));

    this.redraw(false);

    this.forceUpdate();
  }

  getTranslatedEvent = (e) => {
    const xScale = this.xr || this.x || scaleLinear()
      .domain(this.props.xDomain)
      .range([this.props.margins.left, this.state.size.width - this.props.margins.right]);
    const yScale = this.yr || this.y || scaleLinear()
      .domain(this.props.yDomain)
      .range([this.state.size.height - this.props.margins.bottom, this.props.margins.top]);
    const parent = e.currentTarget.parentElement.getBoundingClientRect();
    const x = e.clientX - parent.x;
    const y = e.clientY - parent.y;

    return {
      x: xScale.invert(x),
      y: yScale.invert(y),
    };
  }

  render() {
    const {
      children, ref, xDomain, yDomain, margins, wrapperElements,
      onXDomainModified, onYDomainModified, onMouseMove,
      onClick, ...rest
    } = this.props;

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
            position: 'relative',
          }}
        >
          <svg
            ref={this.svgRef}
            style={{
              width: '100%',
              height: '100%',
            }}
            onMouseMove={e => this.props.onMouseMove?.(e, this.getTranslatedEvent(e))}
            onClick={e => this.props.onClick?.(e, this.getTranslatedEvent(e))}
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
              xScale: this.xr || this.x || scaleLinear()
                .domain(this.props.xDomain)
                .range([this.props.margins.left, this.state.size.width - this.props.margins.right]),
              yScale: this.yr || this.y || scaleLinear()
                .domain(this.props.yDomain)
                .range([this.state.size.height - this.props.margins.bottom, this.props.margins.top]),
              size: this.state.size,
              defaultClipPathId: this.defaultClipPathId,
            })}
          </svg>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
          >
            {wrapperElements}
          </div>
        </div>
      </ReactResizeDetector>
    );
  }
}
