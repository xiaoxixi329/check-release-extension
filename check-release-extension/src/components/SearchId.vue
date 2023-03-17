<template>
  <el-select
    v-model="appId"
    filterable
    remote
    reserve-keyword
    default-first-option
    placeholder="AppId 快速搜索"
    :remote-method="remoteTraderMethod"
    :loading="loading"
    loading-text="搜索中..."
    clearable
    @change="chosenId"
    @focus="clearData"
    style="width: 230px"
  >
    <el-option
      v-for="item in appIdOptions"
      :key="item.appid"
      :label="item.appid || ''"
      :value="item.appid"
    >
    </el-option>
  </el-select>
</template>
<script>
export default {
  props: {
    value: {
      type: String,
      default: null,
    },
    authorization: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      appId: this.value || null,
      loading: false,
      appIdOptions: [],
    }
  },
  methods: {
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
        this.$emit('unauth')
      } else {
        return await res.json();
      }
    },
    //门店搜索
    async remoteTraderMethod(query) {
      if (query && query.length > 1) {
        this.loading = true;
        const { code, data } = await this.request({
          url: `https://developer-bff.tuhuyun.cn/int-service-arch-developer-java/v1/developer/appids?appId=${query}&page=1&pageSize=10`,
          method: 'GET'
        })
        if(code === 20000) {
          this.appIdOptions = data.list || []
        }
        this.loading = false;
      } else {
        this.appIdOptions = [];
      }
    },
    chosenId(id) {
      this.$emit('change', id)
    },
    clearData() {
      if((this.appId && !this.appId.length) || !this.appId) {
        this.appIdOptions = []
      }
    },
    resetData() {
      this.appId = null,
      this.appIdOptions = []
    },
  },
}
</script>