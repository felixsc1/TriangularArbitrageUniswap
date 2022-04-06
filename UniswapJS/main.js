const ethers = require('ethers')
// https://docs.uniswap.org/sdk/guides/creating-a-trade
const QuoterABI = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json').abi

// READ FILE ////////////////
function getFile(fPath) {
    // similar to python context manager:
    const fs = require('fs')

    try {
        const data = fs.readFileSync(fPath, 'utf-8')
        return data
    } catch (err) {
        return []
    }
}

// GET PRICE ///////////////////
async function getPrice(factory, amtIn, tradeDirection) {

    // Get Provider
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/8e01ab8bd9f54645ae4d48f7642828ed')
    // get functions that I need (can be obtained on etherscan, same for all uniswap pools)
    const ABI = [
        "function token0() external view returns (address)",
        "function token1() external view returns (address)",
        "function fee() external view returns (uint24)"
    ]
    // Get pool token information
    const poolContract = new ethers.Contract(factory, ABI, provider)
    let token0Address = await poolContract.token0()   // note: ethers doesn't need .call() unlike web3.js
    let token1Address = await poolContract.token1()
    let tokenFee = await poolContract.fee()
    // console.log(token0address, token1address, tokenFee)

    // Get individual token information (symbol, name, decimals)
    // we actually already got this from graphQL, but just to be sure we grab the real blockchain data here
    let addressArray = [token0Address, token1Address]
    let tokenInfoArray = []
    for (let i=0; i< addressArray.length; i++) {
        let tokenAddress = addressArray[i]
        let tokenABI = [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint)"
        ]
        let contract = new ethers.Contract(tokenAddress, tokenABI, provider)
        let tokenSymbol = await contract.symbol()
        let tokenName = await contract.name()
        let tokenDecimals = await contract.decimals()
        let obj = {
            id: "token" + i,
            tokenSymbol: tokenSymbol,
            tokenName: tokenName,
            tokenDecimals: tokenDecimals,
            tokenAddress: tokenAddress
        }
        tokenInfoArray.push(obj)
    }
    // console.log(tokenInfoArray)

    // Identify the correct token to input as A and B
    let inputTokenA = ''
    let inputDecimalsA = 0
    let inputTokenB = ''
    let inputDecimalsB = 0

    if (tradeDirection == "baseToQuote") {
        inputTokenA = tokenInfoArray[0].tokenAddress
        inputDecimalsA = tokenInfoArray[0].tokenDecimals
        inputTokenB = tokenInfoArray[1].tokenAddress
        inputDecimalsB = tokenInfoArray[1].tokenDecimals

    } else if (tradeDirection == "quoteToBase") {
        inputTokenA = tokenInfoArray[1].tokenAddress
        inputDecimalsA = tokenInfoArray[1].tokenDecimals
        inputTokenB = tokenInfoArray[0].tokenAddress
        inputDecimalsB = tokenInfoArray[0].tokenDecimals
    }

    // Reformat amtIn to the format expected by smart contract
    // if amtIn is a number ("not not-a-number")
    if (!isNaN(amtIn)) {amtIn = amtIn.toString()}
    let amountIn = ethers.utils.parseUnits(amtIn, inputDecimalsA).toString()
    // console.log(inputTokenA, inputDecimalsA, amountIn)
 
    // Get Uniswap V3 Quote
    // address from: https://docs.uniswap.org/protocol/reference/deployments
    // docs: https://docs.uniswap.org/protocol/reference/periphery/lens/Quoter
    // even though we use writefunction, apparently callstatic doesnt need a wallet connected.
    const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
    const quoterContract = new ethers.Contract(quoterAddress, QuoterABI, provider)
    let quotedAmountOut = 0
    try {
        quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            inputTokenA,
            inputTokenB,
            tokenFee,
            amountIn,
            0
        )
    } catch (err) {
        return 0
    }

    // Format output  (ethers formatUnits is the opposite of parseUnits)
    // this time use decimals of B token, thats what we swapped for
    let outputAmount = ethers.utils.formatUnits(quotedAmountOut, inputDecimalsB).toString()
    // console.log(outputAmount)
    return outputAmount
}


// GET DEPTH ///////////////////
async function getDepth(amountIn, limit) {

    // Get JSON surface rates
    console.log("Reading surface rate information...")
    let fileInfo = getFile("../uniswap_surface_rates.json")
    fileJsonArray = JSON.parse(fileInfo)
    fileJsonArrayLimit = fileJsonArray.slice(0, limit)
    // console.log(fileJsonArrayLimit)

    // Loop through each trade and get price information
    for (let i=0; i< fileJsonArrayLimit.length; i++) {

        // extract the variables
        let pair1ContractAddress = fileJsonArrayLimit[i].poolContract1
        let pair2ContractAddress = fileJsonArrayLimit[i].poolContract2
        let pair3ContractAddress = fileJsonArrayLimit[i].poolContract3
        let trade1Direction = fileJsonArrayLimit[i].poolDirectionTrade1
        let trade2Direction = fileJsonArrayLimit[i].poolDirectionTrade2
        let trade3Direction = fileJsonArrayLimit[i].poolDirectionTrade3

        // Trade 1
        console.log("Checking trade 1 acquired coin...")
        let acquiredCoinT1 = await getPrice(pair1ContractAddress, amountIn, trade1Direction)

        // Trade 2
        console.log("Checking trade 2 acquired coin...")
        if (acquiredCoinT1 == 0) {return}
        let acquiredCoinT2 = await getPrice(pair2ContractAddress, acquiredCoinT1, trade2Direction)

        // Trade 3
        console.log("Checking trade 3 acquired coin...")
        if (acquiredCoinT2 == 0) {return}
        let acquiredCoinT3 = await getPrice(pair3ContractAddress, acquiredCoinT2, trade3Direction)

        console.log(amountIn, acquiredCoinT3)

    }

    return
}

getDepth(amountIn=1, limit=1)