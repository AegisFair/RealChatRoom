const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const output = "dist";

module.exports = {
    context: path.resolve(), //explicitly CWD
    entry: {
        app: "./client/app.jsx"
    },
    output: {
        path: path.resolve(__dirname, output)
    },
    devtool: "inline-source-map",
    resolve: {
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                test: /.jsx?$/,
                use: {
                    loader: 'babel-loader',

                }
            }, {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '/dist/'
                        }
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "postcss-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin()
    ]
}