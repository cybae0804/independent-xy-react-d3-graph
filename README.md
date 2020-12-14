# Independent XY React D3 Graph
Out of the box solution for independent X Y zooming graph.

## Features
- Built in independent XY axis zooming through hovering on the axis
- Responsive - Built in resize detector
- Use JSX to create graph elements and automatically rerender when needed
- Programmatic zoom with a ref

## Setup
```bash
$ npm i independent-xy-react-d3-graph
```

```javascript
import Graph from 'independent-xy-react-d3-graph';
```

```javascript
<Graph {...props}>
  {...children}
</Graph>
```

## Usage

### Rendering Elements
The goal of this Graph component was to mix the customizability of svg elements through D3 and the ease of composability through JSX. In order to achieve this, the Graph component works as a HOC that returns a function with certain properties. For example: 

```javascript
<Graph>
  {({ xScale, yScale, size, defaultClipPathId }) => {
    return elements;
  }
</Graph>
```

As the zoom state or the size changes within the graph, it will pass the `xScale`, `yScxale` and a few other state to the user. Then, these functions and state can be used to modify the positioning of the desired elements while staying synchronized to the zoom state. 

The callback function can return a single JSX element or an array. Note that when an array is used, each element needs to have a key prop just like any other React array rendering.
| Name | Type | Desc |
|-------------------|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| xScale            | d3.scaleLinear()                  | Function that scales with the Graph's X axis zoom state.                                                                                    |
| yScale            | d3.scaleLinear()                  | Function that scales with the Graph's Y axis zoom state.                                                                                    |
| size              | { <br /> width: number, <br /> height: number <br /> } | Object defining the size of the Graph component.                                                                                            |
| defaultClipPathId | string                            | ID of the built in `clipPath` element. The bounds are within the displayed axes. This ID is set with the time component upon component mount. |

### Accessing Graph Zoom Functions
To programmatically modify the zoom state of the Graph component, the user can access the Graph properties through the use of a ref. In order to do so, pass a ref into the Graph component. 

```javascript
<Graph ref={this.graphRef}>
  {({ xScale, yScale, size, defaultClipPathId }) => {
    return elements;
  }
</Graph>
```

```javascript
this.graphRef.current.zoomToX(newYDomain);
this.graphRef.current.zoomToY(newXDomain);
```

Probably the most useful functions `zoomToX` and `zoomToY` receive an array of numbers: the desired zoom domain. Ex. `[80, 200]`. 

These functiosn trigger the domain modified callback functions without the `userAction` set to true.

### Props
| Name              | Type                                                         | Required | Desc                                                                                                                                                                        |
|-------------------|--------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| xDomain           | [number, number]                                             | true     | Initial domain for the X axis. Also works as the max limit on zoom.                                                                                                         |
| yDomain           | [number, number]                                             | true     | Initial domain for the Y axis. Also works as the max limit on zoom.                                                                                                         |
| margins           | { <br /> top: number, <br /> bottom: number, <br /> left: number, <br /> right: number <br /> } | true     | Defines the space the Graph should not invade. Allows the axis to render in this space.                                                                                     |
| onXDomainModified | (domain: [number, number], userAction: boolean) => void;     | false    | Callback function that receives the new domain after zoom. If the user scrolled to zoom, userAction is true, while any programmatic zoom sends false.                       |
| onYDomainModified | (domain: [number, number], userAction: boolean) => void;     | false    | "                                                                                                                                                                           |
| wrapperElements   | React.Element[]                                              | false    | Elements to be rendered outside of the svg component. Instead, it renders inside an absolutely positioned div, which allows for easier rendering of tooltips, legends, etc. |
