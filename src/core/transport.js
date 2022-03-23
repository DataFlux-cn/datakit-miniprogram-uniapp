import {
	findByPath,
	escapeRowData,
	isNumber,
	each,
	isString,
	values,
	extend,
	isObject,
	isEmptyObject,
	isArray,
	isBoolean,
	toServerDuration
} from '../helper/utils'
import { sdk } from '../core/sdk'
import { LifeCycleEventType } from '../core/lifeCycle'
import { commonTags, dataMap } from './dataMap'
import { RumEventType } from '../helper/enums'

// https://en.wikipedia.org/wiki/UTF-8
var HAS_MULTI_BYTES_CHARACTERS = /[^\u0000-\u007F]/
var CUSTOM_KEYS = 'custom_keys'

function addBatchPrecision(url) {
	if (!url) return url
	return url + (url.indexOf('?') === -1 ? '?' : '&') + 'precision=ms'
}
var httpRequest = function (endpointUrl, bytesLimit) {
	this.endpointUrl = endpointUrl
	this.bytesLimit = bytesLimit
}
httpRequest.prototype = {
	send: function (data) {
		var url = addBatchPrecision(this.endpointUrl)
		sdk.request({
			method: 'POST',
			header: {
				'content-type': 'text/plain;charset=UTF-8',
			},
			url,
			data,
		})
	},
}

