document.addEventListener("DOMContentLoaded", function () {
  const sendButton = document.getElementById("sendButton");
  const outputDiv = document.getElementById("output");

  // Network configurations
  const networks = {
    sepolia: {
      rpcUrl: "https://ethereum-sepolia.publicnode.com",
      symbol: "ETH",
    },
    ethereum: {
      rpcUrl: "https://eth.llamarpc.com",
      symbol: "ETH",
    },
  };

  sendButton.addEventListener("click", async function () {
    // Get input values
    const privateKey = document.getElementById("privateKey").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const recipient = document.getElementById("recipient").value.trim();
    const network = document.getElementById("network").value;

    // Clear previous output
    outputDiv.innerHTML = "<p>Processing transaction...</p>";
    console.log("Starting transaction...");

    try {
      // VALIDATE INPUTS
      if (!privateKey) throw new Error("Private key is required");
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error("Amount must be a positive number");
      }
      if (!recipient) throw new Error("Recipient address is required");

      // Validate address format
      if (!Web3.utils.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      // SETUP WEB3 AND ACCOUNT
      const web3 = new Web3(networks[network].rpcUrl);

      // Create account from private key
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(account);

      console.log("Sender address:", account.address);
      console.log("Recipient:", recipient);
      console.log("Amount:", amount, networks[network].symbol);

      // CHECK BALANCE (CRITICAL FIX)
      const balanceWei = await web3.eth.getBalance(account.address);
      const balanceEth = web3.utils.fromWei(balanceWei, "ether");
      console.log("💰 Balance:", balanceEth, "ETH");

      if (parseFloat(balanceEth) === 0) {
        throw new Error(
          `Zero balance! Address ${account.address} has 0 ETH. Get test ETH from: https://sepoliafaucet.com/`,
        );
      }

      // PREPARE TRANSACTION
      const amountWei = web3.utils.toWei(amount, "ether");
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(
        account.address,
        "pending",
      );

      const transaction = {
        from: account.address,
        to: recipient,
        value: amountWei,
        gasPrice: gasPrice,
        gas: 21000, // Standard gas limit for ETH transfer
        nonce: nonce,
        chainId: networks[network].chainId,
      };
      console.log("Transaction prepared:", transaction);

      // ESTIMATE GAS (optional but good practice)
      try {
        const estimatedGas = await web3.eth.estimateGas(transaction);
        transaction.gas = estimatedGas;
      } catch (gasError) {
        console.log("Using default gas limit:", transaction.gas);
      }

      // SEND TRANSACTION
      console.log("Sending transaction...");

      // Sign and send transaction
      const signedTx = await web3.eth.accounts.signTransaction(
        transaction,
        privateKey,
      );
      const txReceipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      );

      const txHash = signedTx.transactionHash || txReceipt.transactionHash;

      // OUTPUT TX HASH TO CONSOLE
      console.log("✅ Transaction Hash:", txHash);
      console.log("Transaction details:", txReceipt);

      // WAIT FOR CONFIRMATION
      outputDiv.innerHTML = `
        <p class="success">✅ Transaction sent!</p>
        <p><strong>Transaction Hash:</strong></p>
        <code>${txHash}</code>
        <p>Waiting for confirmation...</p>
      `;

      // FINAL OUTPUT
      outputDiv.innerHTML = `
        <p class="success">✅ Transaction confirmed!</p>
        <p><strong>Transaction Hash:</strong></p>
        <code>${txHash}</code>
        <p><strong>Block Number:</strong> ${txReceipt.blockNumber}</p>
        <p><strong>Gas Used:</strong> ${txReceipt.gasUsed}</p>
        <p><strong>Status:</strong> ${txReceipt.status ? "Success" : "Failed"}</p>
        <p>
          <a class="explorer-link" href="https://${network === "sepolia" ? "sepolia." : ""}etherscan.io/tx/${txHash}" target="_blank">
            🔍 View on Explorer
          </a>
        </p>
      `;

      console.log("✅ Transaction confirmed in block:", txReceipt.blockNumber);
      console.log("Gas used:", txReceipt.gasUsed);
      console.log(
        "Transaction status:",
        txReceipt.status ? "Success" : "Failed",
      );
    } catch (error) {
      // ERROR HANDLING
      console.error("❌ Error:", error.message);
      console.error("Full error:", error);

      let errorMessage = error.message;

      // Parse common web3 errors
      if (error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient balance for transaction";
      } else if (error.message.includes("wrong private key")) {
        errorMessage = "Invalid private key format";
      } else if (error.message.includes("nonce too low")) {
        errorMessage = "Transaction nonce error - try again";
      }

      outputDiv.innerHTML = `
        <div class="error">
          <p><strong>❌ Transaction failed</strong></p>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Please check your inputs and try again.</p>
          <p><small>Technical details: ${error.message}</small></p>
        </div>
      `;
    }
  });

  // Test data for easy testing
  console.log("🔧 For testing on Sepolia:");
  console.log(
    "Test Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  );
  console.log("Test Address 1: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("Test Address 2: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  console.log("Get test ETH from: https://sepoliafaucet.com/");
});
