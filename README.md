# Uniswap V3 - Triangular arbitrage

For basics about triangular arbitrage, see my other [repo](https://github.com/felixsc1/TriangularArbitragePython) for centralized exchanges.

This is the implementation for DeFi. Uniswap V3 uses graphQL to query pool data (see [sandbox example](https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3)).


## Features

1. Python part:
- post graphQL query using python requests.
- Group all available uniswap pools into triangular arbitrage tradeable groups.
- Calculate the surface rate arbitrage opportunities (not yet considering slippage).
- Export data to json to continue in javascript.

2. Javascript part (because uniswap SDK is built in JS):
to be continued...