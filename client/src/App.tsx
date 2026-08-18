import { Toaster } from "react-hot-toast";

import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <Dashboard />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "dark:!bg-slate-800 dark:!text-slate-100",
        }}
      />
    </>
  );
}

export default App;
