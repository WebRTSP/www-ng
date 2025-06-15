import { useContext, useEffect, useRef, useState } from "react";
import { LoaderCircle, CircleX, Video, CirclePlay } from "lucide-react";
import { WebRTSPPlayer as Player } from 'webrtsp.ts/WebRTSPPlayer';
import { Log, FormatTag } from 'webrtsp.ts/helpers/Log';

import { AppContext } from "./AppContext";

import "./WebRTSPPlayer.css";


const TAG = FormatTag("WebRTSP.Client");

const ConnectionState = {
  New: "new",
  Connecting: "connecting",
  Connected: "connected",
  Disconnected: "disconnected",
  Failed: "failed",
  Closed: "closed",
};

function WebRTSPPlayer() {
  const context = useContext(AppContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player>(undefined);
  const [connectionState, setConnectionState] = useState<string | undefined>();
  const activeStreamer = context.activeStreamer;
  const activeStreamerRev = context.activeStreamerRev;

  useEffect(() => {
    const video = videoRef.current;
    if(
      !video ||
      !context.webRTSP.connection || !context.webRTSP.connected ||
      !activeStreamer
    ) {
      return;
    }

    let active = true;

    setConnectionState(ConnectionState.New);

    const player = new Player(
      context.webRTSP.connection,
      [{
        urls: ["stun:stun.l.google.com:19302"]
      }],
      activeStreamer,
      video,
    );
    playerRef.current = player;

    player.events.addEventListener("connectionstatechanged", (event) => {
      if(!(event instanceof CustomEvent))
        return;

      if(active) {
        setConnectionState(event.detail.connectionstate);
      }
    });

    player.play().catch((error: unknown) => {
      Log.error(TAG, "play() failed:", error);
      if(active) {
        setConnectionState(ConnectionState.Failed);
      }
    });

    return () => {
      active = false;
      player.stop();
      setConnectionState(undefined);
      playerRef.current = undefined;
    };

  }, [
    context.webRTSP.connection,
    context.webRTSP.connected,
    activeStreamer,
    activeStreamerRev
  ]);

  const idle = activeStreamer == undefined;

  const loading = connectionState &&
    [
      ConnectionState.New,
      ConnectionState.Connecting,
      ConnectionState.Disconnected
    ].includes(connectionState);

  const playing = connectionState && [
      ConnectionState.Connected,
      ConnectionState.Disconnected,
      ConnectionState.Closed,
    ].includes(connectionState);
  const canRestart = connectionState && [
      ConnectionState.Closed,
    ].includes(connectionState);
  const failed = connectionState == ConnectionState.Failed;

  const stateIconClassNameCommon = `
    absolute
    max-w-1/2 maxh-h-1/2
    w-40 h-40
    top-0 bottom-0 left-0 right-0
    m-auto`;

  return (
    <>
    <video
      className = {`
        absolute
        max-w-full maxh-h-full
        top-0 bottom-0 left-0 right-0
        m-auto
        bg-black
      `}
      ref = { videoRef } muted autoPlay hidden = { !playing } />
    {
      idle && <Video
        className = {`
          ${stateIconClassNameCommon}
          stroke-primary-500
        `}/>
    }
    {
      failed && <CircleX
        className = {`
          ${stateIconClassNameCommon}
          stroke-destructive-800
        `}
      />
    }
    {
      loading && <LoaderCircle
        className = {`
          ${stateIconClassNameCommon}
          stroke-primary-200
          animate-spin `}
      />
    }
    {
      canRestart && <CirclePlay
        className = {`
          ${stateIconClassNameCommon}
          stroke-primary-transparent-400
          hover:stroke-primary-transparent-700
        `}
        onClick = {() => {
          context.incActiveStreamerRev();
        }}
      />
    }
    </>
  );
}

export default WebRTSPPlayer;
