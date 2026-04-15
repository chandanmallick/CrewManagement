import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {

  const [open,setOpen] = useState(false);

  

  return (

    <div className="app-layout">

      <Sidebar open={open} setOpen={setOpen} />

      <div className="app-content">
        {children}
      </div>

    </div>

  );
}