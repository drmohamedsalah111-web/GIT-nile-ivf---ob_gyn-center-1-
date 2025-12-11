import { PowerSyncContext } from "@powersync/react";
import { ReactNode } from "react";
import { powerSync } from "../powersync/db";

export const PowerSyncProvider = ({ children }: { children: ReactNode }) => {
    return (
        <PowerSyncContext.Provider value={powerSync}>
            {children}
        </PowerSyncContext.Provider>
    );
};
