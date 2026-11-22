"use client";

import { createContext, use, useState, type ReactNode } from "react";
import {
  usePanelRef,
  type PanelImperativeHandle,
} from "react-resizable-panels";

import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";

export type SidePanelName = "desktop";

type SidePanelContextValue = {
  refs: Record<SidePanelName, React.RefObject<PanelImperativeHandle | null>>;
  open: Record<SidePanelName, boolean>;
  setOpen: (name: SidePanelName, open: boolean) => void;
  toggle: (name: SidePanelName) => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const refs = { desktop: usePanelRef() };
  const [open, setOpenState] = useState({ desktop: false });

  function setOpen(name: SidePanelName, value: boolean) {
    setOpenState((current) =>
      current[name] === value ? current : { ...current, [name]: value },
    );
  }

  function toggle(name: SidePanelName) {
    const panel = refs[name].current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }

  return (
    <SidePanelContext value={{ refs, open, setOpen, toggle }}>
      {children}
    </SidePanelContext>
  );
}

export function useSidePanel() {
  const context = use(SidePanelContext);
  if (!context)
    throw new Error("useSidePanel must be used within SidePanelProvider");
  return context;
}

export function SidePanelHandle({ name }: { name: SidePanelName }) {
  const { open } = useSidePanel();
  return (
    <ResizableHandle
      disabled={!open[name]}
      className={open[name] ? undefined : "hidden"}
    />
  );
}

export function SidePanel({
  name,
  children,
}: {
  name: SidePanelName;
  children?: ReactNode;
}) {
  const { refs, setOpen } = useSidePanel();
  return (
    <ResizablePanel
      id={name}
      panelRef={refs[name]}
      className="h-svh min-w-0"
      collapsible
      collapsedSize={0}
      defaultSize={0}
      minSize="15%"
      maxSize="50%"
      onResize={(size) => setOpen(name, size.asPercentage > 0)}
    >
      {children}
    </ResizablePanel>
  );
}
