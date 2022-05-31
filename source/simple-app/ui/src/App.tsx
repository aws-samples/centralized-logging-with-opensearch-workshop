import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Category from "./pages/Category";
import Detail from "./pages/Detail";
import Create from "./pages/Create";
import GenerateLog from "./pages/GenerateLog";

import "./App.css";
// import { Navigation } from './pages/common/Nav';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/type/:typeId" element={<Category />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="/create" element={<Create />} />
          <Route path="/generate-log" element={<GenerateLog />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
