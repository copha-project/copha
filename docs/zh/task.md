---
title: "任务"
description: ""
nav_order: 1
lang: "zh"
parent: "模块"
---

# 任务（Task）
任务是项目（[Copha Project](./project)）的主要组成部分，任务决定了项目的业务逻辑 ，每个任务只属于一个项目。

Copha 提供了一个基础的任务模板，你可以克隆或者下载此项目，在此基础上编写自己的特定任务。

> 任务模块也是标准的 Copha 模块

## 命令行操作
* 查看 Copha 中存在的任务模块信息
	 ```
	 copha list -t task
	 ```
 
* 导入第三方任务模块
	```
	copha load xxx-task
	```

* 创建项目时使用指定的任务模块
	```
	copha create project-name -t xxx-task
	```
	
	> 未使用 **-t** 选项时，会默认使用系统内置的基础任务模块。

## 接口说明
- ###  Class: Task
- task.name（只读）

	常量：任务模块名称

- task.projectName

	常量：项目名称（只读）

- task.projectConfig

	常量：项目配置数据对象（只读）

- task.config

	常量：任务配置数据对象（只读）

- task.runBefore()

	运行任务前调用

- task.runTest()

	任务测试接口

- task.run()

	任务执行接口
