/* eslint-disable no-undef */
const version = chrome.runtime.getManifest().version
let sensors = window['sensorsDataAnalytic201505'];
// 初始化神策对象
sensors.init({
  server_url: 'http://analytics.tuhu.com/sa?project=www_qipeilong_cn_product',
  heatmap:{scroll_notice_map:'not_collect'},
  is_track_single_page:true,
  use_client_time:true,
  send_type:'beacon'    
});
// 注册全局属性
sensors.registerPage({
  version: version
});
// 标识用户
const createUuid = () => {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x7) | 0x8).toString(16);
  });
  return uuid;
};
const getUuid = () =>
  new Promise((resolved) => {
    chrome.storage.sync.get("scDataDecoderUuid", (res) => {
      if (res && res.scDataDecoderUuid) {
        resolved(res.scDataDecoderUuid);
      } else {
        let uuid = createUuid();
        setUuid(uuid);
        resolved(uuid);
      }
    });
  });
const setUuid = (val) => {
  chrome.storage.sync.set({ scDataDecoderUuid: val });
};
// 解析token获取用户基本信息
const parseJwt = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(jsonPayload);
};
const getUserInfo = async () => {
  let { authorization } = await chrome.storage.sync.get(['authorization'])
  if (authorization) {
    const { name, email, employee_id } = parseJwt(authorization.substr(6));
    return {
      name,
      email,
      employeeId: employee_id,
    };
  } else {
    return {};
  }
};
const initTrack = async () => {
  const uuid = await getUuid();
  sensors.login(uuid);
};

initTrack()

export const track = async (params) => {
  let { eventName, eventType = "页面访问" } = params;
  const { name, email, employeeId} = await getUserInfo();
  sensors.track("CheckReleaseAnaly", {
    eventName,
    eventType,
    userName: name,
    email,
    employeeId,
  });
};

