<template>
  <div class="popup"
    v-loading="loading"
    element-loading-text="检查中"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <template v-if="authorization">
      <el-form
        ref="baseParams"
        :model="baseParams"
        inline
      >
        <el-form-item
          prop="appid"
          label="AppId:"
          :rules="[{ required: true, message: '请先输入AppId', trigger: 'change'}]"
        >
          <SearchId
            v-model="baseParams.appid"
            :authorization="authorization"
            @unauth="authorization = null"
            @change="(id) => baseParams.appid = id"
          />
          <!-- <el-input v-model="baseParams.appid" style="width: 250px"></el-input> -->
        </el-form-item>
        <el-form-item
          prop="env"
          label="环境:"
          :rules="[{ required: true, message: '请先输入AppId', trigger: 'change'}]"
        >
          <el-select v-model="baseParams.env" style="width: 120px">
            <el-option label="work" value="work"></el-option>
            <el-option label="tuhutest" value="tuhutest"></el-option>
            <el-option label="ut" value="ut"></el-option>
            <el-option label="prod" value="prod"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="id:">
          <el-input v-model="deployMainId" style="width: 120px"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="check">检查</el-button>
        </el-form-item>
      </el-form>
      <el-descriptions title="发布信息" v-if="user" :column="2">
        <el-descriptions-item label="appid">{{ baseParams.appid }}</el-descriptions-item>
        <el-descriptions-item label="环境">{{ baseParams.env }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ user }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ time }}</el-descriptions-item>
      </el-descriptions>
      <div
        v-if="(logMap && logMap.length) || statusText"
        class="show-wrap"
      >
        <div class="title">检查结果</div>
        <!-- <div v-for="(item, index) in logMap" :key="index">{{ item.result }}</div> -->
        <div v-if="!loading && statusText">
          <el-tag type="warning">{{ statusText }}</el-tag>
        </div>
        <div v-else-if="!errorItem">
          <el-tag type="success">发布成功</el-tag>
        </div>
        <div v-else>
          <el-tag type="danger">发布可能存在失败，请检查！</el-tag>
          <div class="margin10">
            点击直达：<a :href="`https://developer.tuhuyun.cn/#/app/${baseParams.appid}/${baseParams.env}/deployment?taskId=${errorItem.taskId}&deployMainId=${errorItem.deployMainId}`" target='_blank'>发布失败站点</a>
          </div>
          <div class="margin10">
            失败节点：{{ errorItem.operation }}
          </div>
          <div class="margin10">
            节点日志：
            <div class="content">{{ errorItem.log }}</div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <el-alert
        type="warning"
        :closable="false"
      >
        <slot>
          请先打开/刷新
          <a href='https://developer.tuhuyun.cn/#/' target='_blank'>发布系统</a>页面，再使用本插件！
        </slot>
      </el-alert>
    </template>
  </div>
</template>

<script>
import SearchId from '@/components/SearchId.vue'
export default {
  name: 'App',
  components: {
    SearchId,
  },
  data() {
    return {
      baseParams: {
        appid: '',
        env: '',
      },
      authorization: '',
      logMap: [],
      loading: false,
      statusText: '',
      user: '',
      time: '',
      errorItem: null,
      deployMainId: ''
    }
  },
  mounted() {
    // 获取token
    // eslint-disable-next-line no-undef
    chrome.storage.sync.get(['authorization']).then((data) => {
      this.authorization = data?.authorization || null
    })
  },
  methods: {
    check() {
      this.logMap = []
      this.statusText = ''
      this.$refs.baseParams.validate(async (valid) => {
        if(valid) {
          this.loading = true
          const logItem = await this.getLogList()
          const operationList = await this.getLogOperationList(logItem)
          for(let { operation } of operationList) {
            const res = await this.getLogOperationData(logItem.task_id, logItem.deploy_main_id, operation)
            if(!res) {
              break;
            }
          }
          this.checkResult()
          this.loading = false
        }
      })
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
        let checkItem = data?.logList[0]
        if(this.deployMainId) {
          checkItem = data?.logList.find(({deploy_main_id}) => {
            return deploy_main_id == this.deployMainId
          })
        }
        console.log(checkItem);
        this.user = checkItem?.user
        this.time = checkItem?.start_time
        return checkItem || {}
      }
      return {}
    },
    // 获取某发布记录的过程节点
    async getLogOperationList ({task_id, deploy_main_id, status, statusText}) {
      if(['stop', 'error', 'warn', 'wait', 'start'].includes(status.toLowerCase())) {
        this.statusText = statusText
        return []
      }
      if(!(task_id && deploy_main_id)) return []
      const { code, data } = await this.request({
        url: 'https://developer-bff.tuhuyun.cn/web_api/deploy/logOperationList',
        params: {
          ...this.baseParams,
          taskId: task_id,
          deployMainId: deploy_main_id
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
        this.logMap.push({
          operation: data.operation,
          log: data.log,
          result: result ? 'Success' : 'Error',
          taskId,
          deployMainId
        })
        return result
      }
    },
    analyze(log) {
      return log.indexOf('error') == -1 && log.indexOf('fail') == -1 && log.indexOf('mismatch') == -1
    },
    checkResult() {
      this.errorItem = this.logMap.find(item => {
        return item.result === 'Error'
      })
    }
  }
};
</script>

<style>
.popup {
  display: flex;
  flex-direction: column;
  width: 780px;
  height: 400px;
  color: #606266;
  font-weight: 400;
  line-height: 1.5;
  font-size: 14px;
}
.show-wrap {
  flex: 1;
}
.content {
  height: 200px;
  overflow: scroll;
  white-space: pre-line;
  border: 1px solid #b4bccc;
  border-radius: 5px;
  padding: 5px 15px;
  margin: 10px 0;
}
.title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin: 20px 0;
}
.margin10 {
  margin-top: 10px;
}
</style>
