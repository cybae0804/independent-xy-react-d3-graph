import './App.css';
import D3Graph from './D3Graph';

function App() {
  return (
    <div className="App">
      <D3Graph
        lapsMinMax={[10, 100]}
        deltaMinMax={[10, 100]}
      />
    </div>
  );
}

export default App;
