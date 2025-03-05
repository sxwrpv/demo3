const contractAddress = "0xa3e5f7dbb744e7f99c75bdd4adc00a94d5433ad9"; // Deployed on Base
const contractABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_name", "type": "string" },
            { "internalType": "string", "name": "_description", "type": "string" },
            { "internalType": "uint256", "name": "_price", "type": "uint256" },
            { "internalType": "string", "name": "_imageCID", "type": "string" }
        ],
        "name": "listProduct",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_id", "type": "uint256" }
        ],
        "name": "buyProduct",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_id", "type": "uint256" }
        ],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

let web3;
let contract;
const pinataApiKey = "b71b9c9f1c308cc3b745";
const pinataSecretApiKey = "eafa6d863c7d434cfe6d722db1f576579a454c3cb581a8b0ea7a359c1d34c28b";

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        contract = new web3.eth.Contract(contractABI, contractAddress);
        alert("Wallet connected!");
    } else {
        alert("Please install MetaMask!");
    }
}

async function uploadToIPFS(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            "pinata_api_key": pinataApiKey,
            "pinata_secret_api_key": pinataSecretApiKey
        },
        body: formData
    });

    const data = await response.json();
    return data.IpfsHash;
}

async function listProduct() {
    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = web3.utils.toWei(document.getElementById("productPrice").value, "ether");
    const fileInput = document.getElementById("productImage");

    if (fileInput.files.length === 0) {
        alert("Please select an image");
        return;
    }

    const imageCID = await uploadToIPFS(fileInput.files[0]);
    const accounts = await web3.eth.getAccounts();
    await contract.methods.listProduct(name, description, price, imageCID).send({ from: accounts[0] });
    alert("Product listed successfully!");
}

async function fetchProducts() {
    const productCount = await contract.methods.productCount().call();
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = "";

    for (let i = 1; i <= productCount; i++) {
        const product = await contract.methods.products(i).call();
        if (product.purchased) continue;

        productGrid.innerHTML += `
            <div class="product-card">
                <img src="https://ipfs.io/ipfs/${product.imageCID}" alt="${product.name}" width="150">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: ${web3.utils.fromWei(product.price, "ether")} ETH</p>
                <button onclick="buyProduct(${product.id}, '${product.price}')">Buy</button>
            </div>
        `;
    }
}
