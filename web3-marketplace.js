const contractAddress = "0xa3e5f7dbb744e7f99c75bdd4adc00a94d5433ad9"; // Your deployed contract
const contractABI = [
    {
        "inputs": [],
        "name": "productCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }, { "internalType": "uint256", "name": "_price", "type": "uint256" }],
        "name": "listProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
        "name": "buyProduct",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
        "name": "raiseDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let web3;
let marketplaceContract;
let userAccount;

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        userAccount = accounts[0];
        marketplaceContract = new web3.eth.Contract(contractABI, contractAddress);
        alert(`Connected: ${userAccount}`);
    } else {
        alert("Please install MetaMask!");
    }
}

async function listProduct() {
    const name = document.getElementById("productName").value;
    const price = document.getElementById("productPrice").value;
    await marketplaceContract.methods.listProduct(name, price).send({ from: userAccount });
    alert("Product Listed!");
}

async function buyProduct() {
    const productId = document.getElementById("buyProductId").value;
    const price = document.getElementById("buyProductPrice").value;
    await marketplaceContract.methods.buyProduct(productId).send({ from: userAccount, value: price });
    alert("Product Purchased!");
}

async function releaseFunds() {
    const productId = document.getElementById("releaseProductId").value;
    await marketplaceContract.methods.releaseFunds(productId).send({ from: userAccount });
    alert("Funds Released!");
}

async function raiseDispute() {
    const productId = document.getElementById("disputeProductId").value;
    await marketplaceContract.methods.raiseDispute(productId).send({ from: userAccount });
    alert("Dispute Raised!");
}
