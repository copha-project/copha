# 任务（Task）
任务是项目（project）的主要组成部分，任务决定了项目的业务逻辑 ，每个任务只属于一个项目。

copha 提供了一个基础的任务模板，你可以克隆或者下载此项目，在此基础上编写自己的特定任务。任务由多个文件组合而成，并且每个任务包都符合 npm 包格式标准（因此也可以使用 npm init 创建任务包），任务包可分发共享到网上，你也可以根据需求在 copha 中搜索并使用第三方发布的任务包。

## 任务包结构
1.包元信息
	因为任务包都是标准的 npm 包，因此任务包描述元信息直接复用 **package.json** 中的相关字段来存储，相关复用字段解释如下：

| 字段 | 说明|
|--|--|
| name | 包名
| description | 描述信息
| version| 版本号

2.业务代码
	存在包根目录的 **src** 文件夹中，**src** 中包含以下文件或者文件夹:

| 名称 | 类型 | 说明|
|--|--|--|
| resource | 文件夹 | 存放任务运行所需要的相关资源，存放内容，格式，形式由开发者定义，资源访问方式参考 [getResource](#getResource) API
| index.js| JS文件 | 任务的加载入口，此文件需导出一个任务类，该类需实现任务的相关接口。具体参考 **任务接口说明**
| config.json| JSON文件 | 任务配置项文件，包含一个标准的 JSON 对象，内容为任务运行所需要提供的配置字段，这些配置字段将会出现在项目配置中


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

## 使用
### 1. 查看任务包信息
 ```
 copha list -t task
 ```
### 2. 导入第三方任务包
```
copha load xxx-task -t task
```
### 3. 使用指定的任务包创建项目
```
copha create project-name -t xxx-task
```
> 未使用 **-t** 时，会默认使用系统内置的基础任务包。
	
## API
* Class: Task
- task.name
- task.projectName
- task.projectConfig
- task.config

- task.runBefore
- task.runTest
- task.run

- task.getResource(filename)
