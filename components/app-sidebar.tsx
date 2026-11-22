import { UserButton } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<div />} className="p-0">
              <UserButton
                showName
                appearance={{
                  elements: {
                    userButtonBox:
                      "w-full flex-row! justify-start! gap-2 p-2 text-sm",
                    userButtonTrigger:
                      "order-first! rounded-md shadow-none focus-visible:ring-2",
                    userButtonOuterIdentifier:
                      "order-last! truncate p-0! text-sm! font-normal! text-sidebar-foreground!",
                  },
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
