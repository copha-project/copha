---
title: "Copha 模块介绍"
description: ""
show_home: true
---

## Copha 模块介绍
模块是 copha 提供服务的主要构成要素，copha 的绝大部分功能由不同的模块提供，例如存储功能，copha 内置了一个简单的本地文件存储模块 [file-storage](https://github.com/copha-project/file-storage)，如果本地文件存储不能满足需求，也可以使用已注册的其他存储模块或者第三方模块。

### 查看模块列表
在 cli 下可以使用 `copha list -a` 查看模块列表，列表字段说明如下：

|(index) |Name | Ver | Default |Type| Loaded|
|--|--|--|--|--|--|
|序号|名字|版本号|是否为默认模块|模块类型|是否已加载|

> Type 值有 [内置，已注册，未注册] 三种

### 三种类型的模块
#### 1. 内置模块
这类模块与 copha 一起安装在本地，无需其他操作即可使用，但是功能比较简单，只提供了一些基本功能。这些基础模块有：

|功能|名称|描述|
|--|--|--|
|驱动|[simple-driver](https://github.com/copha-project/simple-driver)|提供基础的网络数据请求功能|
|存储|[file-storage](https://github.com/copha-project/file-storage)|提供基础的本地文件存储功能|
|任务|[copha-empty-task](https://github.com/copha-project/copha-empty-task)|一个简单的任务模块，创建项目时使用的默认任务|

#### 2. 已注册模块
内置模块是指已经在 copha 中注册过的，可以先初始化然后直接使用的一类模块，在命令行中初始化已注册模块的方式如下：

```
copha load module-name --init
```

#### 3. 第三方模块（未注册）
copha 使用的模块包封装符合 npm 包标准，因此只要是符合 npm 包标准的模块都可以导入 copha 并使用，各种来源的模块包支持情况如下：

|来源|是否支持|
|--|--|--|
|npmjs.com|是|
|zip文件|计划支持|
|github.com|计划支持|

导入方法：
```
copha load module-link
```
具体导入命令参考：[模块导入](./cli)