// import { useState, useEffect } from 'react'
import './App.css'
// import axios from "axios";

function App() {
  // const [count, setCount] = useState(0);
  // const [array, setArray] = useState([]);

  // const fetchAPI = async () => {
  //   const response = await axios.get("http://localhost:8001/api");
  //   setArray(response.data.fruits);
  //   console.log(response.data.fruits);
  // };

  // useEffect(() => {
  //   fetchAPI();
  // }, []);

  return (
    <>
      <div className='home-container'>
        <h1 className='home-title'>TimeWise</h1>
      </div>
      <div className="card">
        {/* <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button> */}
        <p>
        TimeWise is an advanced scheduling platform designed to simplify the process of coordinating meetings across multiple time zones.
        </p>
        {/* {
          array.map((fruit, index) => (
            <div key={index}>
              <p>{fruit}</p>
              <br></br>
            </div>
          ))
        } */}
      </div>
    </>
  )
}

export default App
