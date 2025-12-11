import { PowerSyncContext } from "@powersync/react";
import { ReactNode } from "react";
import { powerSyncDb } from "../powersync/client";

export const PowerSyncProvider = ({ children }: { children: ReactNode }) => {
    return (
        <PowerSyncContext.Provider value={powerSyncDb}>
            {children}
        </PowerSyncContext.Provider>
    );
};

