import { Toaster } from "react-hot-toast";

import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <Dashboard />
      <Toaster position="bottom-right" />
    </>
  );
}

export default App;