import requests
import json
import time
import func_triangular_arb


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

    while True:

        pairs = retrieve_uniswap_information()["data"]["pools"]
        # print(pairs[0])
        structured_pairs = func_triangular_arb.structure_trading_pairs(
            pairs, limit=500)

        # Get surface rates
        surface_rates_list = []
        for t_pair in structured_pairs:
            surface_rate = func_triangular_arb.calc_triangular_arb_surface_rate(
                t_pair, min_rate=1.5)
            if len(surface_rate) > 0:
                # print(surface_rate)
                surface_rates_list.append(surface_rate)

        # Save to JSON file
        with open("uniswap_surface_rates.json", "w") as fp:
            json.dump(surface_rates_list, fp)
            print("file saved")

        time.sleep(60)  # update the file every minute

        # todo: automate the javascript file to keep reading from that file.
