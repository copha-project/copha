---
title: "Command line tutorial"
description: ""
show_home: true
---

# Command list

Show help
```
copha
// copha -h
```

List
```
copha list # show a list of task

copha list -t type # show a list of task types that can be used
```

Config
```
copha config  # edit global settings

copha config [task_name] # edit task configure

copha config [-o/d/c] # edit task other configure

```

Create Task
```
copha create [task_name]

copha create [task_name] [-t task_type] # create task with the specified type

```

Run
```
copha run [task_name]

copha run [task_name] -e # export data only

copha run [task_name] -c # run custom code only

copha run [task_name] -t # run task test

copha run [task_name] -d # run with daemon mode
```

Api server
```
copha server # launch a web server of api at local
```
