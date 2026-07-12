import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import NotFound from "./pages/Notfound";
import Users from "./pages/Users";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;