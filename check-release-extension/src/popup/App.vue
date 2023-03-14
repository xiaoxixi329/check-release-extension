<template>
  <div class="popup">
    <template v-if="authorization">
      <el-form inline>
        <el-form-item label="AppId:">
          <el-input v-model="baseParams.appid" style="width: 250px"></el-input>
        </el-form-item>
        <el-form-item label="环境:">
          <el-select v-model="baseParams.env" style="width: 120px">
            <el-option label="work" value="work"></el-option>
            <el-option label="tuhutest" value="tuhutest"></el-option>
            <el-option label="ut" value="ut"></el-option>
            <el-option label="prod" value="prod"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="check">检查</el-button>
        </el-form-item>
      </el-form>
      <div class="show-wrap">
        <h2>检查结果</h2>
        <div v-if="!checkResult">发布成功！</div>
        <div v-else>发布失败</div>
      </div>
    </template>
    <template v-else>
      请先打开/刷新
      <a href='https://developer.tuhuyun.cn/#/' target='_blank'>发布系统</a>页面，再使用本插件！
    </template>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      baseParams: {
        appid: '',
        env: '',
      },
      authorization: '',
      resultMap: [],
    }
  },
  mounted() {
    // 获取token
    // eslint-disable-next-line no-undef
    chrome.runtime.sendMessage({}, (data) => {
      this.authorization = data
    })
  },
  methods: {
    async check() {
      const { task_id, deploy_main_id } = await this.getLogList()
      const operationList = await this.getLogOperationList(task_id, deploy_main_id)
      // await this.getLogOperationData(task_id, deploy_main_id, operationList[0].operation)
      for(let { operation, status } of operationList) {
        if(status !== 'Success') {
          this.resultMap.push({
            operation: operation,
            log: '',
            result: status,
          })
          break;
        } else {
          const res = await this.getLogOperationData(task_id, deploy_main_id, operation)
          if(!res) {
            break;
          }
        }
      }
    },
    //请求函数
    async request ({url, params={}, method='POST'}) {
      const init = {
        method,
        headers: {
          authorization: this.authorization,
          "Content-Type": "application/json",      
        },
        body: JSON.stringify(params),
      }
      if(method === 'GET') {
        delete init.body
      }
      const res = await fetch(url, init)
      if (res.status === 401) {
        this.authorization = null
      } else {
        return await res.json();
      }
    },
    // 获取某个appid某个环境最新的一条发布记录
    async getLogList () {
      if(!(this.baseParams.appid && this.baseParams.env)) return
      const { code, data } = await this.request({
        url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logList',
        params: this.baseParams
      })
      if(code === 20000) {
        return data?.logList[0] || {}
      }
      return {}
    },
    // 获取某发布记录的过程节点
    async getLogOperationList (taskId, deployMainId) {
      if(!(taskId && deployMainId)) return
      const { code, data } = await this.request({
        url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logOperationList',
        params: {
          ...this.baseParams,
          taskId,
          deployMainId
        }
      })
      if(code === 20000) {
        return data?.operationList || []
      }
      return []
    },
    // 获取某个节点的发布日志
    async getLogOperationData (taskId, deployMainId, operation) {
      if(!(taskId && deployMainId && operation)) return
      const { code, data } = await this.request({
        url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logOperationData',
        params: {
          ...this.baseParams,
          taskId,
          deployMainId,
          operation
        }
      })
      if(code === 20000) {
        let result = this.analyze(data.log)
        this.resultMap.push({
          operation: data.operation,
          log: data.log,
          result: result ? 'Success' : 'Error',
        })
        return result
      }
    },
    analyze(log) {
      return log.indexOf('error') == -1 && log.indexOf('fail') == -1
    },
    checkResult() {
      console.log(this.resultMap);
      return !!(this.resultMap.find(item => {
        return item.result !== 'Success'
      }))
    }
  }
};
</script>

<style>
html {
  width: 650px;
  height: 400px;
}
</style>
