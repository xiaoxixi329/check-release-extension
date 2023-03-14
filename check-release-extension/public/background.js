/* eslint-disable no-undef */
chrome.windows.authorization = null
// let authorization = null

// 拦截接口获取token
chrome.webRequest.onBeforeSendHeaders.addListener(({requestHeaders}) => {
  const auth = requestHeaders?.find(item => item.name === 'Authorization')
  if(auth) {
    // authorization = auth.value
    chrome.windows.authorization = auth.value
    // chrome.storage.sync.set({ authorization: auth.value});
  }
  return { requestHeaders }
}, {
  urls: [
    'https://developer-bff.tuhuyun.cn/int-service-arch-chuangtzu-base/v1/base/rbac/user/profile/authorized_origin_resource?*'
  ],
}, ["requestHeaders"])

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendResponse(chrome.windows.authorization)
})