"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dataMap = exports.commonTags = void 0;

var _enums = require("../helper/enums");

// 需要用双引号将字符串类型的field value括起来， 这里有数组标示[string, path]
var commonTags = {
  sdk_name: '_dd.sdk_name',
  sdk_version: '_dd.sdk_version',
  app_id: 'application.id',
  env: '_dd.env',
  version: '_dd.version',
  userid: 'user.user_id',
  session_id: 'session.id',
  session_type: 'session.type',
  is_signin: 'user.is_signin',
  device: 'device.brand',
  model: 'device.model',
  device_uuid: 'device.device_uuid',
  os: 'device.os',
  os_version: 'device.os_version',
  os_version_major: 'device.os_version_major',
  screen_size: 'device.screen_size',
  network_type: 'device.network_type',
  platform: 'device.platform',
  platform_version: 'device.platform_version',
  app_framework_version: 'device.framework_version',
  view_id: 'page.id',
  view_name: 'page.route',
  view_referer: 'page.referer'
};
exports.commonTags = commonTags;
var dataMap = {
  view: {
    type: _enums.RumEventType.VIEW,
    tags: {
      view_apdex_level: 'page.apdex_level',
      is_active: 'page.is_active'
    },
    fields: {
      page_fmp: 'page.fmp',
      first_paint_time: 'page.fpt',
      loading_time: 'page.loading_time',
      onload_to_onshow: 'page.onload2onshow',
      onshow_to_onready: 'page.onshow2onready',
      time_spent: 'page.time_spent',
      view_error_count: 'page.error.count',
      view_resource_count: 'page.error.count',
      view_long_task_count: 'page.long_task.count',
      view_action_count: 'page.action.count',
      view_setdata_count: 'page.setdata.count'
    }
  },
  resource: {
    type: _enums.RumEventType.RESOURCE,
    tags: {
      resource_type: 'resource.type',
      resource_status: 'resource.status',
      resource_status_group: 'resource.status_group',
      resource_method: 'resource.method',
      resource_url: 'resource.url',
      resource_url_host: 'resource.url_host',
      resource_url_path: 'resource.url_path',
      resource_url_path_group: 'resource.url_path_group',
      resource_url_query: 'resource.url_query'
    },
    fields: {
      resource_size: 'resource.size',
      resource_load: 'resource.load',
      resource_dns: 'resource.dns',
      resource_tcp: 'resource.tcp',
      resource_ssl: 'resource.ssl',
      resource_ttfb: 'resource.ttfb',
      resource_trans: 'resource.trans',
      resource_first_byte: 'resource.firstbyte',
      duration: 'resource.duration'
    }
  },
  error: {
    type: _enums.RumEventType.ERROR,
    tags: {
      error_source: 'error.source',
      error_type: 'error.type',
      resource_url: 'error.resource.url',
      resource_url_host: 'error.resource.url_host',
      resource_url_path: 'error.resource.url_path',
      resource_url_path_group: 'error.resource.url_path_group',
      resource_status: 'error.resource.status',
      resource_status_group: 'error.resource.status_group',
      resource_method: 'error.resource.method'
    },
    fields: {
      error_message: ['string', 'error.message'],
      error_stack: ['string', 'error.stack']
    }
  },
  long_task: {
    type: _enums.RumEventType.LONG_TASK,
    tags: {},
    fields: {
      duration: 'long_task.duration'
    }
  },
  action: {
    type: _enums.RumEventType.ACTION,
    tags: {
      action_id: 'action.id',
      action_name: 'action.target.name',
      action_type: 'action.type'
    },
    fields: {
      duration: 'action.loading_time',
      action_error_count: 'action.error.count',
      action_resource_count: 'action.resource.count',
      action_long_task_count: 'action.long_task.count'
    }
  },
  app: {
    alias_key: 'action',
    // metrc 别名,
    type: _enums.RumEventType.APP,
    tags: {
      action_id: 'app.id',
      action_name: 'app.name',
      action_type: 'app.type'
    },
    fields: {
      duration: 'app.duration'
    }
  }
};
exports.dataMap = dataMap;