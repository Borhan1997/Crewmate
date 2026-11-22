"use client";

import {
  createContext,
  useCallback,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { RefreshCwIcon } from "lucide-react";

import { getDesktopConnection } from "@/actions/desktop";
import { useSidePanel } from "@/components/side-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

type Status = "idle" | "connecting" | "connected" | "error";

type DesktopContextValue = {
  /** One DOM node holding the VNC canvas; it is moved between slots, never recreated. */
  screen: HTMLDivElement | null;
  status: Status;
  setInteractive: (interactive: boolean) => void;
  refresh: () => void;
};

const DesktopContext = createContext<DesktopContextValue | null>(null);

function useDesktop() {
  const context = use(DesktopContext);
  if (!context)
    throw new Error("useDesktop must be used within DesktopProvider");
  return context;
}

/** Owns the single VNC connection, opened the first time the desktop panel is shown. */
export function DesktopProvider({
  chatId,
  children,
}: {
  chatId: string;
  children: ReactNode;
}) {
  const { open } = useSidePanel();
  const [screen] = useState(() => {
    if (typeof document === "undefined") return null;
    const element = document.createElement("div");
    element.className = "size-full";
    return element;
  });
  const [status, setStatus] = useState<Status>("idle");
  const [attempt, setAttempt] = useState(0);
  const rfbRef = useRef<import("@novnc/novnc").default | null>(null);
  const interactiveRef = useRef(false);
  const requested = open.desktop;

  useEffect(() => {
    if (!requested || !screen || rfbRef.current) return;
    let cancelled = false;
    setStatus("connecting");

    (async () => {
      const [{ default: RFB }, url] = await Promise.all([
        import("@novnc/novnc"),
        getDesktopConnection(chatId),
      ]);
      if (cancelled) return;
      const rfb = new RFB(screen, url);
      rfb.scaleViewport = true;
      rfb.resizeSession = false;
      rfb.viewOnly = !interactiveRef.current;
      rfb.addEventListener("connect", () => setStatus("connected"));
      rfb.addEventListener("disconnect", (event) => {
        if (rfbRef.current !== rfb) return;
        rfbRef.current = null;
        const clean = (event as CustomEvent<{ clean: boolean }>).detail.clean;
        setStatus(clean ? "idle" : "error");
      });
      rfbRef.current = rfb;
    })().catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [requested, screen, chatId, attempt]);

  useEffect(() => () => rfbRef.current?.disconnect(), []);

  const setInteractive = useCallback((interactive: boolean) => {
    interactiveRef.current = interactive;
    const rfb = rfbRef.current;
    if (!rfb) return;
    rfb.viewOnly = !interactive;
    if (interactive) rfb.focus();
    else rfb.blur();
  }, []);

  /** Drops the connection and opens a fresh one. */
  const refresh = useCallback(() => {
    const rfb = rfbRef.current;
    rfbRef.current = null;
    rfb?.disconnect();
    setAttempt((count) => count + 1);
  }, []);

  return (
    <DesktopContext value={{ screen, status, setInteractive, refresh }}>
      {children}
    </DesktopContext>
  );
}

/** Mounts the shared VNC screen inside this element. */
function Screen({ className }: { className?: string }) {
  const { screen, status } = useDesktop();
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot || !screen) return;
    slot.appendChild(screen);
  }, [screen]);

  return (
    <div className={className}>
      <div ref={slotRef} className="size-full" />
      {status !== "connected" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-sm text-muted-foreground">
          {status === "error" ? (
            "Couldn't connect to the desktop."
          ) : (
            <Spinner />
          )}
        </div>
      )}
    </div>
  );
}

/** The panel content: a view-only preview that opens the desktop fullscreen on click. */
export function DesktopPreview({ name }: { name: string }) {
  const { setInteractive, refresh, status } = useDesktop();
  const [fullscreen, setFullscreen] = useState(false);

  function handleOpenChange(
    next: boolean,
    details: { reason: string; cancel: () => void },
  ) {
    // Only the close button may close it: ignore Escape, outside clicks, etc.
    if (!next && details.reason !== "close-press") return details.cancel();
    setFullscreen(next);
  }

  return (
    <>
      <div className="flex size-full flex-col gap-4 p-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Refresh desktop"
            disabled={status === "connecting"}
            onClick={refresh}
          >
            <RefreshCwIcon />
          </Button>
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          {!fullscreen && <Screen className="relative size-full" />}
          <button
            type="button"
            aria-label="Open desktop fullscreen"
            className="absolute inset-0 cursor-pointer"
            onClick={() => setFullscreen(true)}
          />
        </div>
        <p className="text-center text-base text-muted-foreground">
          {name}&apos;s screen
        </p>
      </div>
      <Dialog open={fullscreen} onOpenChange={handleOpenChange}>
        <DialogContent className="h-svh max-w-none gap-0 rounded-none p-0 sm:max-w-none">
          <DialogTitle className="sr-only">Desktop</DialogTitle>
          <DialogDescription className="sr-only">
            Interactive desktop. Use the close button to leave.
          </DialogDescription>
          <FullscreenScreen setInteractive={setInteractive} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FullscreenScreen({
  setInteractive,
}: {
  setInteractive: (interactive: boolean) => void;
}) {
  useEffect(() => {
    setInteractive(true);
    return () => setInteractive(false);
  }, [setInteractive]);

  return (
    <div
      className="size-full"
      // Keep every key and pointer event away from the dialog and page hotkeys.
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <Screen className="relative size-full" />
    </div>
  );
}
