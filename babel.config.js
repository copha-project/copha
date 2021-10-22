module.exports = {
    "presets": ["@babel/preset-env"],
    "assumptions": {
        "setPublicClassFields": true
    },
    "plugins": [
        ["@babel/plugin-proposal-decorators", {
            "legacy": true
        }],
        ["@babel/plugin-proposal-class-properties"],
        ["conditional-compile", {
            "define": {
              "IS_DEV": process.env.NODE_ENV === "development"
            }
        }]
    ],
    "targets": {
        "node": "12"
    }
}
