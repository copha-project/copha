# Copha
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha?ref=badge_shield)

## Copha is a general framework for running custom network tasks.

> ⚠️ [Usage Warning](https://copha.net/usage_warning)

> Read this in other languages: English ｜ [简体中文](./README_zh.md)

## Getting Started
### 1. Installation
```
npm i -g copha
# or "yarn global add copha"
```

### 2. Command line usage
```
copha -h
```
more help about command line [copha.net/cli](https://copha.net/cli)

## How to develop

```
git clone https://github.com/copha-project/copha
cd copha
git submodule update --init
yarn install
ln -s "$PWD" "$HOME/.node_modules/copha" # for work with require('copha')
. dev.env.sh
copha
```

## Resources
* [Home Page](https://copha.net)
* [API Documents](https://copha.net/api)
* [Configure](https://copha.net/configure)
* [Environment](https://copha.net/env)
* [Examples](https://copha.net/examples)


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fcopha-project%2Fcopha?ref=badge_large)
