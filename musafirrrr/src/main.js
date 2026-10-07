"use strict";
/* ============================================================
   ENTRY POINT
   Mounts the React app. Must be the LAST script loaded.
   ============================================================ */

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));

authService.init().catch(err => console.error("Auth init failed:", err));
