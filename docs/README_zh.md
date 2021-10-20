# Copha
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha?ref=badge_shield)

## Copha 是一个可以运行自定义网络任务的通用框架

> ⚠️ [使用警告](https://copha.net/usage_warning)

> 可使用其他语言阅读: [English](./README.md) ｜ 简体中文

## 使用指南
### 1. 安装 Copha
```
npm i -g copha
# or "yarn global add copha"
```

### 2. 命令行操作
```
copha -h
```
更多命令行的使用帮助请访问 [copha.net/cli](https://copha.net/cli)

## 关于开发

```
git clone https://github.com/copha-project/copha
cd copha
git submodule update --init
yarn install
ln -s "$PWD" "$HOME/.node_modules/copha" # for work with require('copha')
. dev.env.sh
copha
```

## 相关资源链接
* [项目网站](https://copha.net)
* [API 文档](https://copha.net/api)
* [软件配置](https://copha.net/configure)
* [环境变量](https://copha.net/env)
* [使用案例](https://copha.net/examples)


## 软件许可
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha?ref=badge_large)
