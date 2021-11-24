---
title: "配置"
description: ""
nav_order: 1
lang: "zh"
parent: "项目"
---

# 全局和项目的配置说明

## Global Settings
### 1. Location
All global system configuration are stored in a directory called **.copha**, which is created in the user's home directory folder during installation.

### 2. How to edit

run command to open the global configuration file
```
copha config
```

### 3. Configuration item explanation

- Editor
- DataPath

    store all data of project.
    > the value can keep blank if [COPHA_DATA_PATH](/env#COPHA_DATA_PATH) was set
- Language

    value: [en(default),cn]

    Set the language used by the software
    > the value can keep blank if [COPHA_LANG](/env#COPHA_LANG) was set
- Driver
 - Default

   Tasks used by default when creating a project, default use [*simple-driver*](https://copha.net)

- Storage
- Server

- Proxy

## Project Settings
### 1. Location
The project configuration file is stored in the `config` folder under the project root directory.

### 2. How to edit

Run the command to open the project configuration file
```
copha config project_name
```

### 3. Configuration item explanation

- Main
 - name

    项目名字
 - desc

    项目描述
 - createTime

    创建时间
 - dataPath

    项目数据目录
 - debug

    调试开关
 - proxy

    启用代理
 - driver

    驱动模块
 - task

    任务模块

- Driver

    驱动模块配置项，具体内容参考使用的模块配置说明

- Task

    任务模块配置项，具体内容参考使用的模块配置说明
- Storage
 - Name

    存储模块名称，默认值使用本地文件存储

- Proxy
