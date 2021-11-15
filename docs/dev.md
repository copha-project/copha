---
title: "Development"
description: "Development docs"
show_home: true
---

# 开发指导
copha 自身只包含了基础框架功能，它在设计上把任务，驱动，存储等功能以模块的形式解耦，一方面使用者可以灵活的选择需要的功能模块加载使用，另一方面开发人员也能方便定制开发专属功能模块。

对于每个功能模块，copha 提供了对应的基础构建模板，你可以克隆或者下载对应模版在下面列表中，在此基础上实现特定功能。模块由多个文件组合而成，并且每个模块包都符合 npm 包格式标准（因此也可以使用 npm init 创建模块）。

| 模块 | 模版地址|
|--|--|
| 任务模块 | [copha-project/task](https://github.com/copha-project/copha) |
| 驱动模块 | [copha-project/driver](https://github.com/copha-project/copha) |
| 存储模块 | [copha-project/storage](https://github.com/copha-project/copha) |


## 模块包结构
### 1. 包元信息
因为模块都是标准的 npm 包，因此包描述元信息也直接复用了 **package.json** 中的相关字段来存储，相关复用字段解释如下：

| 字段 | 说明|
|--|--|
| name | 包名 |
| description | 描述信息 |
| version| 版本号 |

### 2. 业务代码
存在包根目录的 **src** 文件夹中，**src** 中包含以下文件或者文件夹:

| 名称 | 类型 | 说明|
|--|--|--|
| resource | 文件夹 | 存放模块所需要的相关资源，存放内容，格式，形式由开发者定义，资源访问方式参考 [getResource](#getResource) API |
| index.js| JS文件 | 模块加载入口，需导出一个类，该类需实现功能的相关接口。具体参考 **接口说明** 部分|
| config.json| JSON文件 | 模块配置文件，包含一个标准的 JSON 对象，内容为模块使用时所需要提供的配置字段，这些配置信息将会出现在项目配置文件中 |

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

## 接口说明

### 任务
- ###  Class: Task
- task.name（只读）

	常量：任务名称（只读）

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

- task.getResourcePath(filename[,type])
	- filename [<string\>]
	- type [<string\>] **Default:** `'json'`

	获取资源文件路径
- task.getResource(resourcePath)

获取资源文件数据

### 驱动
### 存储
