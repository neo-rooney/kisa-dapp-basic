import VendingMachine from "@/components/VendingMachine";
import { WalletContextProvider } from "@/contexts/WalletContext/WalletContext";

function App() {
  return (
    <main className="w-full h-dvh flex items-center justify-center">
      <WalletContextProvider>
        <VendingMachine />
      </WalletContextProvider>
    </main>
  );
}

export default App;
