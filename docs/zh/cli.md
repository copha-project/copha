---
title: "命令行帮助"
description: ""
nav_order: 6
lang: "zh"
---

# 命令行使用说明（Command Line tutorial）

### 1. help（查看帮助）
```
copha -h
```

### 2. list（显示数据命令）
```shell
copha list [-options]
-a # 显示所有数据列表
-t [proejct,task,driver] # 显示指定类型数据列表
```

### 3. config（配置命令）
```shell
copha config [project_name] [-options]

copha config # 编辑全局配置

copha config project_name # 编辑项目配置

-c # 编辑项目自定义脚本文件
```

### 4. create（创建项目命令）
```
copha create [project_name] [-options]

copha create project_name # 创建项目

-t task # 指定创建项目使用的任务模块
```

### 5. run（运行项目命令）
```
copha run [project_name] [-options]

copha run project_name # 运行项目

-e # 导出项目结果数据

-c # 运行项目自定义脚本

-t # 运行项目测试

-d # 后台运行项目
```

### 6. stop（停止项目命令）
```
copha stop [project_name] [-options]

copha stop project_name # 停止后台运行的项目

-r # 重启后台运行的项目
```

### 7. delete（删除项目命令）
```
copha delete [project_name]

copha delete project_name # 删除项目
```

### 8. server（API 服务器命令）
```
copha server [-options]

copha server # 启动一个本地运行的 API 服务器

-p <7000> # 指定运行端口（默认为：7000）

-H <127.0.0.1> # 指定服务运行绑定的 IP 地址（默认为：127.0.0.1）

-d # 运行 API 服务器在后台

-s # 停止后台运行的 API 服务器
```

### 10. load（资源导入命令）
```
copha load <resource_name>

copha load resource_name # 导入项目或者模块，资源格式说明如下：
```

|导入内容|格式|包要求|
|-|-|-|
|项目包|导入包的本地绝对路径|.zip 格式|
|模块|在 [npm](https://npmjs.com) 上的包名|是标准的 Copha [模块](./module)|

### 11. export（资源导出命令）
```
copha export [project_name] [-options]

copha export project_name # 导出项目

-f # 导出项目到指定本地路径

--ignore-data # 忽略项目运行数据
```

### 12. logs（日志命令）
```
copha logs [project_name] [-options]

copha logs project_name # 显示后台运行的项目日志
```
