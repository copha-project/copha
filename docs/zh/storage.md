---
title: "存储"
description: ""
nav_order: 2
parent: "模块"
lang: "zh"
---

# 存储（Storage）

Copha 项目（[Project](./project)）中涉及到的文件，数据下载，存储等功能统一由存储模块提供。

Copha 内置了一个基础存储模块: [file-storage](https://github.com/copha-project/file-storage). 可在本地文件基础上提供数据存储，读取等操作。

> 存储模块也是标准的 Copha 模块

## 如何使用存储

### 1. 查看当前可用的存储模块信息
 ```shell
 copha list -t storage
 ```
 
### 2. 导入第三方存储
```shell
copha load storage-name
```
> 具体加载用法请访问：[存储加载](./cli#load)

### 3. 切换使用指定存储
```shell
copha config project-name -s storage=storage-name
```
	
## 存储模块接口
### Class: Storage
- storage.name（只读）

	常量：存储模块名称（只读）

- storage.projectConfig

	常量：项目配置数据对象（只读）
	
- storage.config 

	常量：存储配置数据对象（只读）
	
- storage.get(id)

	获取 id 对应数据
	
- storage.save(data, id)

	保存数据，可指定 id
	
- storage.delete(id)
	
	删除 id 对应数据
