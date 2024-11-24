import { useEffect } from 'react'
import Map from './Map'
import { init } from './js/main'

let isInitialized = false;

function App() {

  // Ensure the init function is called only once, even in React strict mode
  useEffect(() => {
    if (isInitialized) return;
    init();
    isInitialized = true;
  }, []);

  return (
    <>
      <div id="article" className="content">
        <div id="article-content"></div>
      </div>

      <div id="chart">
        <div id="chart-d3"></div>
        <div id="foreground">
          <Map />
        </div>
      </div>

      <div id="loading" className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    </>
  )
}

export default App
