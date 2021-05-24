import { AppleWalletServiceContextType } from "./apple-wallet.provider";

export class AppleWalletService implements AppleWalletServiceContextType {
    async createPackageToSign(): Promise<string> {
        return "boop";
    }
}
