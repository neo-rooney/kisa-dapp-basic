import {
  IWalletContext,
  SelectedAccountByWallet,
} from "@/contexts/WalletContext/WalletContext.types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const WalletContext = createContext<IWalletContext | undefined>(undefined);
export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wallets, setWallets] = useState<Record<string, EIP6963ProviderDetail>>(
    {}
  );
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(
    null
  );
  const [selectedAccountByWalletRdns, setSelectedAccountByWalletRdns] =
    useState<SelectedAccountByWallet>({});

  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => setErrorMessage("");
  const setError = (error: string) => setErrorMessage(error);

  useEffect(() => {
    const savedSelectedWalletRdns = localStorage.getItem("selectedWalletRdns");
    const savedSelectedAccountByWalletRdns = localStorage.getItem(
      "selectedAccountByWalletRdns"
    );

    if (savedSelectedAccountByWalletRdns) {
      setSelectedAccountByWalletRdns(
        JSON.parse(savedSelectedAccountByWalletRdns)
      );
    }

    function onAnnouncement(event: EIP6963AnnounceProviderEvent) {
      setWallets((currentWallets) => ({
        ...currentWallets,
        [event.detail.info.rdns]: event.detail,
      }));

      if (
        savedSelectedWalletRdns &&
        event.detail.info.rdns === savedSelectedWalletRdns
      ) {
        setSelectedWalletRdns(savedSelectedWalletRdns);
      }
    }

    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () =>
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
  }, []);

  const connectWallet = useCallback(
    async (walletRdns: string) => {
      try {
        const wallet = wallets[walletRdns];
        const accounts = (await wallet.provider.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts?.[0]) {
          setSelectedWalletRdns(wallet.info.rdns);
          setSelectedAccountByWalletRdns((currentAccounts) => ({
            ...currentAccounts,
            [wallet.info.rdns]: accounts[0],
          }));

          localStorage.setItem("selectedWalletRdns", wallet.info.rdns);
          localStorage.setItem(
            "selectedAccountByWalletRdns",
            JSON.stringify({
              ...selectedAccountByWalletRdns,
              [wallet.info.rdns]: accounts[0],
            })
          );
        }
      } catch (error) {
        console.error("Failed to connect to provider:", error);
        const walletError: WalletError = error as WalletError;
        setError(
          `Code: ${walletError.code} \nError Message: ${walletError.message}`
        );
      }
    },
    [wallets, selectedAccountByWalletRdns]
  );

  const disconnectWallet = useCallback(async () => {
    if (selectedWalletRdns) {
      setSelectedAccountByWalletRdns((currentAccounts) => ({
        ...currentAccounts,
        [selectedWalletRdns]: null,
      }));

      const wallet = wallets[selectedWalletRdns];
      setSelectedWalletRdns(null);
      localStorage.removeItem("selectedWalletRdns");

      try {
        await wallet.provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        console.error("Failed to revoke permissions:", error);
      }
    }
  }, [selectedWalletRdns, wallets]);

  const contextValue: IWalletContext = {
    wallets,
    selectedWallet:
      selectedWalletRdns === null ? null : wallets[selectedWalletRdns],
    selectedAccount:
      selectedWalletRdns === null
        ? null
        : selectedAccountByWalletRdns[selectedWalletRdns],
    errorMessage,
    connectWallet,
    disconnectWallet,
    clearError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error(
      "useWalletContext must be used within a WalletContextProvider"
    );
  }
  return context;
};
