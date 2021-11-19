---
title: "Copha API"
description: ""
show_home: true
---

## API 列表

* 系统级接口
	* 系统配置信息操作
		* [获取系统配置](#获取系统配置)
	* [获取项目列表](#获取项目列表)
	* 获取任务模块列表
	* 获取驱动模块列表
	* 获取存储模块列表
* 项目级
	* 创建项目
	* 项目配置文件操作
		* [获取项目配置](#获取项目配置)
		* 修改配置
	* 项目启动
	* 项目重启
	* 项目停止
	* 删除项目
	* 获取项目运行日志
	* 从备份文件导入项目
	* 导出项目备份文件
* 其他
	* 关闭API服务
​

## API 具体说明
### 获取系统配置
`GET` `/api/settings`​

### 获取项目列表
`GET` `/api/projects`

### 获取项目配置
`GET` `/api/projects/{name}`