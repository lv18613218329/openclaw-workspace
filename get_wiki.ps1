$token = "WamWwuKhBiClHJknRkecRdQnnTc"
$url = "https://open.feishu.cn/open-apis/wiki/v2/nodes/$token"

# Try to get node info
curl -s $url -H "Authorization: Bearer " -H "Content-Type: application/json"