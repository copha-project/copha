---
title: "通知"
description: ""
nav_order: 4
parent: "模块"
lang: "zh"
---

# 通知（Notification）

Copha 项目（[Project](./project)）需要发送各种通知或者提醒时，可以使用通知模块来统一提供相关功能。

Copha 内置了一个基础通知模块: [native-notification](https://github.com/copha-project/native-notification). 可通过本地通知来提示相关信息。

> 通知模块也是标准的 Copha 模块

## 如何使用驱动

### 1. 查看当前可用的通知模块信息
 ```shell
 copha list -t notification
 ```
 
### 2. 导入第三方通知模块
```shell
copha load notification-name
```
> 具体加载用法请访问：[通知模块加载](./cli#load)

### 3. 切换使用指定通知模块
```shell
copha config project-name -s notification=notification-name
```
	
## 通知模块接口
### Class: Notification
- notification.name（只读）

	常量：模块名称（只读）
	
- notification.config 

	常量：配置数据对象（只读）
	
- notification.send(msg)

	发送通知消息
