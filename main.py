import requests
import json


def retrieve_uniswap_information():
    """ 
    Get GraphQL mid prices for Uniswap 

    playground link:
    https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3
    """
    query = """
        {
        pools (orderBy: totalValueLockedETH,
            orderDirection: desc,
            first: 500){
            id
            totalValueLockedETH
            token0Price
            token1Price
            feeTier
            token0 {id symbol name decimals}
            token1 {id symbol name decimals}
        }
    }
    
    """

    endpoint = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"
    req = requests.post(endpoint, json={'query': query})
    json_dict = json.loads(req.text)
    return json_dict


if __name__ == "__main__":
    pairs = retrieve_uniswap_information()["data"]["pools"]
    print(pairs[0])
