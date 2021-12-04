---
title: "驱动"
description: ""
nav_order: 2
parent: "模块"
lang: "zh"
---

# 驱动（Driver）
Copha 项目（[Project](./project)）中涉及到的网络请求，浏览器操作等功能都由驱动统一提供。

Copha 内置了一个基础网络驱动: [simple-driver](https://github.com/copha-project/simple-driver). 可提供基础的网络数据请求操作。

> 驱动模块也是标准的 Copha 模块

## 如何使用驱动

### 1. 查看当前可用的驱动模块信息
 ```shell
 copha list -t driver
 ```
 
### 2. 导入第三方驱动
```shell
copha load driver-name
```
> 具体加载用法请访问：[驱动加载](./cli#load)

### 3. 切换使用指定驱动
```shell
copha config project-name -s driver=driver-name
```
	
## 驱动模块接口
### Class: Driver
- driver.name（只读）

	常量：模块名称（只读）

- driver.projectConfig

	常量：项目配置数据对象（只读）
- driver.config 

	常量：驱动配置数据对象（只读）
	
- driver.open(url)

	打开 url
