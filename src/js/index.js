const $alertInfo = $("#alertInfo");
let log = {
  appid: '',
  env: '',
  content: ''
}
let baseParams = {
  appid: '',
  env: ''
}
let releaseBaseInfo = {
  statusText: ''
}

let resultInfo = {
  result: '',

}

// 获取鉴权信息
let authorization = null

// 获取token
chrome.runtime.sendMessage({}, (data) => {
  authorization = data
  isLogin()
})
const isLogin = () => {
  console.log(authorization);
  if(!authorization) {
    showTips("请先打开/刷新<a href='https://developer.tuhuyun.cn/#/' target='_blank'>发布系统</a>页面，再使用本插件！")
  }
}

//请求函数
const request = async ({url, params={}, method='POST'}) => {
  const init = {
    method,
    headers: {
      authorization,
      authtype: "oidc",
      "Content-Type": "application/json",      
    },
    body: JSON.stringify(params),
  }
  if(method === 'GET') {
    delete init.body
  }
  const res = await fetch(url, init)
  if (res.status === 401) {
    showTips("请先刷新<a href='https://developer.tuhuyun.cn/#/' target='_blank'>发布系统</a>页面，再使用本插件！")
  } else {
    return await res.json();
  }
}

const showTips = (msg) => {
  $(".alertPanel").removeClass("hide");
  $alertInfo.html(`
    <div class="alert alert-danger alert-dismissible alertDiv" role="alert">
    ${msg}
    </div>
  `);
}

// 获取某个appid某个环境最新的一条发布记录
const getLogList = async () => {
  if(!(baseParams.appid && baseParams.env)) return
  const { data } = await request({
    url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logList',
    params: baseParams
  })
  return data?.logList[0]
}

// 获取某发布记录的过程节点
const getLogOperationList = async (taskId, deployMainId) => {
  if(!(taskId && deployMainId)) return
  const { data } = await request({
    url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logOperationList',
    params: {
      ...baseParams,
      taskId,
      deployMainId
    }
  })
  return data?.operationList[0]  
}
// 获取某个节点的发布日志
const getLogOperationData = async (taskId, deployMainId, operation) => {
  if(!(taskId && deployMainId && operation)) return
  const { data } = await request({
    url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logOperationData',
    params: {
      ...baseParams,
      taskId,
      deployMainId,
      operation
    }
  })
  log = data.log
  console.log(log)
}
const suggestAppId = async (value) => {
  const {code, data} = await request({
    url: `https://developer-bff.tuhuyun.cn/int-service-arch-developer-java/v1/developer/appids?appId=${value}&page=1&pageSize=10`,
    method: "GET"
  })
  if(code === 20000) {
    console.log(data);
  }
}
$("#appId").on('input propertychange', function() {
  console.log('val', );
  suggestAppId($(this).val())
})
$("#search").click(async ()=> {
  baseParams.appid = $("#appId").val()
  baseParams.env = $("#env option:selected").val()
  const { task_id, deploy_main_id } = await getLogList()
  const { operation } = await getLogOperationList(task_id, deploy_main_id)
  await getLogOperationData(task_id, deploy_main_id, operation)
})

const init = () => {
  
}
