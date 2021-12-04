---
title: "模块"
description: ""
nav_order: 5
lang: "zh"
has_children: true
---

# Copha 模块
模块是 copha 提供服务的主要构成要素，copha 的绝大部分功能由不同的模块提供，例如存储功能，copha 内置了一个简单的本地文件存储模块 [file-storage](https://github.com/copha-project/file-storage)，如果本地文件存储不能满足需求，也可以使用已注册的其他存储模块或者第三方模块。

## 查看模块列表
在 cli 下可以使用 `copha list -a` 查看模块列表，列表字段说明如下：

|(index) |Name | Ver | Default |Type| Loaded|
|--|--|--|--|--|--|
|序号|名字|版本号|是否为默认模块|模块类型|是否已加载|

> Type 值有 [内置，已注册，未注册] 三种

## 模块的格式和结构
### 1. 描述格式
模块由特定文件组合而成，并且模块都符合 npm 包格式标准。
因为模块是标准的 npm 包，所以模块描述元信息直接复用 **package.json** 中的相关字段，并且有额外字段添加，相关模块使用的字段解释如下：

| 字段 |是否复用| 说明|
|--|--|--|
| name |是| 模块名 |
|type|新增| 模块类型名|
| description |是 |描述信息 |
| version| 是 |版本号 |

### 2. 文件组织结构
| 名称 | 类型 | 说明|
|--|--|--|
| resource | 文件夹 | 存放模块所需要的相关资源，存放内容，格式，形式由开发者定义，资源访问方式参考 [getResource](#getResource) API |
| index.js| JS文件 | 模块的加载入口，此文件需导出一个类，该类需实现模块的相关接口。具体参考 **接口说明** |
| config.json| JSON文件 | 模块配置项文件，包含一个标准的 JSON 对象，内容为使用模块时所需要提供的配置字段，这些配置字段将会出现在项目配置中 |

> 在业务代码中使用配置值的示例：

```
# config.json
{
	"Key1": "Value"
}

# index.js
...
this.config.Key1
...
```

## 三种类型模块
### 1. 内置模块
这类模块与 copha 一起安装在本地，无需其他操作即可使用，但是功能比较简单，只提供了一些基本功能。这些基础模块有：

|功能|名称|描述|
|--|--|--|
|驱动|[simple-driver](https://github.com/copha-project/simple-driver)|提供基础的网络数据请求功能|
|存储|[file-storage](https://github.com/copha-project/file-storage)|提供基础的本地文件存储功能|
|任务|[copha-empty-task](https://github.com/copha-project/copha-empty-task)|一个简单的任务模块，创建项目时使用的默认任务|

### 2. 已注册模块
内置模块是指已经在 copha 中注册过的，可以先初始化然后直接使用的一类模块，在命令行中初始化已注册模块的方式如下：

```
copha load module-name --init
```

### 3. 第三方模块（未注册）
copha 使用的模块包封装符合 npm 包标准，因此只要是符合 npm 包标准的模块都可以导入 copha 并使用，各种来源的模块包支持情况如下：

|来源|是否支持|
|--|--|--|
|npmjs.com|是|
|zip文件|计划支持|
|github.com|计划支持|

导入方法：
```
copha load module-name
```
具体导入命令参考：[模块导入](./cli#module)
