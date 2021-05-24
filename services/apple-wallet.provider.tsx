import { createContext, PropsWithChildren, useContext } from "react";

export type AppleWalletServiceContextType = {
    createPackageToSign: () => Promise<string>;
};

const AppleWalletServiceContext = createContext<AppleWalletServiceContextType | undefined>(undefined);

export const AppleWalletServiceProvider = (props: PropsWithChildren<AppleWalletServiceContextType>) => {
    const value = {
        createPackageToSign: props.createPackageToSign,
    };

    return <AppleWalletServiceContext.Provider {...{ value }}>
        {props.children}
    </AppleWalletServiceContext.Provider>;
};

export const useAppleWallet = () => useContext(AppleWalletServiceContext);