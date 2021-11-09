module.exports = {
    "presets": ["@babel/preset-env"],
    "assumptions": {
        "setPublicClassFields": true
    },
    "plugins": [
        ["@babel/plugin-proposal-decorators", {
            "legacy": true
        }],
        ["@babel/plugin-proposal-class-properties"]
    ],
    "targets": {
        "node": "12"
    }
}
