

export const bundlesApi = 'https://api.symmetry.fi/v1/funds-getter';

export const fetchBundles = async () => {
  let request = await fetch(bundlesApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "request":"get_funds",
      "params":{
        "filters":{
          "by":"tvl",
          "order":"desc"
        },
        "attributes":[
          "creation_time",
          "manager",
          "name",
          "symbol",
          // "short_historical",
          "rule_token_weights",
          "tvl",
          "price",
          "current_comp_token",
          "sortkey",
          "fund_token",
          "image_uri"
        ],
        "count":50,
        "page":1,
        "actively_managed":false,
        "min_tvl":0
      }
    })
  });
  let response = await request.json();
  return response;
}