export var HttpRequest = httpRequest
export var processedMessageByDataMap = function (message) {
	if (!message || !message.type) return {
		rowStr: '',
		rowData: undefined
	}
	var rowData = { tags: {}, fields: {} }
	var hasFileds = false
	var rowStr = ''
	each(dataMap, function (value, key) {
		if (value.type === message.type) {
			if (value.alias_key) {
				rowStr += value.alias_key + ','
			} else {
				rowStr += key + ','
			}
			rowData.measurement = key
			var tagsStr = []
			var tags = extend({}, commonTags, value.tags)
			var filterFileds = ['date', 'type'] // 已经在datamap中定义过的fields和tags
			each(tags, function (value_path, _key) {
				var _value = findByPath(message, value_path)
				filterFileds.push(_key)
				if (_value || isNumber(_value)) {
					rowData.tags[_key] = _value
					tagsStr.push(escapeRowData(_key) + '=' + escapeRowData(_value))
				}
			})
			if (message.tags && isObject(message.tags) && !isEmptyObject(message.tags)) {
				// 自定义tag
				const _tagKeys = []
				each(message.tags, function (_value, _key) {
					// 如果和之前tag重名，则舍弃
					if (filterFileds.indexOf(_key) > -1) return
					filterFileds.push(_key)
					if (_value || isNumber(_value)) {
						_tagKeys.push(_key)
						rowData.tags[_key] = _value
						tagsStr.push(escapeRowData(_key) + '=' + escapeRowData(_value))
					}
				})
				if (_tagKeys.length) {
					rowData.tags[CUSTOM_KEYS] = _tagKeys
					tagsStr.push(escapeRowData(CUSTOM_KEYS) + '=' + escapeRowData(_tagKeys))
				}
			}
			var fieldsStr = []
			each(value.fields, function (_value, _key) {
				if (isArray(_value) && _value.length === 2) {
					var type = _value[0],
						value_path = _value[1]
					var _valueData = findByPath(message, value_path)
					filterFileds.push(_key)
					if (_valueData || isNumber(_valueData)) {
						rowData.fields[_key] = _valueData // 这里不需要转译
						_valueData =
							type === 'string'
								? '"' +
									_valueData.replace(/[\\]*"/g, '"').replace(/"/g, '\\"') +
									'"'
								: escapeRowData(_valueData)
						fieldsStr.push(escapeRowData(_key) + '=' + _valueData)
					}
				} else if (isString(_value)) {
					var _valueData = findByPath(message, _value)
					filterFileds.push(_key)
					if (_valueData || isNumber(_valueData)) {
						rowData.fields[_key] = _valueData // 这里不需要转译
						_valueData = escapeRowData(_valueData)
						fieldsStr.push(escapeRowData(_key) + '=' + _valueData)
					}
				}
			})
			if (message.type === RumEventType.LOGGER) {
				// 这里处理日志类型数据自定义字段

				each(message, function (value, key) {
					if (
						filterFileds.indexOf(key) === -1 &&
						(isNumber(value) || isString(value) || isBoolean(value))
					) {
						tagsStr.push(escapeRowData(key) + '=' + escapeRowData(value))
					}
				})
			}
			if (tagsStr.length) {
				rowStr += tagsStr.join(',')
			}
			if (fieldsStr.length) {
				rowStr += ' '
				rowStr += fieldsStr.join(',')
				hasFileds = true
			}
			rowStr = rowStr + ' ' + message.date
			rowData.time = toServerDuration(message.date) // 这里不需要转译
		}
	})
	return {
		rowStr: hasFileds ? rowStr : '',
		rowData: hasFileds ? rowData : undefined
	}
}
function batch(
	request,
	maxSize,
	bytesLimit,
	maxMessageSize,
	flushTimeout,
	lifeCycle,
) {
	this.request = request
	this.maxSize = maxSize
	this.bytesLimit = bytesLimit
	this.maxMessageSize = maxMessageSize
	this.flushTimeout = flushTimeout
	this.lifeCycle = lifeCycle
	this.pushOnlyBuffer = []
	this.upsertBuffer = {}
	this.bufferBytesSize = 0
	this.bufferMessageCount = 0
	this.flushOnVisibilityHidden()
	this.flushPeriodically()
}
batch.prototype = {
	add: function (message) {
		this.addOrUpdate(message)
	},

	upsert: function (message, key) {
		this.addOrUpdate(message, key)
	},

	flush: function () {
		if (this.bufferMessageCount !== 0) {
			var messages = this.pushOnlyBuffer.concat(values(this.upsertBuffer))
			this.request.send(messages.join('\n'), this.bufferBytesSize)
			this.pushOnlyBuffer = []
			this.upsertBuffer = {}
			this.bufferBytesSize = 0
			this.bufferMessageCount = 0
		}
	},
	
	processSendData: function (message) {
		return processedMessageByDataMap(message).rowStr
	},
	sizeInBytes: function (candidate) {
		// Accurate byte size computations can degrade performances when there is a lot of events to process
		if (!HAS_MULTI_BYTES_CHARACTERS.test(candidate)) {
			return candidate.length
		}
		var total = 0,
			charCode
		// utf-8编码
		for (var i = 0, len = candidate.length; i < len; i++) {
			charCode = candidate.charCodeAt(i)
			if (charCode <= 0x007f) {
				total += 1
			} else if (charCode <= 0x07ff) {
				total += 2
			} else if (charCode <= 0xffff) {
				total += 3
			} else {
				total += 4
			}
		}
		return total
	},

	addOrUpdate: function (message, key) {
		var process = this.process(message)
		if (!process.processedMessage || process.processedMessage === '') return
		if (process.messageBytesSize >= this.maxMessageSize) {
			console.warn(
				'Discarded a message whose size was bigger than the maximum allowed size' +
					this.maxMessageSize +
					'KB.',
			)
			return
		}
		if (this.hasMessageFor(key)) {
			this.remove(key)
		}
		if (this.willReachedBytesLimitWith(process.messageBytesSize)) {
			this.flush()
		}
		this.push(process.processedMessage, process.messageBytesSize, key)
		if (this.isFull()) {
			this.flush()
		}
	},
	process: function (message) {
		var processedMessage = this.processSendData(message)
		var messageBytesSize = this.sizeInBytes(processedMessage)
		return {
			processedMessage: processedMessage,
			messageBytesSize: messageBytesSize,
		}
	},

	push: function (processedMessage, messageBytesSize, key) {
		if (this.bufferMessageCount > 0) {
			// \n separator at serialization
			this.bufferBytesSize += 1
		}
		if (key !== undefined) {
			this.upsertBuffer[key] = processedMessage
		} else {
			this.pushOnlyBuffer.push(processedMessage)
		}
		this.bufferBytesSize += messageBytesSize
		this.bufferMessageCount += 1
	},

	remove: function (key) {
		var removedMessage = this.upsertBuffer[key]
		delete this.upsertBuffer[key]
		var messageBytesSize = this.sizeInBytes(removedMessage)
		this.bufferBytesSize -= messageBytesSize
		this.bufferMessageCount -= 1
		if (this.bufferMessageCount > 0) {
			this.bufferBytesSize -= 1
		}
	},

	hasMessageFor: function (key) {
		return key !== undefined && this.upsertBuffer[key] !== undefined
	},

	willReachedBytesLimitWith: function (messageBytesSize) {
		// byte of the separator at the end of the message
		return this.bufferBytesSize + messageBytesSize + 1 >= this.bytesLimit
	},

	isFull: function () {
		return (
			this.bufferMessageCount === this.maxSize ||
			this.bufferBytesSize >= this.bytesLimit
		)
	},

	flushPeriodically: function () {
		var _this = this
		setTimeout(function () {
			_this.flush()
			_this.flushPeriodically()
		}, _this.flushTimeout)
	},

	flushOnVisibilityHidden: function () {
		var _this = this
		/**
		 * With sendBeacon, requests are guaranteed to be successfully sent during document unload
		 */
		// @ts-ignore this function is not always defined
		this.lifeCycle.subscribe(LifeCycleEventType.APP_HIDE, function () {
			_this.flush()
		})
	},
}

export var Batch = batch
