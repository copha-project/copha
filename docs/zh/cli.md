---
title: "命令行帮助"
description: ""
nav_order: 6
lang: "zh"
---

# 命令行使用说明（Command Line tutorial）

### 1. help
```
copha -h
```

### 2. list
```
copha list [-options]
-a show all data.
-t [proejct,task,driver] show list with declare type.
```

### 3. config
```
copha config [project_name] [-options]

copha config # default edit global settings when no params

copha config project_name # edit project configure

-o # edit overwrite code

-d # edit export data code

-c # custom code

```

### 4. create
```
copha create [project_name] [-options]

copha create project_name # create project use name

-t task # create project with the specified task type

```

### 5. run
```
copha run [project_name] [-options]

copha run project_name # run project

-e # export data only

-c # run custom code only

-t # run project test

-d # run with daemon mode
```

### 6. stop
```
copha stop [project_name] [-options]

copha stop project_name # stop a running project

-r # stop and restart project
```

### 7. reset
```
copha reset [project_name] [-options]

copha reset project_name # reset a project state

--hard # reset state and delete all data of project
```

### 8. delete
```
copha delete [project_name]

copha delete project_name # delete a project
```

### 9. server
```
copha server [-options]

copha server # launch a web server of api at local

-p <7000> # specify the service port

-H <127.0.0.1> # specify the address bound to the service

-d # run service with deamon

-s # stop API service
```

### 10. load
```
copha load <resource_name> [-options]

-t [project,task,driver,storage] # declare the type of imported resource
```

### 11. export
```
copha export [project_name] [-options]

copha export project_name # export project item

-f # declare the absolute path of saved data

-d # export with data dir
```

### 12. logs
```
copha logs [project_name] [-options]

copha logs project_name # show project run logs
```
