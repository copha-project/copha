---
title: "Project"
description: "Project Docs"
show_home: true
permalink: /project
---

# 项目
项目是 copha 中的最高层的管理形式，项目管理用户定义的工作流程和数据，通过 copha 能够创建，运行，删除项目。
项目包含特定的任务，任务通过创建项目时指定。一个项目有且包含一个任务。更多关于 **任务** 的介绍请访问：[copha.net/task](https://copha.net/task)

> 通过分离任务逻辑代码和项目状态数据，减少两者间的耦合，可以使任务能以包的形式提供高效的复用效率。

## 使用
### 创建项目
```
copha create project_name -t empty
```
> 使用 **-t** 说明使用的任务包， 默认使用系统内置的 *empty* 任务包

### 配置
打开项目配置文件
```
copha config project_name
```
配置项解释
* main

|字段 |格式 | 说明|
|-|-|-|
|name | 字符串|项目名称|
|desc | 字符串|项目描述 |
|createTime|Date|创建时间 |
|dataPath |系统绝对路径|项目数据保存路径|
|debug |Bool|调试模式 |
|useProxy |Bool |使用代理|
|driver|String |使用网络驱动 |
|task|String |使用任务包|
