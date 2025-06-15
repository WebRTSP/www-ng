import './App.css';

import { useRef, useState } from 'react';
import { useWebRTSP } from './useWebRTSP';
import { AppContext } from './AppContext';
import WebRTSPPlayer from './WebRTSPPlayer';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';

declare const WebRTSPPort: number;
const protocol = window.location.protocol === 'http:' ? "ws" : "wss";
const url = `${protocol}://${window.location.hostname}:${WebRTSPPort}/`;

function App() {
  const webRTSP = useWebRTSP(url);
  const activeStreamerRef = useRef<string | undefined>(undefined);
  const [activeStreamerRev, setActiveStreamerRev] = useState(0);

  return (
    <AppContext value = {
      {
        webRTSP,
        get activeStreamerRev(): number { return activeStreamerRev; },
        get activeStreamer(): string | undefined { return activeStreamerRef.current; },
        incActiveStreamerRev() {
            setActiveStreamerRev((rev: number) => {
              return rev >= Number.MAX_SAFE_INTEGER ? 0 : rev + 1;
            });
        },
        set activeStreamer(streamer: string) {
            activeStreamerRef.current = streamer;
            this.incActiveStreamerRev();
        },
      }
    } >
      <SidebarProvider>
        <AppSidebar />
        <main className = "relative flex-1">
          <SidebarTrigger />
          <WebRTSPPlayer />
        </main>
      </SidebarProvider>
    </AppContext>
  );
}

export default App;
