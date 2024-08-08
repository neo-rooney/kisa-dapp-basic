declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent;
  }
}

export type SelectedAccountByWallet = Record<string, string | null>;

export interface IWalletContext {
  wallets: Record<string, EIP6963ProviderDetail>; // A list of wallets.
  selectedWallet: EIP6963ProviderDetail | null; // The selected wallet.
  selectedAccount: string | null; // The selected account address.
  errorMessage: string | null; // An error message.
  connectWallet: (walletUuid: string) => Promise<void>; // Function to connect wallets.
  disconnectWallet: () => void; // Function to disconnect wallets.
  clearError: () => void;
}
