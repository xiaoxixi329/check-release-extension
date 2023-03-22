/* eslint-disable no-undef */
// 拦截接口获取token
chrome.webRequest.onBeforeSendHeaders.addListener(({requestHeaders}) => {
  const auth = requestHeaders?.find(item => item.name === 'Authorization')
  if(auth) {
    chrome.storage.sync.set({ authorization: auth.value});
  }
  return { requestHeaders }
}, {
  urls: [
    'https://developer-bff.tuhuyun.cn/int-service-arch-chuangtzu-base/v1/base/user/current'
  ],
}, ["requestHeaders"])

// 拦截开始发布接口
chrome.webRequest.onBeforeRequest.addListener((data) => {
  console.log(JSON.parse(ab2str(data.requestBody.raw[0].bytes)));
}, {
  urls: [
    'https://developer-bff.tuhuyun.cn/web_api/deploy/taskStart'
  ],
}, ["requestBody"])

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}