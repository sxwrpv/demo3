// Contract configuration
const contractAddress = "0xa3e5f7dbb744e7f99c75bdd4adc00a94d5433ad9"; // Deployed on Base
const contractABI = [
    // Product listing
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
    // Product purchase
    {
        "inputs": [
            { "internalType": "uint256", "name": "_id", "type": "uint256" }
        ],
        "name": "buyProduct",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    // Release funds to seller
    {
        "inputs": [
            { "internalType": "uint256", "name": "_id", "type": "uint256" }
        ],
        "name": "releaseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Raise dispute
    {
        "inputs": [
            { "internalType": "uint256", "name": "_id", "type": "uint256" }
        ],
        "name": "raiseDispute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Get product count
    {
        "inputs": [],
        "name": "productCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Get product details
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "products",
        "outputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "price", "type": "uint256" },
            { "internalType": "address", "name": "seller", "type": "address" },
            { "internalType": "address", "name": "buyer", "type": "address" },
            { "internalType": "string", "name": "imageCID", "type": "string" },
            { "internalType": "bool", "name": "purchased", "type": "bool" },
            { "internalType": "bool", "name": "fundsReleased", "type": "bool" },
            { "internalType": "bool", "name": "disputeRaised", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Get products by seller
    {
        "inputs": [
            { "internalType": "address", "name": "_seller", "type": "address" }
        ],
        "name": "getProductsBySeller",
        "outputs": [
            { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Get products by buyer
    {
        "inputs": [
            { "internalType": "address", "name": "_buyer", "type": "address" }
        ],
        "name": "getProductsByBuyer",
        "outputs": [
            { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Global variables
let web3;
let contract;
let currentAccount;
let isConnected = false;
let products = [];
let currentPage = 1;
let productsPerPage = 8;
let totalProducts = 0;

// Backend service endpoint for IPFS uploads (replace with your actual backend endpoint)
const backendEndpoint = "https://your-backend-service.com/api/upload-to-ipfs";

// DOM Elements
const statusMessageEl = document.getElementById("statusMessage");
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletAddressEl = document.getElementById("walletAddress");

// Initialize the app when the page loads
window.addEventListener("load", async () => {
    initApp();
});

// Initialize the application
async function initApp() {
    try {
        // Check if MetaMask is installed
        if (window.ethereum) {
            // Create a new web3 instance
            web3 = new Web3(window.ethereum);
            
            // Create contract instance
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Check if user is already connected
            const accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                isConnected = true;
                updateWalletStatus();
                
                // Load products
                loadProducts();
                
                // Set up event listeners for account changes
                setupEventListeners();
            }
        } else {
            showStatus("Please install MetaMask to use this application", "error");
        }
    } catch (error) {
        console.error("Initialization error:", error);
        showStatus("Failed to initialize the application", "error");
    }
}

// Set up blockchain event listeners
function setupEventListeners() {
    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                updateWalletStatus();
                loadProducts();
                loadMyPurchases();
                loadMyListings();
            } else {
                isConnected = false;
                updateWalletStatus();
                showStatus("Your wallet has been disconnected", "error");
            }
        });
        
        // Listen for chain changes
        window.ethereum.on("chainChanged", () => {
            window.location.reload();
        });
    }
}

// Connect wallet function
async function connectWallet() {
    try {
        showStatus("Connecting to your wallet...", "loading");
        
        if (!window.ethereum) {
            showStatus("Please install MetaMask to use this application", "error");
            return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: "eth_requestAccounts" 
        });
        
        // Check if we got the accounts
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            isConnected = true;
            
            // Create contract instance if not already created
            if (!contract) {
                contract = new web3.eth.Contract(contractABI, contractAddress);
            }
            
            updateWalletStatus();
            showStatus("Wallet connected successfully!", "success");
            
            // Load products after connecting
            loadProducts();
            loadMyPurchases();
            loadMyListings();
            
            // Set up event listeners
            setupEventListeners();
        } else {
            showStatus("Failed to connect to your wallet", "error");
        }
    } catch (error) {
        console.error("Wallet connection error:", error);
        showStatus("Error connecting to your wallet: " + error.message, "error");
    }
}

// Update the wallet connection status display
function updateWalletStatus() {
    if (isConnected && currentAccount) {
        const shortAddress = `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`;
        walletAddressEl.innerHTML = `Connected: ${shortAddress}`;
        connectWalletBtn.textContent = "Switch Wallet";
    } else {
        walletAddressEl.innerHTML = "Not connected";
        connectWalletBtn.textContent = "Connect Wallet";
    }
}

// Display status messages
function showStatus(message, type = "info") {
    statusMessageEl.textContent = message;
    statusMessageEl.className = "status " + type;
    
    // Clear success and info messages after 5 seconds
    if (type === "success" || type === "info") {
        setTimeout(() => {
            statusMessageEl.textContent = "";
            statusMessageEl.className = "status";
        }, 5000);
    }
}

// Upload image to IPFS via backend service
async function uploadImageToIPFS(file) {
    try {
        showStatus("Uploading image...", "loading");
        
        const formData = new FormData();
        formData.append("file", file);
        
        // Use a backend service to handle IPFS uploads instead of exposing API keys
        const response = await fetch(backendEndpoint, {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            throw new Error("Failed to upload image");
        }
        
        const data = await response.json();
        
        if (data.success && data.ipfsHash) {
            showStatus("Image uploaded successfully", "success");
            return data.ipfsHash;
        } else {
            throw new Error(data.message || "Failed to upload image");
        }
    } catch (error) {
        console.error("Image upload error:", error);
        showStatus("Error uploading image: " + error.message, "error");
        throw error;
    }
}

// List a new product
async function listProduct() {
    try {
        // Check wallet connection
        if (!isConnected) {
            showStatus("Please connect your wallet first", "error");
            return;
        }
        
        const name = document.getElementById("productName").value.trim();
        const description = document.getElementById("productDescription").value.trim();
        const priceEth = document.getElementById("productPrice").value;
        const fileInput = document.getElementById("productImage");
        
        // Validate inputs
        if (!name) {
            showStatus("Please enter a product name", "error");
            return;
        }
        
        if (!description) {
            showStatus("Please enter a product description", "error");
            return;
        }
        
        if (!priceEth || parseFloat(priceEth) <= 0) {
            showStatus("Please enter a valid price", "error");
            return;
        }
        
        if (fileInput.files.length === 0) {
            showStatus("Please select an image for your product", "error");
            return;
        }
        
        // Convert price to wei
        const price = web3.utils.toWei(priceEth, "ether");
        
        // Disable button to prevent multiple submissions
        const listButton = document.getElementById("listProductBtn");
        listButton.disabled = true;
        
        showStatus("Processing your product listing...", "loading");
        
        // Upload image to IPFS
        const imageCID = await uploadImageToIPFS(fileInput.files[0]);
        
        // Estimate gas for the transaction
        const gasEstimate = await contract.methods.listProduct(name, description, price, imageCID).estimateGas({
            from: currentAccount
        });
        
        // List the product on the blockchain
        await contract.methods.listProduct(name, description, price, imageCID).send({
            from: currentAccount,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
        });
        
        // Reset form
        document.getElementById("productName").value = "";
        document.getElementById("productDescription").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productImage").value = "";
        
        showStatus("Product listed successfully!", "success");
        
        // Reload products
        loadProducts();
        loadMyListings();
        
        // Re-enable the button
        listButton.disabled = false;
        
        // Switch to browse tab
        openTab('browse');
    } catch (error) {
        console.error("Product listing error:", error);
        showStatus("Error listing product: " + error.message, "error");
        
        // Re-enable the button
        const listButton = document.getElementById("listProductBtn");
        if (listButton) {
            listButton.disabled = false;
        }
    }
}

// Load all available products
async function loadProducts() {
    try {
        if (!isConnected || !contract) {
            return;
        }
        
        showStatus("Loading products...", "loading");
        
        // Get product count from contract
        totalProducts = await contract.methods.productCount().call();
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = Math.min(startIndex + productsPerPage, totalProducts);
        
        products = [];
        
        // Load products for current page
        for (let i = startIndex + 1; i <= endIndex; i++) {
            const product = await contract.methods.products(i).call();
            
            // Only show products that are not purchased
            if (!product.purchased) {
                products.push(product);
            }
        }
        
        // Display products
        displayProducts();
        
        // Update pagination buttons
        updatePaginationControls();
        
        showStatus("", "");
    } catch (error) {
        console.error("Error loading products:", error);
        showStatus("Error loading products: " + error.message, "error");
    }
}

// Display products in the grid
function displayProducts() {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = "";
    
    if (products.length === 0) {
        productGrid.innerHTML = "<p>No products available at the moment.</p>";
        return;
    }
    
    products.forEach(product => {
        const priceInEth = web3.utils.fromWei(product.price, "ether");
        
        productGrid.innerHTML += `
            <div class="product-card">
                <img src="https://ipfs.io/ipfs/${product.imageCID}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="product-price">Price: ${priceInEth} ETH</p>
                <button onclick="showBuyModal(${product.id}, '${product.price}')">Buy Now</button>
            </div>
        `;
    });
}

// Update pagination controls
function updatePaginationControls() {
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const currentPageEl = document.getElementById("currentPage");
    
    prevPageBtn.disabled = currentPage === 1;
    
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    nextPageBtn.disabled = currentPage >= totalPages;
    
    currentPageEl.textContent = `Page ${currentPage} of ${totalPages || 1}`;
}

// Navigate to previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadProducts();
    }
}

// Navigate to next page
function nextPage() {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadProducts();
    }
}

// Show buy product modal
function showBuyModal(productId, price) {
    if (!isConnected) {
        showStatus("Please connect your wallet first", "error");
        return;
    }
    
    const modal = document.getElementById("productModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");
    
    modalTitle.textContent = "Confirm Purchase";
    
    const priceInEth = web3.utils.fromWei(price, "ether");
    
    modalContent.innerHTML = `
        <p>Are you sure you want to purchase this product for ${priceInEth} ETH?</p>
        <p>A gas fee will be charged in addition to the product price.</p>
        <button onclick="buyProduct(${productId}, '${price}')">Confirm Purchase</button>
    `;
    
    modal.style.display = "flex";
}

// Close modal
function closeModal() {
    const modal = document.getElementById("productModal");
    modal.style.display = "none";
}

// Buy a product
async function buyProduct(productId, price) {
    try {
        if (!isConnected) {
            showStatus("Please connect your wallet first", "error");
            return;
        }
        
        closeModal();
        showStatus("Processing your purchase...", "loading");
        
        // Estimate gas for the transaction
        const gasEstimate = await contract.methods.buyProduct(productId).estimateGas({
            from: currentAccount,
            value: price
        });
        
        // Buy the product
        await contract.methods.buyProduct(productId).send({
            from: currentAccount,
            value: price,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
        });
        
        showStatus("Product purchased successfully!", "success");
        
        // Reload products and purchases
        loadProducts();
        loadMyPurchases();
    } catch (error) {
        console.error("Purchase error:", error);
        showStatus("Error purchasing product: " + error.message, "error");
    }
}

// Load user's purchases
async function loadMyPurchases() {
    try {
        if (!isConnected || !contract) {
            return;
        }
        
        showStatus("Loading your purchases...", "loading");
        
        // Get user's purchased product IDs
        const purchasedIds = await contract.methods.getProductsByBuyer(currentAccount).call();
        const purchasedProducts = [];
        
        // Load details for each product
        for (let id of purchasedIds) {
            const product = await contract.methods.products(id).call();
            purchasedProducts.push(product);
        }
        
        // Display purchased products
        displayPurchases(purchasedProducts);
        
        showStatus("", "");
    } catch (error) {
        console.error("Error loading purchases:", error);
        showStatus("Error loading your purchases: " + error.message, "error");
    }
}

// Display user's purchases
function displayPurchases(purchasedProducts) {
    const purchasesGrid = document.getElementById("purchasesGrid");
    purchasesGrid.innerHTML = "";
    
    if (purchasedProducts.length === 0) {
        purchasesGrid.innerHTML = "<p>You haven't made any purchases yet.</p>";
        return;
    }
    
    purchasedProducts.forEach(product => {
        const priceInEth = web3.utils.fromWei(product.price, "ether");
        let status = "Purchased";
        let actions = "";
        
        if (product.fundsReleased) {
            status = "Completed";
        } else if (product.disputeRaised) {
            status = "Dispute Raised";
        } else {
            actions = `
                <button onclick="releaseFunds(${product.id})">Release Funds</button>
                <button onclick="raiseDispute(${product.id})">Raise Dispute</button>
            `;
        }
        
        purchasesGrid.innerHTML += `
            <div class="product-card">
                <img src="https://ipfs.io/ipfs/${product.imageCID}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="product-price">Price: ${priceInEth} ETH</p>
                <p>Status: ${status}</p>
                <div>${actions}</div>
            </div>
        `;
    });
}

// Load user's product listings
async function loadMyListings() {
    try {
        if (!isConnected || !contract) {
            return;
        }
        
        showStatus("Loading your listings...", "loading");
        
        // Get user's listed product IDs
        const listedIds = await contract.methods.getProductsBySeller(currentAccount).call();
        const listedProducts = [];
        
        // Load details for each product
        for (let id of listedIds) {
            const product = await contract.methods.products(id).call();
            listedProducts.push(product);
        }
        
        // Display listed products
        displayListings(listedProducts);
        
        showStatus("", "");
    } catch (error) {
        console.error("Error loading listings:", error);
        showStatus("Error loading your listings: " + error.message, "error");
    }
}

// Display user's listings
function displayListings(listedProducts) {
    const listingsGrid = document.getElementById("listingsGrid");
    listingsGrid.innerHTML = "";
    
    if (listedProducts.length === 0) {
        listingsGrid.innerHTML = "<p>You haven't listed any products yet.</p>";
        return;
    }
    
    listedProducts.forEach(product => {
        const priceInEth = web3.utils.fromWei(product.price, "ether");
        let status = "For Sale";
        
        if (product.purchased) {
            if (product.fundsReleased) {
                status = "Sold (Completed)";
            } else if (product.disputeRaised) {
                status = "Sold (Dispute Raised)";
            } else {
                status = "Sold (Awaiting Confirmation)";
            }
        }
        
        listingsGrid.innerHTML += `
            <div class="product-card">
                <img src="https://ipfs.io/ipfs/${product.imageCID}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="product-price">Price: ${priceInEth} ETH</p>
                <p>Status: ${status}</p>
            </div>
        `;
    });
}

// Release funds to the seller
async function releaseFunds(productId) {
    try {
        if (!isConnected) {
            showStatus("Please connect your wallet first", "error");
            return;
        }
        
        showStatus("Processing fund release...", "loading");
        
        // Estimate gas for the transaction
        const gasEstimate = await contract.methods.releaseFunds(productId).estimateGas({
            from: currentAccount
        });
        
        // Release funds
        await contract.methods.releaseFunds(productId).send({
            from: currentAccount,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
        });
        
        showStatus("Funds released successfully!", "success");
        
        // Reload purchases
        loadMyPurchases();
    } catch (error) {
        console.error("Fund release error:", error);
        showStatus("Error releasing funds: " + error.message, "error");
    }
}

// Raise a dispute for a purchase
async function raiseDispute(productId) {
    try {
        if (!isConnected) {
            showStatus("Please connect your wallet first", "error");
            return;
        }
        
        showStatus("Processing your dispute...", "loading");
        
        // Estimate gas for the transaction
        const gasEstimate = await contract.methods.raiseDispute(productId).estimateGas({
            from: currentAccount
        });
        
        // Raise dispute
        await contract.methods.raiseDispute(productId).send({
            from: currentAccount,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer to gas estimate
        });
        
        showStatus("Dispute raised successfully! Our team will review the issue.", "success");
        
        // Reload purchases
        loadMyPurchases();
    } catch (error) {
        console.error("Dispute error:", error);
        showStatus("Error raising dispute: " + error.message, "error");
    }
}

// Open a tab
function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }
    
    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }
    
    // Show the selected tab content
    document.getElementById(tabName).classList.add("active");
    
    // Find and activate the corresponding button
    const buttons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute("onclick").includes(tabName)) {
            buttons[i].classList.add("active");
        }
    }
    
    // Load data for specific tabs
    if (tabName === "browse") {
        loadProducts();
    } else if (tabName === "my-purchases") {
        loadMyPurchases();
    } else if (tabName === "my-listings") {
        loadMyListings();
    }
}

// Helper function to handle errors
function handleError(error, defaultMessage) {
    console.error(error);
    let errorMessage = defaultMessage;
    
    if (error.message) {
        // Extract useful information from error messages
        if (error.message.includes("User denied")) {
            errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction";
        } else {
            errorMessage = error.message;
        }
    }
    
    showStatus(errorMessage, "error");
}

// Handle window events
window.onclick = (event) => {
    const modal = document.getElementById("productModal");
    if (event.target === modal) {
        closeModal();
    }
};

// Event listener for network changes
if (window.ethereum) {
    window.ethereum.on("networkChanged", (networkId) => {
        // Reload the page on network change
        window.location.reload();
    });
}
