// const Web3 = require('web3')
const { ethers } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/8e01ab8bd9f54645ae4d48f7642828ed');
// const web3 = new Web3('https://mainnet.infura.io/v3/8e01ab8bd9f54645ae4d48f7642828ed')
console.log(provider)