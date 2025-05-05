import Web3 from "web3";
import AttendanceContract from "./contracts/Attendance.json";

const Blockchain = async () => {
  let web3;
  let contract;
  
  try {
    // Prioritize MetaMask connection if available
    if (window.ethereum) {
      try {
        web3 = new Web3(window.ethereum);
        // Request account access if needed
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected via MetaMask");
      } catch (metamaskError) {
        console.error("Error connecting to MetaMask:", metamaskError);
        // Fallback to direct Ganache connection
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
        console.log("Fallback: Connected to local Ganache network");
      }
    } else {
      // No MetaMask, try direct connection
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
      console.log("Connected to local Ganache network (MetaMask not detected)");
    }
    
    // Check if connected to network
    if (!web3) {
      throw new Error("No web3 connection established.");
    }
    
    // Print debug information
    const networkId = await web3.eth.net.getId();
    console.log("Connected to network ID:", networkId);
    
    // For debugging: print available networks in the contract
    console.log("Available contract networks:", Object.keys(AttendanceContract.networks));
    
    // Look for our contract on the connected network
    const deployedNetwork = AttendanceContract.networks[networkId.toString()];
    
    if (!deployedNetwork) {
      throw new Error(`Contract not deployed on Truffle network. Please ensure the contract is properly deployed.`); 
    }
    
    // Create the contract instance with the specific address from the 5777 network
    console.log("Creating contract instance with address:", deployedNetwork.address);
    contract = new web3.eth.Contract(
      AttendanceContract.abi,
      deployedNetwork.address
    );
    
    // Print some debug info about the contract
    console.log("Contract ABI methods:", Object.keys(contract.methods).slice(0, 10));
    
    // Setup event listeners if using MetaMask
    if (window.ethereum) {
      // Remove any existing listeners to prevent duplicates
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
      
      // Add fresh listeners
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log("MetaMask accounts changed to:", accounts, "reloading...");
        // Force clear any cached data
        sessionStorage.clear();
        localStorage.removeItem('currentAccount');
        // Hard reload the page
        window.location.href = window.location.href.split("?")[0];
      });
      
      window.ethereum.on('chainChanged', () => {
        console.log("MetaMask network changed, reloading...");
        sessionStorage.clear();
        window.location.reload(true);
      });
    }
    
  } catch (error) {
    console.error("Blockchain initialization error:", error);
    throw error;
  }

  return { web3, contract };
};

export default Blockchain;
