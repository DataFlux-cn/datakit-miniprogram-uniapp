//index.js
//获取应用实例
const app = getApp()
Page({
	data: {
		motto: 'Hello World',
		userInfo: {},
		hasUserInfo: false,
		canIUse: wx.canIUse('button.open-type.getUserInfo'),
	},
	bindSetData: function () {
		this.setData({motto: 'hahhah'})
	},

	onAddToFavorites(res) {
    // webview 页面返回 webViewUrl
    console.log('webViewUrl: ', res.webViewUrl)
    return {
      title: '自定义标题',
      imageUrl: 'http://demo.png',
      query: 'name=xxx&age=xxx',
    }
	},
	onShareAppMessage() {
    const promise = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          title: '自定义转发标题'
        })
      }, 2000)
		})
		console.log('分享app')
    return {
      title: '自定义转发标题',
      path: '/page/user?id=123',
      promise 
    }
	},
	onShareTimeline() {
		console.log(111111,'分享朋友圈')
		return {
      title: '自定义标题',
      imageUrl: 'http://demo.png',
      query: 'name=xxx&age=xxx',
    }
	},
	onTabItemTap(item) {
    console.log(item.index)
    console.log(item.pagePath)
    console.log(item.text)
  },
	//事件处理函数
	bindViewTap: function () {
		wx.request({
			url: 'https://www.xxxxx.com/test',
		})
		wx.downloadFile({
			url: 'https://www.xxxxx.com/sdtf',
		})
	},
	onError: function () {
		console.log(arguments, 'arguments')
	},
	onLoad: function () {
		console.log(getCurrentPages(), 'getCurrentPages')
		console.error('xxxxxxx')
		const xxx = sdfs

		if (app.globalData.userInfo) {
			this.setData({
				userInfo: app.globalData.userInfo,
				hasUserInfo: true,
			})
		} else if (this.data.canIUse) {
			// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
			// 所以此处加入 callback 以防止这种情况
			app.userInfoReadyCallback = (res) => {
				this.setData({
					userInfo: res.userInfo,
					hasUserInfo: true,
				})
			}
		} else {
			// 在没有 open-type=getUserInfo 版本的兼容处理
			wx.getUserInfo({
				success: (res) => {
					app.globalData.userInfo = res.userInfo
					this.setData({
						userInfo: res.userInfo,
						hasUserInfo: true,
					})
				},
			})
		}
	},
	getUserInfo: function (e) {
		console.log(e)
		app.globalData.userInfo = e.detail.userInfo
		this.setData({
			userInfo: e.detail.userInfo,
			hasUserInfo: true,
		})
	},
})
